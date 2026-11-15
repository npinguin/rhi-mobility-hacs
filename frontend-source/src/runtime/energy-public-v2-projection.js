// Cross-domain Energy canonical-property projection for Mobility UX.
// Never read the retired aggregate publication or infer missing semantics.
class HomeBrainEnergyCanonicalProjection {
  constructor(hass = {}) { this.hass = hass || {}; }
  static get contractId() { return 'RHI_ENERGY_CANONICAL_PROPERTY_V2'; }
  canonicalRows() {
    const published=Object.entries(this.hass?.states || {}).flatMap(([entityId, state]) => {
      const a=state?.attributes || {};
      if(a.canonical_contract !== HomeBrainEnergyCanonicalProjection.contractId ||
         !a.asset_id || !a.property_key) return [];
      const raw=String(state?.state ?? '').trim().toLowerCase();
      const availability=String(a.availability || '').toUpperCase();
      const quality=String(a.quality || '').toUpperCase();
      const semantic=Object.hasOwn(a,'value')?a.value:state.state;
      const invalidValue=semantic===undefined || semantic===null ||
        (typeof semantic==='string' && ['unknown','unavailable','none','null',''].includes(semantic.trim().toLowerCase()));
      const valid=!['unknown','unavailable','none','null',''].includes(raw) && !invalidValue &&
        (availability === '' || availability === 'AVAILABLE') &&
        !['STALE','INVALID','UNKNOWN'].includes(quality);
      return [Object.freeze({entity_id:entityId,asset_id:String(a.asset_id),
        property_key:String(a.property_key),value:valid?semantic:null,
        availability:valid?'AVAILABLE':'UNAVAILABLE',
        presentation_family:a.presentation_family || '',
        presentation_role:a.presentation_role || '',
        presentation_surface:a.presentation_surface || '',
        // Only explicit backend metadata may bind a reading to a time period
        // or a configuration editor. Property-key substrings have no authority.
        period_id:String(a.period_id || ''),
        unit:String(a.unit || a.unit_of_measurement || ''),
        asset_display_name:String(a.asset_display_name || ''),
        friendly_name:String(a.friendly_name || a.presentation_label || ''),
        display_name:String(a.display_name || ''),
        editable:a.editable === true || a.write_supported === true})];
    });
    // No arbitrary winner when the same asset/property is published twice.
    const counts=new Map();
    for(const row of published) {
      const key=`${row.asset_id}::${row.property_key}`;
      counts.set(key,(counts.get(key)||0)+1);
    }
    return published.filter(row=>counts.get(`${row.asset_id}::${row.property_key}`)===1);
  }
  // Energy publishes D0/D1 planning totals as native metrics rather than
  // synthetic D0/D1 canonical assets. Only exact producer-owned keys qualify.
  nativeMetric(metricKey='') {
    const key=String(metricKey||'').trim();
    const matches=Object.entries(this.hass?.states||{}).filter(([,state])=>
      state?.attributes?.canonical_source==='rhi_energy.runtime' &&
      String(state?.attributes?.metric_key||'')===key);
    if(!key || matches.length!==1) return Object.freeze({available:false,value:null,
      reason:matches.length>1?'duplicate_native_energy_metric':'native_energy_metric_not_published'});
    const [entityId,state]=matches[0];
    const attrs=state?.attributes||{};
    const raw=String(state?.state??'').trim();
    const numeric=raw && !['unknown','unavailable','none','null'].includes(raw.toLowerCase()) ? Number(raw) : NaN;
    const quality=String(attrs.quality||'').trim().toUpperCase();
    const valid=String(attrs.availability||'').toUpperCase()==='AVAILABLE' &&
      Number.isFinite(numeric) && !['STALE','INVALID','UNKNOWN'].includes(quality);
    return Object.freeze({available:valid,value:valid?numeric:null,
      entity_id:entityId,unit:String(attrs.unit_of_measurement||''),
      reason:valid?'':String(attrs.reason_code||'native_energy_metric_unavailable'),
      provenance:attrs.provenance||null});
  }
  object(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value !== 'string') return {};
    try { const parsed=JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch (_) { return {}; }
  }
  rows(value) {
    if (value === undefined) return this.canonicalRows();
    if (Array.isArray(value)) return value.filter(row=>row && typeof row==='object');
    const parsed=this.object(value);
    return Object.values(parsed).filter(row=>row && typeof row==='object');
  }
  // Energy owns these revisions. Mobility's canonical property index cannot
  // invalidate a cross-domain planning/insights/strategy screen.
  revisionSignature(surface='planning') {
    const wanted=String(surface||'').toLowerCase();
    const rows=[];
    for(const [entityId,state] of Object.entries(this.hass?.states||{})) {
      const a=state?.attributes||{};
      const native=a.canonical_source==='rhi_energy.runtime' &&
        (wanted==='planning'
          ? (String(a.metric_key||'').startsWith('planning_') ||
             ['RHI_ENERGY_PLANNING_HORIZON_V1','RHI_ENERGY_BASELINE_PLANNING_HORIZON_V1'].includes(a.canonical_contract))
          : wanted==='history' || wanted==='insights'
            ? (!!String(a.metric_key||'') ||
               (a.contract_id==='RHI_ENERGY_METERING_PERIOD_V1' && a.period_id==='today'))
            : false);
      const canonical=a.canonical_contract===HomeBrainEnergyCanonicalProjection.contractId &&
        (wanted==='planning' ? a.presentation_surface==='planning' :
          wanted==='strategies' ? a.presentation_surface==='configuration' :
          a.presentation_surface==='metering' || a.presentation_surface==='value');
      if(!native && !canonical) continue;
      rows.push(`${entityId}:${state?.last_updated||''}:${state?.state??''}:${a.availability??''}`);
    }
    return rows.sort().join('|');
  }
  // Do not interpret numeric planning metrics as evidence of a complete,
  // effective horizon. The producer owns variant, provider and quality.
  planningHorizon(horizonId='D0',variant='effective') {
    const horizon=String(horizonId||'').toUpperCase();
    if(!['D0','D1'].includes(horizon) || !['effective','baseline'].includes(variant))
      return Object.freeze({published:false,available:false,status:'UNAVAILABLE',reason:'invalid_horizon_selector',details:null,metadata:null});
    const contract=variant==='effective'
      ? 'RHI_ENERGY_PLANNING_HORIZON_V1'
      : 'RHI_ENERGY_BASELINE_PLANNING_HORIZON_V1';
    const matches=Object.values(this.hass?.states||{}).filter(state=>{
      const a=state?.attributes||{};
      return a.canonical_contract===contract && a.canonical_source==='rhi_energy.runtime' &&
        a.horizon_id===horizon && a.variant===variant;
    });
    if(matches.length!==1) return Object.freeze({published:false,available:false,
      status:'UNAVAILABLE',reason:matches.length>1?'duplicate_planning_horizon':'planning_horizon_not_published',details:null,metadata:null});
    const a=matches[0].attributes;
    const details=a.details && typeof a.details==='object' && !Array.isArray(a.details)?a.details:null;
    const available=a.availability==='AVAILABLE' && a.totals_complete===true &&
      details && Array.isArray(details.buckets) &&
      (details.horizon_id===undefined || details.horizon_id===horizon);
    return Object.freeze({published:true,available:!!available,
      status:available?'AVAILABLE':String(a.availability||'UNAVAILABLE'),
      reason:available?'':String(a.reason_code||'horizon_incomplete'),
      details:available?details:null,metadata:a});
  }
  snapshot() {
    const rows=this.canonicalRows();
    return Object.freeze({available:rows.length>0,contractId:HomeBrainEnergyCanonicalProjection.contractId,
      contractVersion:HomeBrainEnergyCanonicalProjection.contractId,
      attributes:Object.freeze({properties:rows})});
  }
  section(name) {
    const wanted=String(name || '');
    return {properties:this.canonicalRows().filter(row=>row.presentation_surface===wanted)};
  }
}

// Single native canonical Energy runtime projection. No retired Public V2 alias.
