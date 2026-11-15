// Single-card Mobility bootstrap shell.
// Existing individual Mobility custom cards remain registered and supported.
class HomeBrainMobilityCard extends HTMLElement {
  static getStubConfig() { return {type:"custom:homebrain-mobility-card"}; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.config = {};
    this._hass = null;
    this._children = new Map();
    this._activeChildKey = "";
    this._locationHandler = () => this.render();
  }

  setConfig(config = {}) {
    this.config = { default_view:"overview", ...(config || {}) };
    this.render();
  }

  connectedCallback() {
    window.addEventListener("location-changed", this._locationHandler);
  }

  disconnectedCallback() {
    window.removeEventListener("location-changed", this._locationHandler);
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  currentView() {
    try {
      const url = new URL(window.location.href);
      const value = String(url.searchParams.get("mobility_view") || this.config.default_view || "overview").toLowerCase();
      return ["overview","vehicles","chargers","planning","strategies","history","log","detail"].includes(value) ? value : "overview";
    } catch (e) {
      return String(this.config.default_view || "overview").toLowerCase();
    }
  }

  childSpec(view) {
    if (view === "overview" || view === "vehicles") return {
      tag:"homebrain-mobility-dashboard-card",
      cacheKey:"dashboard",
      config:{ nav_active:view }
    };
    if (view === "chargers") return {
      tag:"homebrain-mobility-charger-maintenance-card",
      cacheKey:"chargers",
      config:{ nav_active:"chargers" }
    };
    if (["planning","strategies","history","log"].includes(view)) return {
      tag:"homebrain-mobility-placeholder-card",
      cacheKey:view,
      config:{ view }
    };
    return {
      tag:"homebrain-mobility-asset-detail-card",
      cacheKey:"detail",
      config:{}
    };
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;
    const view = this.currentView();
    const spec = this.childSpec(view);
    const basePath = String(this.config.bootstrap_path || window.location?.pathname || "/mobility-supervisor/overview");
    if (typeof rhiUxRegisterDomainNavigation === "function") {
      rhiUxRegisterDomainNavigation({
        domain:"rhi_mobility",
        assetDetailTemplate:`${basePath}?mobility_view=detail&asset={asset_id}#asset={asset_id}`
      });
    }
    const childConfig = {
      ...this.config,
      ...spec.config,
      bootstrap_mode:true,
      bootstrap_path:basePath,
      dashboard_path:`${basePath}?mobility_view=vehicles`
    };
    delete childConfig.type;
    delete childConfig.default_view;

    let mount = this.shadowRoot.getElementById("mobility-bootstrap");
    if (!mount) {
      const style = document.createElement("style");
      style.textContent = ":host{display:block}#mobility-bootstrap{display:block;min-width:0}";
      mount = document.createElement("div");
      mount.id = "mobility-bootstrap";
      this.shadowRoot.append(style, mount);
      mount = this.shadowRoot.getElementById("mobility-bootstrap");
    }

    const childKey = spec.cacheKey || view;
    let child = this._children.get(childKey);
    if (!child) {
      child = document.createElement(spec.tag);
      this._children.set(childKey, child);
    }
    child.setConfig?.(childConfig);

    // Backend refreshes update truth on the existing child instance. Navigation
    // only changes which already-lived view is attached. This preserves filters,
    // expanded sections, drafts and other user interaction state across refresh
    // and tab switches without storing domain truth in a second UX state layer.
    if (this._activeChildKey !== childKey || mount.firstElementChild !== child) {
      mount.replaceChildren(child);
      this._activeChildKey = childKey;
    }
    child.hass = this._hass;
  }

  getCardSize() { return 12; }
}

if (!customElements.get("homebrain-mobility-card")) {
  customElements.define("homebrain-mobility-card", HomeBrainMobilityCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "homebrain-mobility-card")) window.customCards.push({
  type:"homebrain-mobility-card",
  name:"Robotix Home Intelligence Mobility",
  description:"Single-card Mobility bootstrap with internal navigation; legacy multi-view cards remain supported."
});
