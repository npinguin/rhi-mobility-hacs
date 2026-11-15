// Persistent Mobility canonical-property index.
//
// Mobility canonical property entities identify themselves with
// canonical_contract=RHI_MOBILITY_CANONICAL_PROPERTY_V1. This is the sole
// frontend property-truth contract. Aggregate Runtime V2 never backfills it.
class MobilityCanonicalPropertyIndex {
  constructor(hass = {}) {
    this.byEntity = new Map();
    this.byAsset = new Map();
    this.byAssetAndKey = new Map();
    this.stateRefs = new Map();
    this.ambiguousKeys = new Set();
    this.assetRevisions = new Map();
    this._globalRevision = 0;
    this._stateCount = 0;
    this._hassRef = null;
    this.discover(hass);
  }

  isCanonicalPropertyState(state) {
    const attrs = state?.attributes || {};
    const contract=String(attrs.canonical_contract || '').toUpperCase();
    return contract === 'RHI_MOBILITY_CANONICAL_PROPERTY_V1'
      && !!String(attrs.asset_id || '').trim()
      && !!String(attrs.property_key || '').trim();
  }

  rawRow(entityId, state) {
    if (!this.isCanonicalPropertyState(state)) return null;
    const attrs = state.attributes || {};
    const nativeState = String(state?.state ?? '').trim().toLowerCase();
    const explicitAvailability = String(attrs.availability || '').trim().toUpperCase();
    const quality = String(attrs.quality || '').trim().toUpperCase();
    const invalidState = ['unknown','unavailable','none','null',''].includes(nativeState);
    const invalidQuality = ['STALE','INVALID','UNKNOWN'].includes(quality);
    // A published availability outside the recognized states is not evidence
    // of an available physical value. Preserve known zero; fail closed on
    // unknown backend status instead of silently presenting stale truth.
    const knownAvailability = ['', 'AVAILABLE', 'UNAVAILABLE', 'STALE', 'INVALID', 'UNKNOWN'];
    const publishedValue = Object.prototype.hasOwnProperty.call(attrs,'value') ? attrs.value : state?.state;
    const invalidPublishedValue = publishedValue === null || publishedValue === undefined ||
      (typeof publishedValue === 'string' && ['unknown','unavailable','none','null',''].includes(publishedValue.trim().toLowerCase()));
    const available = !invalidState && !invalidQuality && !invalidPublishedValue &&
      knownAvailability.includes(explicitAvailability) &&
      (explicitAvailability === '' || explicitAvailability === 'AVAILABLE');
    return {
      ...attrs,
      asset_id:String(attrs.asset_id || '').trim(),
      property_key:String(attrs.property_key || '').trim(),
      availability:available ? 'AVAILABLE' : 'UNAVAILABLE',
      value:available ? publishedValue : null,
      display_name:attrs.display_name || attrs.friendly_name || '',
      _source_entity_id:String(entityId || ''),
      canonical_contract:String(attrs.canonical_contract || 'RHI_MOBILITY_CANONICAL_PROPERTY_V1').toUpperCase()
    };
  }

  _index(entityId, state) {
    const row=this.rawRow(entityId,state);
    if(!row) return;
    this.byEntity.set(entityId,row);
    if(!this.byAsset.has(row.asset_id)) this.byAsset.set(row.asset_id,[]);
    this.byAsset.get(row.asset_id).push(row);
    const compound=`${row.asset_id}::${row.property_key}`;
    const current=this.byAssetAndKey.get(compound);
    if(!current) this.byAssetAndKey.set(compound,row);
    else this.ambiguousKeys.add(compound);
    this.stateRefs.set(entityId,state);
  }

  discover(hass = {}) {
    const previousAssetIds = new Set(this.byAsset.keys());
    this.byEntity.clear();
    this.byAsset.clear();
    this.byAssetAndKey.clear();
    this.stateRefs.clear();
    this.ambiguousKeys.clear();
    const states=hass?.states || {};
    this._hassRef=hass;
    this._stateCount=Object.keys(states).length;
    for(const [entityId,state] of Object.entries(states)) this._index(entityId,state);
    this._globalRevision += 1;
    for(const assetId of new Set([...previousAssetIds,...this.byAsset.keys()]))
      this.assetRevisions.set(assetId,(this.assetRevisions.get(assetId)||0)+1);
    return this;
  }

  refresh(hass = {}) {
    const states=hass?.states || {};
    // Same-sized HA replacements can still add/remove canonical entities.
    const membershipChanged=[...this.stateRefs.keys()].some(id=>!Object.prototype.hasOwnProperty.call(states,id)) ||
      Object.entries(states).some(([id,state])=>!this.stateRefs.has(id) && this.isCanonicalPropertyState(state));
    if(Object.keys(states).length !== this._stateCount || membershipChanged) {
      this.discover(hass);
      return;
    }
    let metadataChanged=false;
    const changed=[];
    for(const [entityId,previous] of this.stateRefs.entries()) {
      const current=states[entityId];
      if(current===previous) continue;
      changed.push([entityId,current]);
      const before=this.byEntity.get(entityId);
      const after=this.rawRow(entityId,current);
      if(!after || !before ||
        before.asset_id!==after.asset_id ||
        before.property_key!==after.property_key ||
        before.component_id!==after.component_id ||
        before.section_id!==after.section_id ||
        before.visibility!==after.visibility ||
        before.render_as!==after.render_as ||
        before.presentation_role!==after.presentation_role ||
        before.presentation_family!==after.presentation_family ||
        before.presentation_surface!==after.presentation_surface ||
        before.presentation_primary!==after.presentation_primary ||
        before.presentation_technical!==after.presentation_technical ||
        before.asset_type!==after.asset_type ||
        before.asset_display_name!==after.asset_display_name ||
        before.lifecycle_status!==after.lifecycle_status) {
        metadataChanged=true;
        break;
      }
    }
    // Incremental replacement cannot safely maintain the winner of a
    // duplicated asset/property key: a changed secondary publisher would
    // otherwise overwrite byAssetAndKey while the ambiguity remains active.
    // Rebuild on changes to ambiguous keys so the index and gap evidence stay
    // consistent until the backend removes the duplicate publication.
    if (!metadataChanged && changed.some(([entityId]) => {
      const row=this.byEntity.get(entityId);
      return row && this.ambiguousKeys.has(`${row.asset_id}::${row.property_key}`);
    })) metadataChanged=true;
    if(metadataChanged) {
      this.discover(hass);
      return;
    }
    // Once all metadata has been checked, update values without losing the
    // canonical membership of any unchanged asset.
    const changedAssets=new Set();
    for(const [entityId,current] of changed) {
      const before=this.byEntity.get(entityId);
      const after=this.rawRow(entityId,current);
      this.byEntity.set(entityId,after);
      this.byAssetAndKey.set(`${after.asset_id}::${after.property_key}`,after);
      this.byAsset.set(after.asset_id,(this.byAsset.get(after.asset_id)||[]).map(row=>row._source_entity_id===entityId?after:row));
      this.stateRefs.set(entityId,current);
      changedAssets.add(after.asset_id);
    }
    if(changedAssets.size) {
      this._globalRevision += 1;
      changedAssets.forEach(assetId=>this.assetRevisions.set(assetId,(this.assetRevisions.get(assetId)||0)+1));
    }
    this._hassRef=hass;
  }

  rows(assetId = '') {
    const id=String(assetId || '').trim();
    const source=id ? [...(this.byAsset.get(id)||[])] : [...this.byEntity.values()];
    // Duplicate publication has no authoritative winner. Do not let an
    // ambiguous row leak into inventory, overview, detail or diagnostics
    // projections that consume rows() rather than row().
    return source.filter(row=>!this.ambiguousKeys.has(`${row.asset_id}::${row.property_key}`));
  }

  row(assetId='',propertyKey='') {
    const key=`${String(assetId||'')}::${String(propertyKey||'')}`;
    return this.ambiguousKeys.has(key) ? null : (this.byAssetAndKey.get(key) || null);
  }

  contractGaps() {
    return [...this.ambiguousKeys].sort().map(key=>({key,reason:'duplicate_canonical_property'}));
  }

  entityIds(assetId='') {
    const id=String(assetId||'').trim();
    return this.rows(id).map(row=>row._source_entity_id).filter(Boolean);
  }

  revision(assetId='') {
    const id=String(assetId||'').trim();
    return id ? (this.assetRevisions.get(id)||0) : this._globalRevision;
  }
}

function mobilityCanonicalPropertyIndex(hass = {}) {
  const current=HomeBrainAssetRuntime?._canonicalPropertyIndex;
  if(!current) {
    const created=new MobilityCanonicalPropertyIndex(hass);
    HomeBrainAssetRuntime._canonicalPropertyIndex=created;
    return created;
  }
  current.refresh(hass);
  return current;
}
