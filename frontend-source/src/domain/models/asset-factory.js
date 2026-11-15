// 20-asset-factory.js
// Asset factory and common asset catalog shaping.

class HomeBrainAssetFactory {
  constructor(rt) { this.rt = rt; }
  assets() { return this.rt.indexedAssets("all").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired"); }
  vehicles() { return this.rt.indexedAssets("vehicle").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired"); }
  chargers() { return this.rt.indexedAssets("charger").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired"); }
  adapterFor(asset, config = {}) {
    if (this.rt.isVehicleAsset(asset)) return new HomeBrainVehicleAdapter(this.rt, asset.asset_id.replace(/^vehicle_/, ""), { ...config, registry_entry: asset });
    if (this.rt.isChargerAsset(asset)) return new HomeBrainChargerAdapter(this.rt, asset.asset_id.replace(/^charger_/, ""), { ...config, registry_entry: asset });
    return null;
  }
}
