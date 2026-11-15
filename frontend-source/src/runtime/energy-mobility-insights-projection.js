// Read-only Energy metering/value projection for Mobility Insights.
// Only Energy canonical property rows are authoritative; missing evidence fails closed.
class HomeBrainEnergyMobilityInsightsProjection {
  constructor(hass, mobilityRuntime = null) {
    this.energy = new HomeBrainEnergyCanonicalProjection(hass);
    this.mobilityRuntime = mobilityRuntime || null;
  }
  _first(...values) { for (const value of values) if (value !== undefined && value !== null && value !== "") return value; return null; }
  _number(...values) { const value=this._first(...values); if(value===null) return null; const n=Number(value); return Number.isFinite(n)?n:null; }
  _mobilityAssets() {
    try { return new Map((this.mobilityRuntime?.mobilityRegistry?.() || []).map(row=>[String(row?.asset_id || ""),row]).filter(([id])=>id)); }
    catch (_) { return new Map(); }
  }
  _assetId(row={}) { return String(this._first(row.asset_id,row.consumer_asset_id,row.child_asset_id,row.target_asset_id,row.flexible_asset_id,row.participant_id,"") || ""); }
  _assetName(assetId,row={}) {
    const mobility=this._mobilityAssets().get(assetId) || {};
    return String(this._first(row.display_name,row.asset_label,row.label,mobility.display_name,mobility.name,this.mobilityRuntime?.assetDisplayName?.(assetId),assetId) || assetId);
  }
  _meteringRows(periodId='today') {
    const mobility=this._mobilityAssets();
    const selected=String(periodId||'').toLowerCase();
    return this.energy.canonicalRows().filter(row=>row.availability==='AVAILABLE' &&
      row.presentation_surface==='metering' && row.period_id===selected &&
      row.unit==='kWh' && mobility.has(row.asset_id)).map(row=>Object.freeze({
        assetId:row.asset_id,name:this._assetName(row.asset_id),periodId,
        energyKwh:this._number(row.value),unit:'kWh',measurementState:'AVAILABLE',
        trustState:'',raw:row
      }));
  }
  _valueRows(periodId='today') {
    const mobility=this._mobilityAssets();
    const selected=String(periodId||'').toLowerCase();
    return this.energy.canonicalRows().filter(row=>row.availability==='AVAILABLE' &&
      row.presentation_surface==='value_accounting' && row.period_id===selected &&
      row.unit==='EUR' && mobility.has(row.asset_id)).map(row=>Object.freeze({
        assetId:row.asset_id,name:this._assetName(row.asset_id),periodId,
        attributedEur:this._number(row.value),energyKwh:null,state:'AVAILABLE',raw:row
      }));
  }
  _chargingSessions() {
    // The existing Energy native metering period owns charging history.
    // "today" is the single bounded HA publication of the shared persistent
    // session ledger; selecting week/month must not create duplicate sessions.
    const states=Object.entries(this.energy.hass?.states || {}).filter(([,state])=>{
      const a=state?.attributes || {};
      return a.contract_id==='RHI_ENERGY_METERING_PERIOD_V1' &&
        a.canonical_source==='rhi_energy.runtime' && a.period_id==='today';
    });
    if(states.length!==1) return Object.freeze({
      available:false,rows:[],historyCount:null,
      reason:states.length>1?'duplicate_energy_session_publication':'energy_session_publication_unavailable'
    });
    const data=states[0][1]?.attributes?.charging_sessions;
    if(!data || typeof data!=='object' || !Array.isArray(data.active) || !Array.isArray(data.recent))
      return Object.freeze({available:false,rows:[],historyCount:null,reason:'native_session_rows_invalid'});
    const number=v=>{
      if(v===null || v===undefined || v==='' || typeof v==='boolean') return null;
      const n=Number(v);return Number.isFinite(n) && n>=0?n:null;
    };
    const signedEur=v=>{
      if(v===null || v===undefined || v==='' || typeof v==='boolean')return null;
      const n=Number(v);return Number.isFinite(n)?n:null;
    };
    const instant=v=>{
      if(typeof v!=='string' || !/(Z|[+-]\d\d:\d\d)$/i.test(v))return null;
      const n=Date.parse(v);return Number.isFinite(n)?n:null;
    };
    const seen=new Set(),excluded=new Set(),rows=[];
    for(const [isActive,entries] of [[false,data.recent],[true,data.active]]) {
      for(const raw of entries) {
        if(!raw || typeof raw!=='object' || Array.isArray(raw))continue;
        const id=String(raw.session_id||'').trim();
        const chargerId=String(raw.charger_asset_id||'').trim();
        const at=instant(raw.started_at);
        if(!id || !chargerId || at===null)continue;
        // Duplicated session IDs cannot silently win by array or entity order.
        if(seen.has(id)){excluded.add(id);continue;}
        seen.add(id);
        const end=raw.finished_at==null?null:instant(raw.finished_at);
        const latest=instant(raw.last_observed_at);
        if(end!==null && end<at)continue;
        if(isActive && raw.finished_at!=null)continue;
        const vehicle=raw.attribution_quality==='PROVEN' && raw.vehicle_asset_id
          ? String(raw.vehicle_asset_id).trim():null;
        // Real import credits at negative electricity prices must survive;
        // only physical kWh is restricted to nonnegative numeric values.
        const cost=raw.cost_quality==='ALLOCATED'?signedEur(raw.cost_eur):null;
        rows.push(Object.freeze({
          sessionId:id,chargerId,vehicleId:vehicle||null,
          attributionQuality:vehicle?'PROVEN':'UNATTRIBUTED',
          status:String(raw.status||'UNKNOWN'),
          energyKwh:number(raw.energy_kwh),
          costEur:cost,costQuality:cost===null?'UNAVAILABLE':'ALLOCATED',
          quality:String(raw.quality||'UNKNOWN'),
          reason:String(raw.reason||''),
          startedAt:String(raw.started_at),finishedAt:end===null?null:String(raw.finished_at),
          lastObservedAt:latest===null?null:String(raw.last_observed_at),
          isActive,orderAt:end??latest??at
        }));
      }
    }
    const unique=rows.filter(row=>!excluded.has(row.sessionId))
      .sort((a,b)=>b.orderAt-a.orderAt || a.sessionId.localeCompare(b.sessionId));
    const count=number(data.history_count);
    return Object.freeze({available:true,rows:Object.freeze(unique),
      historyCount:count!==null&&Number.isInteger(count)?count:null,
      reason:'',source:'RHI_ENERGY_METERING_PERIOD_V1.charging_sessions'});
  }
  viewModel(periodId="today") {
    const snapshot=this.energy.snapshot();
    const metering=this.energy.canonicalRows().filter(row=>row.presentation_surface==="metering");
    const accounting=this.energy.canonicalRows().filter(row=>row.presentation_surface==="value_accounting");
    const meteringRows=this._meteringRows(periodId);
    const valueRows=this._valueRows(periodId);
    const sessions=this._chargingSessions();
    const ids=new Set([...meteringRows.map(row=>row.assetId),...valueRows.map(row=>row.assetId)]);
    const rows=[...ids].map(assetId=>{
      const m=meteringRows.find(row=>row.assetId===assetId)||null;
      const v=valueRows.find(row=>row.assetId===assetId)||null;
      return Object.freeze({assetId,name:m?.name||v?.name||this._assetName(assetId),energyKwh:m?.energyKwh??v?.energyKwh??null,measurementState:m?.measurementState||"UNAVAILABLE",trustState:m?.trustState||"",attributedEur:v?.attributedEur??null,valueState:v?.state||"",metering:m,value:v});
    });
    return Object.freeze({
      periodId:String(periodId || "today").toLowerCase(),
      meteringAvailable:snapshot.available && meteringRows.length>0,
      valueAvailable:snapshot.available && valueRows.length>0,
      meteringContractVersion:snapshot.contractVersion,
      valueContractVersion:snapshot.contractVersion,
      valueCurrency:"EUR",
      valueState:valueRows.length?"AVAILABLE":"UNAVAILABLE",
      rows,
      sessionsAvailable:sessions.available,
      recentSessions:sessions.rows,
      sessionHistoryCount:sessions.historyCount,
      sessionHistoryReason:sessions.reason,
      sessionsSource:sessions.source||null,
      totalVehicleEnergyKwh:null,
      totalAttributedEur:null,
      source:"RHI_ENERGY_CANONICAL_PROPERTY_V2.metering/value_accounting"
    });
  }
}
