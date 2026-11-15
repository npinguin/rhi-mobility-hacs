// 60-vehicle-detail-card.js
// Vehicle detail custom card registration.

class HomeBrainVehicleAssetDetailCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      fallback_name: "Vehicle",
      fallback_profile: "Vehicle",
      fallback_image: rhiMobilityAssetUrl("vehicles/vehicle_fallback.png"),
      image_base: "",
      dashboard_path: hbMobilityPath("/dashboard"),
      resource_version: UX_VERSION,
      ...config
    };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = "";
  }

  set hass(hass) {
    this._hass = hass;
    const rt = new HomeBrainAssetRuntime(hass, this.config);
    const id = this.config.vehicle_id;
    const sig = rt.productRevisionSignature(id, [
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_POLICY_V2",
      "MOBILITY_COMMAND_V2",
      "MOBILITY_ACTIVITY_V2",
      "MOBILITY_PROFILE_CATALOG_V2",
      "MOBILITY_SUPERVISION_V2"
    ]) + "|" + new HomeBrainEnergyCanonicalProjection(hass).revisionSignature("history");
    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      const model = new HomeBrainVehicleAdapter(rt, id, this.config).build();
      new HomeBrainAssetShell(this.shadowRoot, rt).render(model);
    }
  }
  getCardSize() { return 12; }
}
