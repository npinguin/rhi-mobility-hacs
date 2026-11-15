// Read-only cross-domain Energy Planning projection for Mobility UX.
// Energy owns effective/baseline selection, horizon quality and schedule details.
// No UI-fabricated totals, EMHASS fallback, source aliases or guessed asset join.
class HomeBrainEnergyPlanningProjection {
  constructor(hass, mobilityRuntime = null) {
    this.energy=new HomeBrainEnergyCanonicalProjection(hass);
    this.mobilityRuntime=mobilityRuntime||null;
  }
  _first(...values) {
    for(const value of values) if(value!==undefined && value!==null && value!=='') return value;
    return null;
  }
  _number(value) {
    if(value===null || value===undefined || value==='') return null;
    const number=Number(value);
    return Number.isFinite(number)?number:null;
  }
  _mobilityAssetIds() {
    try{return new Set((this.mobilityRuntime?.mobilityRegistry?.()||[])
      .map(row=>String(row?.asset_id||'')).filter(Boolean));}
    catch(_){return new Set();}
  }
  _assetId(row={}) {
    return String(this._first(row.asset_id,row.target_asset_id,
      row.flexible_asset_id,row.consumer_asset_id,row.participant_id,'')||'');
  }
  _totalsView(horizon,publication) {
    const day=horizon==='D0'?'today':'tomorrow';
    const metric=key=>this.energy.nativeMetric('planning_'+day+'_'+key);
    const raw=publication.available?publication.details||{}:{};
    // Never mix an accepted plan's totals with a free-standing metric from
    // another runtime revision. Metrics without a plan remain provisional.
    const own=key=>publication.available
      ? this._number(raw[key]) : this._number(metric(key).value);
    return Object.freeze({
      plannedKwh:own('flexible_planned_kwh'),
      stillToPlanKwh:own('flexible_still_to_plan_kwh'),
      requiredKwh:own('flexible_required_kwh'),
      gridImportKwh:publication.available?this._number(raw.grid_import_kwh):null,
      solarKwh:publication.available?this._number(raw.solar_kwh):null,
      // Numeric metric availability is not proof of an effective plan.
      state:publication.status,
      provisional:!publication.available,
      reason:publication.reason,
      raw:publication.available?raw:{}
    });
  }
  _knownDemandProjection(horizonId, effective, baseline) {
    // Energy publishes an independent, non-executable solar/home baseload view
    // inside native horizon details even when flexible demand blocks the full plan.
    // A baseline plan never becomes the selected/effective schedule here.
    const ordered = effective?.available
      ? [['effective', effective], ['baseline', baseline]]
      : [['baseline', baseline], ['effective', effective]];
    for (const [source, publication] of ordered) {
      const details = publication?.metadata?.details;
      if (!details || details.horizon_id !== horizonId) continue;
      const known = details.known_demand_projection;
      if (!known || known.basis !== 'solar_plus_home_baseload_only_no_battery_dispatch' ||
          known.execution_authorized !== false) continue;
      const keys = ['home_consumption_forecast_kwh', 'solar_forecast_kwh',
        'expected_grid_import_kwh', 'expected_grid_export_kwh'];
      const values = keys.map(key => known[key]);
      if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) continue;
      const [homeKwh, solarKwh, gridImportKwh, gridExportKwh] = values;
      // Cross-check the physical net boundary. Do not show an inconsistent
      // source projection as an independent, trustworthy baseline.
      if (Math.abs((homeKwh - solarKwh) - (gridImportKwh - gridExportKwh)) > 0.02) continue;
      const unknown = known.unknown_flexible_load_count;
      if (!Number.isInteger(unknown) || unknown < 0) continue;
      return Object.freeze({
        available:true, source, basis:known.basis,
        homeKwh, solarKwh, gridImportKwh, gridExportKwh,
        unknownFlexibleLoadCount:unknown,
        complete:known.complete === true && unknown === 0,
        isEffectiveSchedule:false, executionAuthorized:false,
        quality:'KNOWN_LOADS_ONLY'
      });
    }
    return Object.freeze({available:false,source:'',quality:'UNAVAILABLE',
      homeKwh:null,solarKwh:null,gridImportKwh:null,gridExportKwh:null,
      unknownFlexibleLoadCount:null,complete:false,
      isEffectiveSchedule:false,executionAuthorized:false});
  }
  _assetScheduleRows(publications) {
    const rows=[];
    for(const publication of publications) {
      if(!publication.available) continue;
      const details=publication.details||{};
      const horizon=publication.metadata.horizon_id;
      // Planning asset and bucket allocations are published by Energy, not
      // reconstructed from the number of hours or charger observations.
      for(const asset of Array.isArray(details.planning_assets)?details.planning_assets:[])
        if(asset && typeof asset==='object') rows.push({...asset,horizon_id:horizon});
      for(const bucket of Array.isArray(details.buckets)?details.buckets:[]) {
        if(!bucket || typeof bucket!=='object') continue;
        for(const asset of Array.isArray(bucket.asset_allocations)?bucket.asset_allocations:[])
          if(asset && typeof asset==='object') rows.push({...asset,horizon_id:horizon,
            bucket_id:bucket.bucket_id||'',window_start:bucket.start||bucket.starts_at||'',
            window_end:bucket.end||bucket.ends_at||''});
      }
    }
    const ids=this._mobilityAssetIds();
    return ids.size?rows.filter(row=>ids.has(this._assetId(row))):[];
  }
  viewModel() {
    const d0=this.energy.planningHorizon('D0','effective');
    const d1=this.energy.planningHorizon('D1','effective');
    const baselineD0=this.energy.planningHorizon('D0','baseline');
    const baselineD1=this.energy.planningHorizon('D1','baseline');
    const bothReportedAvailable=d0.available&&d1.available;
    const identityCoherent=!bothReportedAvailable || (
      !!d0.metadata?.plan_id && d0.metadata.plan_id===d1.metadata?.plan_id &&
      !!d0.metadata?.provider_id && d0.metadata.provider_id===d1.metadata?.provider_id &&
      String(d0.metadata?.requested_provider||'')===String(d1.metadata?.requested_provider||'') &&
      (!d0.metadata?.generated_at || !d1.metadata?.generated_at ||
        d0.metadata.generated_at===d1.metadata.generated_at)
    );
    // A selected optimizer cannot silently be replaced by a different
    // effective provider just because some numeric plan fields are present.
    const selection=d0.metadata||d1.metadata||{};
    const providerMismatch=!!selection.requested_provider &&
      selection.requested_provider!==selection.provider_id;
    // Both stale cross-revision horizons AND a mismatched requested provider
    // quarantine all schedule rows. The independent known-load view survives.
    const conflict=(bothReportedAvailable&&!identityCoherent)||providerMismatch;
    const quarantined=publication=>conflict ? {
      ...publication,available:false,status:'INCOMPLETE',
      reason:'effective_horizons_inconsistent',details:null
    } : publication;
    const e0=quarantined(d0),e1=quarantined(d1);
    const publications=[e0,e1];
    const today=this._totalsView('D0',e0);
    const tomorrow=this._totalsView('D1',e1);
    const bothAvailable=e0.available&&e1.available;
    const someAvailable=e0.available||e1.available;
    const anyPublished=d0.published||d1.published;
    const metadata=d0.metadata||d1.metadata||null;
    const requestedProvider=metadata?.requested_provider||'';
    const effectiveProvider=metadata?.provider_id||'';
    const providerHold=!!requestedProvider && requestedProvider!==effectiveProvider;
    const reason=conflict
      ? (providerMismatch ? String(metadata?.reason_code||'requested_provider_not_effective') : 'effective_horizons_inconsistent')
      : providerHold
        ? String(metadata?.reason_code||'requested_provider_not_effective')
        : publications.find(row=>!row.available)?.reason||'';
    const independentKnownDemand=Object.freeze({
      D0:this._knownDemandProjection('D0',d0,baselineD0),
      D1:this._knownDemandProjection('D1',d1,baselineD1)
    });
    const properties=this.energy.canonicalRows().filter(row=>row.availability==='AVAILABLE'&&
      row.presentation_surface==='planning');
    const scheduleRows=this._assetScheduleRows(publications);
    const ids=this._mobilityAssetIds();
    return Object.freeze({
      available:someAvailable,
      complete:bothAvailable,
      published:anyPublished,
      entityId:null,
      contractVersion:'RHI_ENERGY_PLANNING_HORIZON_V1',
      state:bothAvailable?'AVAILABLE':anyPublished?'INCOMPLETE':'UNAVAILABLE',
      requestedProvider,
      effectiveProvider,
      providerHold,
      reason,
      today,tomorrow,independentKnownDemand,
      horizonIdentityCoherent:identityCoherent,
      baselineAvailable:baselineD0.available||baselineD1.available,
      baselineStatus:Object.freeze({D0:baselineD0.status,D1:baselineD1.status}),
      // Baseline evidence never becomes an effective or executable plan.
      combined:Object.freeze({plannedKwh:null,stillToPlanKwh:null,
        gridImportKwh:null,solarKwh:null,state:'',raw:{}}),
      currentIntent:{},
      planningRows:properties,
      experienceRows:[],
      mobilityPlanningRows:scheduleRows,
      mobilityExperienceRows:[],
      exactIdentityJoin:ids.size>0,
      source:'rhi_energy.runtime/native_horizon',
      quality:Object.freeze({D0:d0.status,D1:d1.status})
    });
  }
}
