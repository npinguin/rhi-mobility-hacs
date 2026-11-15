// Read-only Energy strategy projection for Mobility Intelligence.
// Strategy semantics stay Energy-owned. UX never classifies configured/effective
// by property-key substrings or manufactures missing effective state.
class HomeBrainEnergyMobilityStrategyProjection {
  constructor(hass, mobilityRuntime = null) {
    this.energy = new HomeBrainEnergyCanonicalProjection(hass);
    this.mobilityRuntime = mobilityRuntime || null;
  }
  _mobilityAssets() {
    try { return new Map((this.mobilityRuntime?.mobilityRegistry?.() || []).map(row=>[String(row?.asset_id || ""),row]).filter(([id])=>id)); }
    catch (_) { return new Map(); }
  }
  _assetId(row={}) { return String(row.asset_id || row.target_asset_id || row.flexible_asset_id || ""); }
  _configuredRows() {
    const mobility=this._mobilityAssets();
    // Editable configuration is an explicit Energy property capability.
    return this.energy.canonicalRows().filter(row=>
      row.availability==='AVAILABLE' &&
      row.presentation_surface==='configuration' &&
      row.presentation_family==='strategy' && row.editable === true &&
      mobility.has(row.asset_id));
  }
  _effectiveRows() {
    // Current native property publication has no independently authoritative
    // configured-versus-effective strategy role. Do not infer from key names.
    return [];
  }
  viewModel() {
    const configured=this._configuredRows();
    const effective=this._effectiveRows();
    return Object.freeze({
      profilesAvailable:false,
      configuredAvailable:configured.length>0,
      effectiveAvailable:effective.length>0,
      profileContractVersion:'RHI_ENERGY_CANONICAL_PROPERTY_V2',
      effectiveContractVersion:'RHI_ENERGY_CANONICAL_PROPERTY_V2',
      profiles:[],configured,effective,
      configuredState:configured.length?'AVAILABLE':'UNAVAILABLE',
      effectiveState:effective.length?'AVAILABLE':'UNAVAILABLE',
      source:'RHI_ENERGY_CANONICAL_PROPERTY_V2.configuration.strategy'
    });
  }
}
