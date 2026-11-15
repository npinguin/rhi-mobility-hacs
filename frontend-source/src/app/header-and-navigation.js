// Mobility presentation adapter onto the shared RHI UX Core.
// Domain semantics remain owned by Mobility runtime/projections.
const UX_VERSION = "__RHI_UX_VERSION__";
const HB_MOBILITY_ROUTE_SEGMENTS = new Set([
  "overview","dashboard","vehicles","charger-maintenance","chargers",
  "planning","strategies","history","log","asset-detail","detail","charging"
]);

function hbMobilityDashboardBase(pathname = "") {
  const raw = String(pathname || window.location?.pathname || "")
    .split("?")[0].split("#")[0].replace(/\/+$/, "");
  const parts = raw.split("/").filter(Boolean);
  if (!parts.length) return "";
  const last = String(parts[parts.length - 1] || "").toLowerCase();
  if (HB_MOBILITY_ROUTE_SEGMENTS.has(last) || /^\d+$/.test(last)) parts.pop();
  return parts.length ? `/${parts.join("/")}` : "";
}

const HB_MOBILITY_MODULES = Object.freeze([
  { key:"mobility", labelKey:"nav.mobility", fallback:"Mobility", path:"/overview", items:[
    { key:"overview", labelKey:"nav.overview", fallback:"Overview", path:"/overview" },
    { key:"vehicles", labelKey:"nav.vehicles", fallback:"Vehicles", path:"/dashboard" },
    { key:"chargers", labelKey:"nav.chargers", fallback:"Chargers", path:"/charger-maintenance" }
  ]},
  { key:"intelligence", labelKey:"nav.intelligence", fallback:"Intelligence", path:"/planning", items:[
    { key:"planning", labelKey:"nav.planning", fallback:"Planning", path:"/planning" },
    { key:"strategies", labelKey:"nav.strategies", fallback:"Strategies", path:"/strategies" }
  ]},
  { key:"insights", labelKey:"nav.insights", fallback:"Insights", path:"/history", items:[
    { key:"history", labelKey:"nav.history", fallback:"History", path:"/history" },
    { key:"log", labelKey:"nav.log", fallback:"Activity", path:"/log" }
  ]}
]);

const HB_MOBILITY_NAV_ITEMS = HB_MOBILITY_MODULES.flatMap(module =>
  module.items.map(item => ({ ...item, module:module.key }))
);

function hbMobilityPath(path = "", configuredBase = "") {
  const suffix = `/${String(path || "").replace(/^\/+/, "")}`;
  const root = hbMobilityDashboardBase(configuredBase || window.location?.pathname || "") || "/mobility-supervisor";
  return `${root}${suffix}`;
}

function hbMobilityModuleFor(active = "overview") {
  const item=HB_MOBILITY_NAV_ITEMS.find(entry => entry.key === active);
  return HB_MOBILITY_MODULES.find(module => module.key === (item?.module || active)) || HB_MOBILITY_MODULES[0];
}

function hbMobilityCoreModules(configuredBase = "", hass = null) {
  return HB_MOBILITY_MODULES.map(module => ({
    id:module.key,
    label:rhiMobilityT(hass,module.labelKey,{},module.fallback),
    target:hbMobilityPath(module.path, configuredBase),
    items:module.items.map(item => ({
      id:item.key,
      label:rhiMobilityT(hass,item.labelKey,{},item.fallback),
      target:hbMobilityPath(item.path, configuredBase)
    }))
  }));
}

function hbMobilityNav(active = "overview", configuredBase = "") {
  const module=hbMobilityModuleFor(active);
  return `<div class="rhiMobilityNav rhiMobilityNav-${rhiUxEscape(module.key)}">${rhiUxDomainShell({
    product:"Home Intelligence",
    domain:"MOBILITY",
    modules:hbMobilityCoreModules(configuredBase),
    activeModule:module.key,
    activeItem:active
  })}<style>${hbMobilitySharedShellStyles()}</style></div>`;
}

function hbMobilityTitleBlock(title = "", description = "") {
  const resolvedTitle=title || rhiMobilityT(null,"nav.mobility",{},"Mobility");
  const resolvedDescription=description || rhiMobilityT(null,"hero.overview.description",{},"See your mobility status and what needs attention.");
  return `<section class="title"><p class="eyebrow">${rhiUxEscape(rhiMobilityT(null,"shell.eyebrow",{},"HOME INTELLIGENCE / MOBILITY"))}</p><h1>${rhiUxEscape(resolvedTitle)}</h1><p>${rhiUxEscape(resolvedDescription)}</p></section>`;
}

function hbMobilityReleaseFooter(rt) {
  // Always render release provenance and runtime status, independent of engineer diagnostics.
  const rel=rt && rt.releaseContract ? rt.releaseContract() : {};
  const backend=rel.backend_release || rel.backend_version || "Unknown";
  let issue="Status UNKNOWN";
  let severity="warning";
  try {
    const summary=rt && rt.runtimeHealthSummary ? rt.runtimeHealthSummary() : null;
    const state=String(summary?.status || "UNKNOWN").toUpperCase();
    issue="Status "+state;
    severity=["BLOCKED","INVALID","ERROR"].includes(state) || backend === "Unknown" ? "error"
      : ["DEGRADED","STALE","UNKNOWN"].includes(state) ? "warning" : "";
  } catch (_) { issue="Status UNKNOWN"; severity="warning"; }
  return rhiUxTechnicalFooter({ product:"RHI Mobility", uxVersion:UX_VERSION, backendVersion:backend, issue, severity });
}

function hbMobilityOutcomeStrip(rt, contextId = "mobility", fallback = {}) {
  const esc=(v)=>rt && rt.escape ? rt.escape(v) : rhiUxEscape(v);
  const read=(field, fallbackValue=rhiMobilityT(rt?.hass,"common.unavailable",{},"Unavailable")) => {
    const value=rt && rt.supervisorOutcome ? rt.supervisorOutcome(contextId, field, null) : null;
    return value === undefined || value === null || value === "" ? fallbackValue : value;
  };
  const status=read("status", fallback.status ?? rhiMobilityT(rt?.hass,"common.unavailable",{},"Unavailable"));
  const trust=read("trust", fallback.trust ?? (rt && rt.backendVersion ? rt.backendVersion() : rhiMobilityT(rt?.hass,"common.unavailable",{},"Unavailable")));
  const attention=read("attention", fallback.attention ?? rhiMobilityT(rt?.hass,"common.unavailable",{},"Unavailable"));
  const opportunity=read("opportunity", fallback.opportunity ?? rhiMobilityT(rt?.hass,"common.unavailable",{},"Unavailable"));
  const recommendation=read("recommended_action", fallback.recommended_action ?? rhiMobilityT(rt?.hass,"common.unavailable",{},"Unavailable"));
  const items=[
    ["mdi:check-circle-outline",rhiMobilityT(rt?.hass,"common.status",{},"Status"),status,"green"],
    ["mdi:shield-check-outline",rhiMobilityT(rt?.hass,"common.trust",{},"Confidence"),trust,"blue"],
    ["mdi:alert-circle-outline",rhiMobilityT(rt?.hass,"common.attention",{},"Attention"),attention,"orange"],
    ["mdi:lightbulb-outline",rhiMobilityT(rt?.hass,"common.opportunity",{},"Opportunity"),opportunity,"green"],
    ["mdi:arrow-right-circle-outline",rhiMobilityT(rt?.hass,"common.recommended_action",{},"Recommended action"),recommendation,"blue"]
  ];
  return `<section class="status-strip dashboard-status-strip outcome-header">
    ${items.map(([icon,label,value,tone]) => `<div class="metric tone-${tone}"><ha-icon icon="${icon}"></ha-icon><div><span>${label}</span><b>${esc(value)}</b></div></div>`).join("")}
  </section>`;
}

function hbMobilitySharedShellStyles() {
  return `${rhiUxCoreStyles()}
    :host{
      --hi-primary:var(--rhi-color-primary);
      --hi-primary-soft:var(--rhi-color-primary-soft);
      --hi-ink:var(--rhi-color-text);
      --hi-muted:var(--rhi-color-muted);
      --hi-line:var(--rhi-color-line);
      --hi-surface:var(--rhi-color-surface);
      --hi-surface-soft:var(--rhi-color-surface-soft);
    }
    .rhiMobilityNav-intelligence .rhiUxDomainShell{--rhi-nav-active-bg:#F1EDFF;--rhi-nav-active-border:#DFD5FB;--rhi-nav-active-text:#5A38B3}
    .rhiMobilityNav-insights .rhiUxDomainShell{--rhi-nav-active-bg:#E7F7F4;--rhi-nav-active-border:#CDEBE6;--rhi-nav-active-text:#176E67}
    .placeholder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .placeholder-card{background:#fff;border:1px solid #E8EEF7;border-radius:20px;padding:18px;box-shadow:0 16px 38px rgba(15,35,80,.07)}
    .placeholder-card h3{margin:0 0 8px;font-size:18px;color:#06142D}
    .placeholder-card p{margin:0;color:#66728B;font-size:13px;line-height:1.45}
    .placeholder-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px;color:var(--rhi-color-primary);font-size:12px;font-weight:650;text-transform:uppercase;letter-spacing:.04em}
    .placeholder-kicker ha-icon{--mdc-icon-size:18px}
    .footer-note{margin-top:12px;color:#66728B;font-size:12px;font-weight:600}
    .status-strip.dashboard-status-strip,.status-strip.ops-status-strip,.outcome-header{width:100%;max-width:none;margin:8px 0 10px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #E0E8F2;border-radius:16px;background:#fff;box-shadow:0 10px 24px rgba(15,35,80,.045);overflow:hidden}
    .status-strip.dashboard-status-strip .metric,.status-strip.ops-status-strip .metric,.outcome-header .metric{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:center;min-width:0;padding:12px 14px;border-right:1px solid #E8EEF6;background:transparent}
    .status-strip.dashboard-status-strip .metric:last-child,.status-strip.ops-status-strip .metric:last-child,.outcome-header .metric:last-child{border-right:0}
    .status-strip.dashboard-status-strip .metric ha-icon,.status-strip.ops-status-strip .metric ha-icon,.outcome-header .metric ha-icon{--mdc-icon-size:20px}
    .status-strip.dashboard-status-strip .metric>div,.status-strip.ops-status-strip .metric>div,.outcome-header .metric>div{min-width:0}
    .status-strip.dashboard-status-strip .metric span,.status-strip.ops-status-strip .metric span,.outcome-header .metric span{display:block;font-size:9px;font-weight:600;line-height:1.1;color:#708098;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .status-strip.dashboard-status-strip .metric b,.status-strip.ops-status-strip .metric b,.outcome-header .metric b{display:block;margin-top:2px;font-size:12.5px;font-weight:650;line-height:1.15;color:#10213A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .status-strip .tone-green>ha-icon{color:#16A765}.status-strip .tone-blue>ha-icon{color:var(--rhi-color-primary)}.status-strip .tone-orange>ha-icon{color:var(--rhi-color-attention)}
    .section-title{margin-top:4px;margin-bottom:8px}
    .hi-version-block{display:none}
    @media(max-width:920px){
      .status-strip.dashboard-status-strip,.status-strip.ops-status-strip,.outcome-header{grid-template-columns:repeat(5,minmax(150px,1fr));overflow-x:auto}
      .status-strip.dashboard-status-strip .metric,.status-strip.ops-status-strip .metric,.outcome-header .metric{min-width:150px}
    }
    @media(max-width:760px){
      .placeholder-grid{grid-template-columns:1fr}
    }
    /* rc.56 shared image-first appearance selector */
    .visual-picker-panel{
      margin:0;padding:12px;border:1px solid #dce7f3;border-radius:14px;
      background:#fbfdff;box-shadow:none;display:grid;gap:10px;
    }
    .visual-picker-panel .vehicle-picker-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .visual-picker-panel .vehicle-picker-head small{font-size:9px;letter-spacing:.11em;color:#64748b;font-weight:700}
    .visual-picker-panel .vehicle-picker-head h3{margin:2px 0;font-size:15px;line-height:1.15;color:#0f172a}
    .visual-picker-panel .vehicle-picker-head p{margin:0;font-size:10.5px;line-height:1.3;color:#64748b;font-weight:500}
    .visual-picker-panel .vehicle-picker-close{width:30px;height:30px;min-width:30px;border:1px solid #dbe5f0;border-radius:9px;background:#fff;color:#64748b;padding:0;display:grid;place-items:center}
    .visual-choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:8px;align-items:stretch}
    .visual-choice-card{
      position:relative;appearance:none;border:1px solid #e0e8f2;border-radius:12px;background:#fff;
      min-width:0;min-height:126px;padding:8px;display:grid;grid-template-rows:78px auto;gap:6px;
      text-align:left;cursor:pointer;color:#0f172a;box-shadow:none;overflow:hidden;
    }
    .visual-choice-card:hover{border-color:#a9c8f6;background:#f8fbff}
    .visual-choice-card.active{border-color:#1467F5;box-shadow:0 0 0 2px rgba(20,103,245,.10);background:#f7fbff}
    .visual-choice-image{display:grid;place-items:center;min-width:0;height:78px;border-radius:9px;background:linear-gradient(135deg,#fff,#f5f8fc);overflow:hidden}
    .visual-choice-image img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;transform:none}
    .visual-choice-image ha-icon{--mdc-icon-size:42px;color:#94a3b8}
    .visual-choice-copy{display:grid;gap:2px;min-width:0}
    .visual-choice-copy b{font-size:11px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .visual-choice-copy small{font-size:9px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .visual-choice-check{position:absolute;top:7px;right:7px;--mdc-icon-size:17px;color:#1467F5;opacity:0}
    .visual-choice-card.active .visual-choice-check{opacity:1}
    .visual-picker-refine{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0;align-items:end}
    .visual-picker-refine label{display:grid;gap:4px;min-width:0}
    .visual-picker-refine label>span{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.045em;color:#64748b}
    .visual-picker-refine select{width:100%;height:34px;min-height:34px;border:1px solid #d7e2ef;border-radius:8px;background:#fff;color:#0f172a;padding:0 8px;font-size:10.5px;font-weight:600}
    .visual-picker-apply{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding-top:2px}
    .visual-picker-selection{display:flex;align-items:baseline;gap:6px;min-width:0}
    .visual-picker-selection small{font-size:9px;color:#64748b;text-transform:uppercase;font-weight:700}
    .visual-picker-selection b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .visual-picker-selection span{font-size:10px;color:#64748b;white-space:nowrap}
    .visual-picker-apply .vehicle-picker-save{height:36px;min-height:36px;border:1px solid #1467F5;border-radius:9px;background:#1467F5;color:#fff;padding:0 12px;display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:650;cursor:pointer}
    .visual-picker-apply .vehicle-picker-save:disabled{background:#eef2f7;border-color:#d9e2ec;color:#94a3b8;cursor:not-allowed}
    .visual-picker-notice{display:flex;align-items:flex-start;gap:7px;padding:8px 10px;border:1px solid #e6edf5;border-radius:10px;background:#fff;color:#64748b;font-size:10px;line-height:1.3}
    .visual-picker-notice ha-icon{--mdc-icon-size:16px;color:#64748b;flex:none}
    .vehicle-picker-key,.vehicle-picker-gap{display:none}

    @media(max-width:820px){
      .visual-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .visual-picker-refine{grid-template-columns:repeat(2,minmax(0,1fr))}
      .visual-picker-apply{grid-template-columns:1fr auto}
    }
    @media(max-width:520px){
      .visual-picker-panel{padding:9px;gap:8px}
      .visual-choice-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:2px}
      .visual-choice-card{flex:0 0 156px;scroll-snap-align:start}
      .visual-picker-refine{grid-template-columns:1fr 1fr}
      .visual-picker-apply{grid-template-columns:1fr}
      .visual-picker-apply .vehicle-picker-save{width:100%;justify-content:center}
      .visual-picker-selection{min-height:20px}
    }
    ${typeof hbMobilityPresentationStyles === "function" ? hbMobilityPresentationStyles() : ""}
  `;
}


/* One final responsive/presentation authority for all Mobility workspaces.
   Layout only: never infer backend state or alter command/readback ownership.
   Keep phone/tablet/desktop behavior centralized rather than adding RC-specific
   stylesheet overrides separately in each screen. */
function hbMobilityResponsiveFinishStyles() {
  return `
    :host{display:block;min-width:0;max-width:100%;--mobility-row-gap:8px}
    ha-card,.page,.rhiUxDomainBody,.rhiUxPage,.rhiUxPageContent{min-width:0;max-width:100%;box-sizing:border-box}
    .page{width:min(100%,1480px);margin-inline:auto;padding:16px 20px 24px;gap:10px}
    .page > *{min-width:0}
    .rhiUxPageHero,.rhi-page-hero-overview,.detail-scene-hero{box-shadow:none}
    .ov-quickbar{box-shadow:none;min-width:0}
    .ov-nav-action{box-shadow:none;min-height:40px}
    .vehicles-top-status,.chargers-top-status{gap:8px}
    .rhiUxStatusGrid > *, .ov-domain-statusbar .ov-status-item{min-width:0}
    .rhiUxStatusGrid b,.ov-domain-statusbar b{white-space:normal;overflow-wrap:normal;text-overflow:clip}
    .rhiUxStatusGrid small,.ov-domain-statusbar em{min-width:0}
    .section-title{align-items:baseline;gap:10px;flex-wrap:wrap;margin:4px 0 0}
    .section-title span{max-width:100%;white-space:normal;overflow-wrap:break-word}
    .vehicle-workspace-list,.grid,.ov-vehicle-list{min-width:0;align-items:start}
    .vehicle-card.premium-vehicle-card,.charger-card,.section-card{min-width:0;box-shadow:0 3px 12px rgba(15,35,80,.035)}
    .vehicle-card .hero-split-row{min-width:0;gap:8px}
    .vehicle-card .vehicle-hero-panel,.vehicle-card .charger-hero-panel{min-width:0}
    .vehicle-card .vehicle-image img{max-width:100%;transform:none}
    .vehicle-card .status-top-row.vehicle-intelligence-strip{
      display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;
      border-top:1px solid #e6edf5;border-bottom:1px solid #e6edf5;
      padding:4px 10px;background:#fff;overflow:visible
    }
    .vehicle-card .status-top-row .intelligence-status-row{
      border:0;border-radius:0;background:transparent;box-shadow:none;
      min-width:0;min-height:48px;height:auto;padding:7px 9px;
      grid-template-columns:20px minmax(0,1fr);align-content:center;overflow:visible
    }
    .vehicle-card .intelligence-status-row + .intelligence-status-row{border-left:1px solid #e6edf5}
    .vehicle-card .intelligence-status-row .pill{
      display:block;min-width:0;max-width:100%;width:100%;padding:0;
      background:transparent;border:0;border-radius:0;box-shadow:none;
      font-size:12px;line-height:1.3;text-align:left;
      white-space:normal;overflow-wrap:normal;word-break:normal;text-overflow:clip
    }
    .vehicle-card .intelligence-status-row small{
      display:none /* full diagnostic reason stays in the row title and detail view */
    }
    .vehicle-card .vehicle-metrics-strip.mock-metrics{
      border:1px solid #e6edf5;border-radius:11px;overflow:hidden;background:#fff;
      grid-template-columns:repeat(3,minmax(0,1fr));height:auto
    }
    .vehicle-card .vehicle-metrics-strip.mock-metrics .metric-chip{
      min-width:0;min-height:48px;height:auto;padding:8px 10px;
      border:0;border-radius:0;background:transparent;box-shadow:none
    }
    .vehicle-card .vehicle-metrics-strip.mock-metrics .metric-chip + .metric-chip{border-left:1px solid #e6edf5}
    .vehicle-card .metric-chip b{white-space:normal;overflow-wrap:normal;word-break:normal;line-height:1.3}
    .vehicle-card .charge-mini-strip.mock-controls{min-width:0;height:auto;align-items:stretch}
    .vehicle-card .charge-mini-strip > *{min-width:0}
    .vehicle-card .mini-control,.vehicle-card .mini-current-stepper,.vehicle-card .mini-power-read{height:auto;min-height:44px;box-shadow:none}
    .vehicle-card .relationship-copy{min-width:0;max-width:100%}
    .vehicle-card .relationship-copy strong{white-space:normal;overflow-wrap:break-word}
    .vehicle-card .vehicle-actions.clean-actions{display:flex;flex-wrap:wrap;gap:7px;overflow:visible;align-items:center;padding:8px 10px}
    .vehicle-card .vehicle-actions.clean-actions .action-spacer{display:none}
    .vehicle-card .vehicle-actions.clean-actions .action:not(.icon-only){
      display:inline-flex;flex:0 1 auto;min-width:100px;width:auto;max-width:100%;
      height:40px;min-height:40px;padding:0 12px;white-space:normal
    }
    .vehicle-card .charger-link-inline{
      display:inline-flex;align-items:center;gap:4px;justify-self:start;
      width:fit-content;min-height:30px;margin-top:6px;padding:2px 0;
      border:0;border-radius:0;background:transparent;color:#075fd8;
      box-shadow:none;font:inherit;font-size:11px;font-weight:650;cursor:pointer;
      text-align:left
    }
    .vehicle-card .charger-link-inline ha-icon{--mdc-icon-size:15px}
    .ov-overview-vehicles .ov-row-actions .ov-detail{display:inline-flex;align-items:center;gap:5px;min-width:74px;width:auto;padding:0 10px}
    .ov-overview-vehicles .ov-row-actions .ov-detail ha-icon{--mdc-icon-size:16px}
    .vehicle-card .vehicle-actions.clean-actions .vehicle-card-details{
      margin-left:auto;display:inline-flex;align-items:center;gap:5px;
      min-width:88px;flex:0 0 auto;color:#075fd8;background:#fff;
      border:1px solid #dce7f4;border-radius:10px;min-height:40px;padding:0 12px;font-weight:650
    }
    .vehicle-card .vehicle-card-details ha-icon{--mdc-icon-size:17px}
    .ov-vehicle-main,.ov-vehicle-copy,.ov-vehicle-image,.ov-vehicle-row{min-width:0}
    .ov-vehicle-main{overflow:hidden}
    .ov-vehicle-copy{overflow:hidden}
    .ov-vehicle-copy b{display:block;overflow-wrap:normal;word-break:normal;white-space:normal}
    .ov-vehicle-image img{max-width:100%;object-fit:contain}
    .charger-card .charger-kpis{gap:0;border:1px solid #e5ecf4;border-radius:12px;overflow:hidden}
    .charger-card .charger-kpis .field{
      min-width:0;background:#fff;border:0;border-radius:0;padding:10px;
      box-shadow:none;min-height:62px
    }
    .charger-card .charger-kpis .field:nth-child(even){border-left:1px solid #e5ecf4}
    .charger-card .charger-kpis .field:nth-child(n+3){border-top:1px solid #e5ecf4}
    .charger-card .field b,.charger-card .detail-field b{white-space:normal;overflow-wrap:break-word;text-overflow:clip}
    .charger-card .charger-state-actions{gap:8px;align-items:center;padding-top:8px}
    .charger-card .soft-line span{box-shadow:none}
    .charger-card .charger-identity-top{grid-template-columns:minmax(0,1fr) auto auto}
    .charger-card .charger-header-details{width:auto;min-width:82px;min-height:34px;padding:0 8px;gap:4px}
    .charger-card .charger-header-details span{display:inline;font-size:11px;font-weight:650}
    .charger-card .charger-header-details ha-icon{--mdc-icon-size:16px}

    /* Mobility product action/fact parity: same visual grammar, not shared Core overrides.
       Disable is an actionable verb (not lifecycle status); command buttons remain
       owned by producer truth, even when unavailable. */
    .mobility-detail-action{
      display:inline-flex;align-items:center;justify-content:center;gap:5px;
      min-height:40px;height:auto;box-sizing:border-box;padding:0 12px;
      border:1px solid #dce7f4;border-radius:10px;background:#fff;
      color:#075fd8;font-size:12px;font-weight:650;line-height:1.15;
      text-decoration:none;cursor:pointer;white-space:nowrap;box-shadow:none
    }
    .mobility-detail-action ha-icon{--mdc-icon-size:17px;color:currentColor}
    .mobility-lifecycle-action{
      display:inline-flex;align-items:center;justify-content:center;gap:7px;
      height:40px;min-height:40px;box-sizing:border-box;padding:0 12px;
      border:1px solid #dce7f4;border-radius:10px;background:#fff;
      color:#24364f;font-size:12px;font-weight:650;line-height:1.15;
      cursor:pointer;box-shadow:none;white-space:nowrap
    }
    .mobility-lifecycle-action ha-icon{--mdc-icon-size:16px;color:#1467f5}
    .mobility-lifecycle-action:disabled,.mobility-detail-action:disabled{
      opacity:.55;cursor:not-allowed
    }
    .mobility-lifecycle-action:focus-visible,.mobility-detail-action:focus-visible,
    .charger-command-row .cmd:focus-visible{outline:2px solid #1467f5;outline-offset:2px}
    .vehicle-card .vehicle-actions.clean-actions .mobility-lifecycle-action{
      flex:0 1 auto;width:auto;min-width:94px;max-width:none;padding:0 12px
    }
    .vehicle-card .vehicle-actions.clean-actions .vehicle-card-details.mobility-detail-action{
      border-radius:10px;min-height:40px;max-width:none;width:auto;flex:0 0 auto;
      font-size:12px
    }
    .charger-card .charger-identity-card{min-height:110px}
    .charger-card .charger-identity-top{grid-template-columns:minmax(0,1fr) auto}
    .charger-card .charger-status-strip{
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;
      border-top:1px solid #e6edf5;border-bottom:1px solid #e6edf5;
      padding:0 4px;background:#fff;min-width:0
    }
    .charger-card .charger-status-fact{
      display:grid;grid-template-columns:19px minmax(0,1fr);gap:6px;
      align-items:center;min-width:0;padding:8px 11px
    }
    .charger-card .charger-status-fact + .charger-status-fact{border-left:1px solid #e6edf5}
    .charger-card .charger-status-fact ha-icon{--mdc-icon-size:17px;color:#36567e}
    .charger-card .charger-status-fact span{min-width:0;display:block}
    .charger-card .charger-status-fact small{
      display:block;font-size:9.5px;font-weight:600;line-height:1.2;color:#65758c
    }
    .charger-card .charger-status-fact b{
      display:block;margin-top:2px;font-size:12px;font-weight:650;line-height:1.25;
      white-space:normal;overflow-wrap:break-word;color:#1d2b45
    }
    .charger-card .charger-kpis.mobility-fact-strip{
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;
      border:1px solid #e5ecf4;border-radius:11px;margin:0;background:#fff;overflow:hidden
    }
    .charger-card .charger-kpis.mobility-fact-strip .mobility-fact{
      display:grid;grid-template-columns:18px minmax(0,1fr);grid-template-rows:auto auto;
      min-width:0;min-height:46px;height:auto;gap:1px 7px;align-content:center;
      padding:6px 11px;border:0;border-radius:0;background:#fff;box-shadow:none
    }
    .charger-card .charger-kpis.mobility-fact-strip .mobility-fact + .mobility-fact{
      border-left:1px solid #e5ecf4
    }
    .charger-card .charger-kpis.mobility-fact-strip .mobility-fact:nth-child(n+3){border-top:0}
    .charger-card .charger-kpis .mobility-fact ha-icon{
      grid-column:1;grid-row:1/3;--mdc-icon-size:16px;align-self:center;color:#36567e
    }
    .charger-card .charger-kpis .mobility-fact span{
      grid-column:2;font-size:9.5px;line-height:1.2;font-weight:600;color:#65758c
    }
    .charger-card .charger-kpis .mobility-fact b{
      grid-column:2;margin:0;font-size:13px;line-height:1.25;
      font-weight:650;white-space:normal;overflow-wrap:break-word;color:#14243d
    }
    .charger-card .charger-command-row{
      display:flex;align-items:center;gap:7px;flex-wrap:wrap;
      min-width:0;border-top:1px solid #e6edf5;padding:8px 0 0
    }
    .charger-card .charger-command-row .cmd{
      display:inline-flex;flex:0 1 auto;width:auto;min-width:106px;
      max-width:100%;height:40px;min-height:40px;
      padding:0 12px;border:1px solid #dce7f4;border-radius:10px;
      background:#fff;color:#23324b;box-shadow:none;font-size:12px;font-weight:650
    }
    .charger-card .charger-command-row .cmd ha-icon{--mdc-icon-size:17px;color:#1467f5}
    .charger-card .charger-command-row .cmd:disabled{opacity:.48;cursor:not-allowed}
    .charger-card .charger-command-row .cmd.enum-command{display:grid;grid-template-columns:18px minmax(0,1fr)}
    .charger-card .charger-command-row .cmd.enum-command select{min-width:0}
    .charger-card .charger-command-row .empty-actions{
      flex:1 1 160px;max-width:none;border:0;padding:4px 0;
      font-size:11px;text-align:left;min-width:0
    }
    .charger-card .charger-command-row .lifecycle-control-wrap{margin-left:auto}
    .charger-card .charger-command-row .mobility-lifecycle-action{
      flex:0 0 auto;max-width:none;min-width:92px
    }
    .charger-card .charger-command-row .charger-card-details{
      margin-left:auto;min-width:84px;flex:0 0 auto
    }
    .charger-card .charger-command-row .lifecycle-control-wrap + .charger-card-details{margin-left:0}
    .charger-card .config-details{border-top:1px solid #edf1f6;padding-top:7px}
    @media(max-width:760px){
      .charger-card .charger-kpis.mobility-fact-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
      .charger-card .charger-kpis.mobility-fact-strip .mobility-fact:nth-child(odd){border-left:0}
      .charger-card .charger-kpis.mobility-fact-strip .mobility-fact:nth-child(n+3){border-top:1px solid #e5ecf4}
      .charger-card .charger-status-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
      .charger-card .charger-status-fact:nth-child(3){border-top:1px solid #e6edf5;border-left:0}
      .charger-card .charger-command-row .cmd{flex:1 1 120px}
      .charger-card .charger-command-row .charger-card-details{margin-left:auto}
    }
    @media(max-width:390px){
      .charger-card .charger-status-strip{grid-template-columns:minmax(0,1fr)}
      .charger-card .charger-status-fact{padding:7px 9px}
      .charger-card .charger-status-fact + .charger-status-fact{border-left:0;border-top:1px solid #e6edf5}
      .charger-card .charger-command-row .cmd{flex:1 1 calc(50% - 7px);min-width:105px}
    }
    .charger-card .detail-grid{gap:0;border-top:1px solid #e5ecf4}
    .charger-card .detail-field{border:0;border-bottom:1px solid #e5ecf4;border-radius:0;background:transparent;padding:9px}
    .rhi-insight-vehicle,.rhi-insight-vehicle-list,.rhi-data-row{min-width:0}
    .rhi-data-row{overflow-wrap:break-word}
    .row,.edit-row{min-width:0}
    .row>* ,.edit-row>*{min-width:0}
    .row-value-with-link{min-width:0}
    @media(max-width:1100px){
      .page{padding:14px 16px 22px}
      .vehicle-card .status-top-row.vehicle-intelligence-strip{grid-template-columns:repeat(3,minmax(0,1fr))}
      .vehicle-card .intelligence-status-row:nth-child(4){border-left:0}
      .vehicle-card .hero-split-row{grid-template-columns:minmax(0,1fr)}
      .charger-card .charger-hero-card{min-width:0}
      .grid,.vehicles,.vehicle-workspace-list{grid-template-columns:1fr}
    }
    @media(max-width:760px){
      .page{padding:10px 12px 20px;gap:9px}
      .rhiUxDomainShellTop{min-height:0;grid-template-columns:1fr;padding:7px 10px}
      .rhiUxDomainIdentity{display:none}
      .rhiUxDomainShellBottom{min-height:0;padding:5px 10px 7px}
      .rhiUxModuleTabs{gap:4px}
      .rhiUxDomainTabs{min-height:36px;gap:5px}
      .rhiUxPageHero,.rhi-page-hero-overview,.detail-scene-hero{height:126px;min-height:126px;margin:0;border-radius:14px}
      .rhiUxPageHeroCopy{width:62%;padding:16px 10px 12px 14px}
      .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:clamp(23px,4vw,29px);line-height:1.05}
      .rhiUxPageHeroCopy p{font-size:11px;line-height:1.3;-webkit-line-clamp:2}
      .rhiUxPageHeroArt{inset:0 0 0 35%}
      .vehicles-top-status,.chargers-top-status{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      .rhiUxStatusGrid>*{min-height:72px;padding:9px 10px}
      .ov-quickbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:8px}
      .ov-quick-title{display:none}
      .ov-nav-action{min-width:0;max-width:none;min-height:40px;white-space:normal}
      .ov-domain-statusbar{grid-template-columns:repeat(2,minmax(0,1fr))}
      .ov-domain-statusbar .ov-status-item{min-height:80px;height:auto;padding:9px 10px}
      .ov-domain-statusbar .ov-status-item em:last-child{display:none}
      .ov-overview-vehicles .ov-panel-head{gap:10px;flex-wrap:wrap}
      .ov-overview-vehicles .ov-panel-head button{min-height:38px}
      .ov-overview-vehicles .ov-vehicle-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:10px}
      .ov-overview-vehicles .ov-vehicle-main{grid-column:1/-1;display:grid;grid-template-columns:80px minmax(0,1fr);gap:10px;align-items:center}
      .ov-overview-vehicles .ov-vehicle-image{width:80px;height:54px}
      .ov-overview-vehicles .ov-vehicle-copy b{font-size:14px;line-height:1.2}
      .ov-overview-vehicles .ov-signal{min-width:0;padding:5px 0}
      .ov-overview-vehicles .ov-assignment,.ov-overview-vehicles .ov-charging-state,.ov-overview-vehicles .ov-row-actions{grid-column:1/-1;min-width:0}
      .ov-overview-vehicles .ov-row-actions{display:flex;gap:7px;flex-wrap:wrap;overflow:visible}
      .vehicle-card .status-top-row.vehicle-intelligence-strip{grid-template-columns:repeat(2,minmax(0,1fr));padding:5px 9px}
      .vehicle-card .intelligence-status-row:nth-child(odd){border-left:0}
      .vehicle-card .intelligence-status-row:nth-child(even){border-left:1px solid #e6edf5}
      .vehicle-card .vehicle-hero-panel{height:auto;min-height:126px}
      .vehicle-card .charger-hero-panel{min-height:70px}
      .vehicle-card .vehicle-control-row.mock-row{grid-template-columns:1fr;gap:6px;padding:0 9px 8px}
      .vehicle-card .vehicle-metrics-strip.mock-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}
      .vehicle-card .charge-mini-strip.mock-controls,.vehicle-card .charge-mini-strip.no-mode,.vehicle-card .charge-mini-strip.no-speed{
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px
      }
      .vehicle-card .charge-mini-strip .charger-select{grid-column:1/-1}
      .vehicle-card .mini-current-stepper.compact-current{min-width:0}
      .charger-card{gap:8px;padding:10px}
      .charger-card .charger-identity-card{min-height:110px}
      .charger-card .charger-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
      .charger-card .charger-identity-top{min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:6px}
      .charger-card .charger-identity-top .charger-title{flex:1 1 100%}
      .charger-card .charger-identity-top .status{justify-self:start}
      .detail-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .grid,.bottom-grid,.top-grid,.insights-grid,.log-grid{grid-template-columns:1fr}
      .row,.edit-row{grid-template-columns:20px minmax(0,1fr);gap:4px 8px}
      .row > :last-child,.edit-row > :last-child{grid-column:2;min-width:0;max-width:100%;justify-self:start}
      .section-card{padding:12px}
    }
    @media(max-width:560px){
      .page{padding:8px 10px 18px}
      .vehicle-card .hero-split-row{display:grid;grid-template-columns:1fr;gap:6px;padding:8px 9px 5px}
      .vehicle-card .vehicle-hero-panel{
        position:relative;display:grid;
        grid-template-columns:minmax(0,1fr) 112px;grid-template-rows:auto auto;
        align-items:center;gap:4px 8px;height:auto;min-height:122px;
        padding:10px;overflow:hidden
      }
      .vehicle-card .vehicle-copy{
        position:relative;inset:auto;width:auto;max-width:100%;min-width:0;
        grid-column:1;grid-row:1;padding:0;margin:0;z-index:2;align-self:center
      }
      .vehicle-card .vehicle-copy h2{font-size:17px;line-height:1.2;white-space:normal;overflow-wrap:break-word}
      .vehicle-card .vehicle-copy p{font-size:11px;line-height:1.25;white-space:normal;overflow-wrap:break-word}
      .vehicle-card .vehicle-image{
        position:relative;inset:auto;right:auto;left:auto;top:auto;bottom:auto;
        width:100%;height:92px;min-height:0;grid-column:2;grid-row:1;
        overflow:hidden;pointer-events:none
      }
      .vehicle-card .vehicle-image img{
        display:block;width:100%;height:100%;max-width:100%;max-height:92px;
        object-fit:contain;object-position:center;transform:none
      }
      .vehicle-card .vehicle-appearance-action{
        position:relative;inset:auto;left:auto;bottom:auto;right:auto;
        z-index:2;grid-column:1/-1;grid-row:2;justify-self:start;
        height:34px;min-height:34px;padding:0 9px
      }
      .vehicle-card .charger-hero-panel{height:auto;min-height:64px;grid-template-columns:minmax(0,1fr) 80px}
      .vehicle-card .charger-mini-image{width:78px;height:58px}
      .vehicle-card .charger-mini-image img{max-width:76px;max-height:57px}
      .vehicle-card .status-top-row.vehicle-intelligence-strip{grid-auto-rows:auto;gap:0;padding:3px 8px}
      .vehicle-card .status-top-row .intelligence-status-row{
        grid-template-columns:18px minmax(0,1fr);grid-template-rows:auto auto;
        min-height:52px;max-height:none;height:auto;align-content:center;
        padding:7px 6px;overflow:visible
      }
      .vehicle-card .intelligence-status-row span{white-space:normal;overflow-wrap:normal}
      .vehicle-card .intelligence-status-row .pill{
        min-width:0;width:100%;max-width:100%;white-space:normal;
        overflow-wrap:normal;word-break:normal;line-height:1.25;
        font-size:11.5px;text-overflow:clip
      }
      .vehicle-card .vehicle-metrics-strip.mock-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
      .vehicle-card .vehicle-metrics-strip.mock-metrics .metric-chip:nth-child(odd){border-left:0}
      .vehicle-card .vehicle-metrics-strip.mock-metrics .metric-chip:nth-child(n+3){border-top:1px solid #e6edf5}
      .vehicle-card .charge-mini-strip.mock-controls,.vehicle-card .charge-mini-strip.mock-controls.no-speed{grid-template-columns:1fr}
      .vehicle-card .vehicle-actions.clean-actions{display:flex;flex-wrap:wrap;padding:8px 9px;gap:7px;overflow:visible}
      .vehicle-card .vehicle-actions.clean-actions .action:not(.icon-only){flex:1 1 120px;min-width:0;max-width:100%}
      .vehicle-card .vehicle-actions.clean-actions .vehicle-card-details{margin-left:auto;flex:1 1 120px}
      .charger-card .charger-identity-card{grid-template-columns:minmax(0,1fr) 92px;gap:8px}
      .charger-card .charger-identity-card .charger-visual{width:92px;max-width:92px;height:90px;min-height:90px}
      .charger-card .charger-identity-card .charger-visual img{max-width:88px;max-height:84px}
      .charger-card .charger-title h3{font-size:15px;line-height:1.18;white-space:normal;overflow-wrap:break-word}
      .charger-card .charger-header-details{min-height:34px}
      .charger-card .charger-state-actions{flex-wrap:wrap;gap:6px}
      .charger-card .soft-line .charger-assignment{max-width:100%;flex:1 1 180px}
      .detail-scene-hero .hero-left{width:66%;min-width:0}
      .detail-scene-hero .hero-image{width:42%;right:0}
      .rhi-insight-vehicle{grid-template-columns:1fr}
      .rhi-insight-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:390px){
      .rhiUxPageHero,.rhi-page-hero-overview,.detail-scene-hero{height:112px;min-height:112px}
      .rhiUxPageHeroCopy{width:66%;padding:12px 7px 10px 10px}
      .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:22px}
      .rhiUxPageHeroCopy p{font-size:10.5px}
      .vehicle-card .vehicle-hero-panel{grid-template-columns:minmax(0,1fr) 92px}
      .vehicle-card .vehicle-image{height:78px}
      .vehicle-card .vehicle-image img{max-height:78px}
      .ov-domain-statusbar{grid-template-columns:1fr}
    }
  `;
}
