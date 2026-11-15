// 70-charger-detail-card.js
// Charger detail custom card registration.

class HomeBrainChargerAssetDetailCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      fallback_name: "Charger",
      fallback_profile: "EV Charger",
      fallback_location: "Home",
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
    const id = this.config.charger_id;
    const sig = rt.productRevisionSignature(id, [
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_POLICY_V2",
      "MOBILITY_COMMAND_V2",
      "MOBILITY_ACTIVITY_V2",
      "MOBILITY_PROFILE_CATALOG_V2",
      "MOBILITY_SUPERVISION_V2"
    ]);
    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      const model = new HomeBrainChargerAdapter(rt, id, this.config).build();
      new HomeBrainAssetShell(this.shadowRoot, rt).render(model);
    }
  }
  getCardSize() { return 12; }
}

if (!customElements.get("homebrain-vehicle-asset-detail-card")) {
  customElements.define("homebrain-vehicle-asset-detail-card", HomeBrainVehicleAssetDetailCard);
}
if (!customElements.get("homebrain-charger-asset-detail-card")) {
  customElements.define("homebrain-charger-asset-detail-card", HomeBrainChargerAssetDetailCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "homebrain-vehicle-asset-detail-card",
  name: "Home Brain Vehicle Asset Detail Card",
  description: "Home Brain asset detail shell with vehicle adapter."
});
window.customCards.push({
  type: "homebrain-charger-asset-detail-card",
  name: "Home Brain Charger Asset Detail Card",
  description: "Home Brain asset detail shell with charger adapter."
});

window.HomeBrainMobilityAssetsVersion = UX_VERSION;
console.info(`Home Intelligence Mobility UX bundle loaded ${UX_VERSION}; backend version is read from the Mobility release contract at runtime.`);



/**
 * Premium operational charger maintenance card.
 *
 * This card replaces the Mobility Asset Viewer in the product navigation. It is
 * not a contract/debug screen: it gives the household operator one calm view of
 * every charger, its connected vehicle, power/session state, trust/freshness and
 * safe maintenance actions. All assets come from the public asset catalog and all buttons from
 * the Mobility command index.
 */
