// 95-placeholder-and-router-cards.js
// Routed Intelligence/Insights projections and generic asset detail cards.

class HomeBrainMobilityPlaceholderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.config = {};
    this._lastRevisionSignature = "";
    this._activityType = "all";
    this._activitySort = "newest";
    this._activityGroup = "type";
  }
  setConfig(config = {}) { this.config = config; }
  getCardSize() { return 8; }

  set hass(hass) {
    this._hass = hass;
    const rt = new HomeBrainAssetRuntime(hass, this.config);
    const view = this.config.view || this.viewFromPath();
    // Canonical property revisions are authoritative for planning, strategies and insights.
    // Retain activity/command revisions only for their supported domain contracts.
    const revisionIds = view === "log"
      ? ["sensor.rhi_mobility_activity_v2"]
      : view === "planning"
        ? ["sensor.rhi_mobility_command_v2"]
        : ["sensor.rhi_mobility_activity_v2"];
    const canonicalRevision = rt._canonicalProperties?.revision() ?? 0;
    const energyRevision = ["planning","strategies","history"].includes(view)
      ? new HomeBrainEnergyCanonicalProjection(hass).revisionSignature(view) : "";
    const revisionSignature = `${view}|${canonicalRevision}|${rt.entityRevisionSignature(revisionIds)}|${energyRevision}`;
    if (revisionSignature === this._lastRevisionSignature) return;
    this._lastRevisionSignature = revisionSignature;
    const data = this.viewModel(view);
    this.shadowRoot.replaceChildren();
      const fragment = document.createElement("template");
      fragment.innerHTML = `<ha-card><div class="page">
      ${hbMobilityNav(view)}
      ${hbMobilityPageHero(rt, view)}
      ${this.renderTopStatus(rt, view)}
      ${this.renderTopActions(rt, view)}
      ${view === "planning" ? this.renderPlanning(rt) : view === "strategies" ? this.renderStrategies(rt) : view === "history" ? this.renderInsights(rt) : view === "log" ? this.renderLog(rt) : this.renderContextCards(rt, data)}
      ${hbMobilityReleaseFooter(rt)}
    </div><style>${this.styles()}${hbMobilityResponsiveFinishStyles()}</style></ha-card>`;
      this.shadowRoot.append(fragment.content.cloneNode(true));
    this.shadowRoot.querySelectorAll("button[data-nav]").forEach((btn)=>btn.addEventListener("click",()=>rt.navigate(btn.getAttribute("data-nav"))));
    for(const [attr,field] of [["data-activity-type","_activityType"],["data-activity-sort","_activitySort"],["data-activity-group","_activityGroup"]]){
      this.shadowRoot.querySelectorAll(`select[${attr}]`).forEach(select=>select.addEventListener("change",()=>{
        this[field]=select.value;this._lastRevisionSignature="";
        if(this._hass)this.hass=this._hass;
      }));
    }
  }

  viewFromPath() {
    const path = String(window.location?.pathname || "").toLowerCase();
    if (path.includes("planning")) return "planning";
    if (path.includes("strategies")) return "strategies";
    if (path.includes("history")) return "history";
    if (path.includes("/log")) return "log";
    return "planning";
  }

  viewModel(view) {
    const models = {
      planning: {
        outcome: { opportunity: "planning", recommended_action: "review_plan" },
        cards: [
          { icon:"mdi:calendar-clock", kicker:"Planning", title:"Operational Planning", text:"Energy owns the planning truth. Mobility projects the published plan without recalculation." },
          { icon:"mdi:car-clock", kicker:"Readiness", title:"Vehicle Readiness", text:"Vehicle readiness and charging execution remain Mobility-owned and are shown alongside, not merged into, Energy planning semantics." }
        ]
      },
      strategies: {
        outcome: { opportunity: "strategy", recommended_action: "review_strategy" },
        cards: [
          { icon:"mdi:tune-variant", kicker:"Strategy", title:"Strategy Profiles", text:"Configured strategy intent is kept separate from the policy that is currently effective." },
          { icon:"mdi:shield-check-outline", kicker:"Effective", title:"Effective Strategy", text:"Energy-owned strategy state can be projected here without recreating strategy rules in Mobility UX." }
        ]
      },
      history: {
        outcome: { status: "Unknown", opportunity: "history", recommended_action: "none" },
        cards: [
          { icon:"mdi:history", kicker:"History", title:"Mobility History", text:"Historical executions, recommendations and outcomes remain a read-only Mobility insight." },
          { icon:"mdi:timeline-clock-outline", kicker:"Timeline", title:"Activity Timeline", text:"Time-ordered evidence stays backend-owned and is presented without frontend reinterpretation." }
        ]
      },
      log: {
        outcome: { status: "Unknown", opportunity: "audit", recommended_action: "none" },
        cards: [
          { icon:"mdi:text-box-search-outline", kicker:"Log", title:"Mobility Log", text:"Commands, runtime events and audit evidence remain available in one operational view." },
          { icon:"mdi:alert-outline", kicker:"Exceptions", title:"Exceptions", text:"Failed or rejected activity is surfaced with the backend-published reason when available." }
        ]
      }
    };
    return models[view] || models.planning;
  }

  energyPlanning(rt) {
    return new HomeBrainEnergyPlanningProjection(this._hass, rt).viewModel();
  }

  energyInsights(rt) {
    return new HomeBrainEnergyMobilityInsightsProjection(this._hass, rt).viewModel("today");
  }

  energyStrategies(rt) {
    return new HomeBrainEnergyMobilityStrategyProjection(this._hass, rt).viewModel();
  }

  fmtKwh(value) {
    return value === null || value === undefined ? "N/A" : `${Number(value).toFixed(1)} kWh`;
  }

  vehicleIdentity(rt, assetId = "", row = {}, meta = "") {
    const id = String(assetId || row.asset_id || row.target_asset_id || row.flexible_asset_id || row.consumer_asset_id || "").trim();
    const registry = id ? (rt.vehicleById?.(id) || rt.assetById?.(id, "vehicle") || rt.assetById?.(id) || null) : null;
    const asset = { ...(registry || {}), ...(row || {}), asset_id: id || registry?.asset_id || "" };
    const name = String(row.display_name || row.name || row.label || registry?.display_name || rt.assetDisplayName?.(id) || id || "Vehicle");
    const image = rt.visualImageUrl?.(asset, "vehicle", "image", "vehicle_fallback") || "";
    const picture = image
      ? `<span class="rhiVehicleThumb"><img src="${rt.escape(image)}" alt=""></span>`
      : `<span class="rhiVehicleThumb rhiVehicleThumbFallback"><ha-icon icon="mdi:car-electric"></ha-icon></span>`;
    return `<span class="rhiVehicleIdentity">${picture}<span><b>${rt.escape(name)}</b>${meta ? `<small>${rt.escape(meta)}</small>` : ""}</span></span>`;
  }

  renderTopStatus(rt, view) {
    if (view === "planning") {
      const plan = this.energyPlanning(rt);
      return hbMobilityStatusGrid(rt, [
        { icon:"mdi:calendar-check-outline", label:"Planned today", value:plan.today.plannedKwh === null || plan.today.plannedKwh === undefined ? "Not published" : this.fmtKwh(plan.today.plannedKwh), sub:plan.today.state || "Energy planning", tone:"neutral" },
        { icon:"mdi:calendar-alert-outline", label:"Still to plan", value:plan.today.stillToPlanKwh === null || plan.today.stillToPlanKwh === undefined ? "Not published" : this.fmtKwh(plan.today.stillToPlanKwh), sub:"Remaining energy today", tone:"neutral" },
        { icon:"mdi:weather-sunset-up", label:"Tomorrow", value:plan.tomorrow.plannedKwh === null || plan.tomorrow.plannedKwh === undefined ? "Not published" : this.fmtKwh(plan.tomorrow.plannedKwh), sub:plan.tomorrow.state || "Next horizon", tone:"neutral" }
      ], "planning-top-status");
    }
    if (view === "strategies") {
      const strategy = this.energyStrategies(rt);
      return hbMobilityStatusGrid(rt, [
        { icon:"mdi:tune-variant", label:"Configured", value:String(strategy.configured.length), sub:"Mobility-scoped Energy settings · not invented profiles", tone:"neutral" },
        { icon:"mdi:shield-check-outline", label:"Effective", value:String(strategy.effective.length), sub:"Policies in effect for Mobility assets", tone:"neutral" }
      ], "strategies-top-status");
    }
    if (view === "history") {
      const insights = this.energyInsights(rt);
      return hbMobilityStatusGrid(rt, [
        { icon:"mdi:counter", label:"Energy", value:this.fmtKwh(insights.totalVehicleEnergyKwh), sub:"Selected period", tone:"neutral" },
        { icon:"mdi:currency-eur", label:"Value", value:insights.totalAttributedEur === null ? "N/A" : `€${Number(insights.totalAttributedEur).toFixed(2)}`, sub:"Attributed value", tone:"neutral" },
        { icon:"mdi:car-multiple", label:"Vehicles", value:String(insights.rows.length), sub:"With measured history", tone:"neutral" }
      ], "history-top-status");
    }
    const rows = rt.activityRowsFor ? rt.activityRowsFor("") : [];
    const latest = rows[0] || null;
    const latestValue = latest
      ? String(latest.message || latest.result || latest.result_code || latest.activity_state || latest.status || latest.activity_type || latest.command_key || "Recent activity")
      : "No recent activity";
    const attention = String(rt.supervisorOutcome("mobility", "attention", "") || "").trim();
    const actionable = attention && !["none","ok","not applicable","unknown","unavailable"].includes(attention.toLowerCase());
    const cards = [
      { icon:"mdi:history", label:"Activity", value:`${rows.length} recent`, sub:latestValue, tone:"neutral" }
    ];
    if (actionable) cards.push({
      icon:"mdi:alert-circle-outline",
      label:"Attention",
      value:attention,
      sub:String(rt.supervisorOutcome("mobility", "attention_reason", "") || "Review recent activity"),
      tone:"warn"
    });
    return hbMobilityStatusGrid(rt, cards, "log-top-status");
  }

  renderTopActions(rt, view) {
    const actions = {
      planning: [
        { icon:"mdi:target", label:"Strategies", path:hbMobilityPath("/strategies"), primary:true },
        { icon:"mdi:car-electric", label:"Vehicle Management", path:hbMobilityPath("/dashboard") },
        { icon:"mdi:ev-station", label:"Charger Management", path:hbMobilityPath("/charger-maintenance") },
        { icon:"mdi:chart-timeline-variant", label:"History", path:hbMobilityPath("/history") }
      ],
      strategies: [
        { icon:"mdi:calendar-clock", label:"Planning", path:hbMobilityPath("/planning"), primary:true },
        { icon:"mdi:car-electric", label:"Vehicle Management", path:hbMobilityPath("/dashboard") },
        { icon:"mdi:ev-station", label:"Charger Management", path:hbMobilityPath("/charger-maintenance") },
        { icon:"mdi:chart-timeline-variant", label:"History", path:hbMobilityPath("/history") }
      ],
      history: [
        { icon:"mdi:format-list-bulleted", label:"Log", path:hbMobilityPath("/log"), primary:true },
        { icon:"mdi:car-electric", label:"Vehicle Management", path:hbMobilityPath("/dashboard") },
        { icon:"mdi:calendar-clock", label:"Planning", path:hbMobilityPath("/planning") },
        { icon:"mdi:target", label:"Strategies", path:hbMobilityPath("/strategies") }
      ],
      log: [
        { icon:"mdi:chart-timeline-variant", label:"History", path:hbMobilityPath("/history"), primary:true },
        { icon:"mdi:car-electric", label:"Vehicle Management", path:hbMobilityPath("/dashboard") },
        { icon:"mdi:ev-station", label:"Charger Management", path:hbMobilityPath("/charger-maintenance") },
        { icon:"mdi:calendar-clock", label:"Planning", path:hbMobilityPath("/planning") }
      ]
    };
    return hbMobilityQuickActions(rt, actions[view] || actions.planning);
  }

  planningHeroMeta(rt) {
    const plan = this.energyPlanning(rt);
    const source = plan.complete ? "Energy effective plan" : plan.published ? "Energy planning incomplete" : "Energy planning unavailable";
    const today = this.fmtKwh(plan.today.plannedKwh);
    const remaining = this.fmtKwh(plan.today.stillToPlanKwh);
    return `<strong>${rt.escape(source)}</strong><span>${rt.escape((rt?.t?.("planning.planned_today",{},"Planned today") || "Planned today"))} ${rt.escape(today)}</span><span>${rt.escape((rt?.t?.("planning.still_to_plan",{},"Still to plan") || "Still to plan"))} ${rt.escape(remaining)}</span>`;
  }

  strategyHeroMeta(rt) {
    const strategy = this.energyStrategies(rt);
    const source = strategy.configuredAvailable || strategy.effectiveAvailable ? "Energy configured settings" : "Energy strategy unavailable";
    return `<strong>${rt.escape(source)}</strong><span>${rt.escape(String(strategy.configured.length))} configured settings</span><span>${rt.escape(String(strategy.effective.length))} effective policies</span>`;
  }

  insightsHeroMeta(rt) {
    const insights = this.energyInsights(rt);
    const energy = this.fmtKwh(insights.totalVehicleEnergyKwh);
    const value = insights.totalAttributedEur === null ? "N/A" : `€${Number(insights.totalAttributedEur).toFixed(2)}`;
    const source = insights.meteringAvailable || insights.valueAvailable ? "Energy backend" : "Energy Insights unavailable";
    return `<strong>${rt.escape(source)}</strong><span>${rt.escape((rt?.t?.("planning.vehicle_energy",{},"Vehicle energy") || "Vehicle energy"))} ${rt.escape(energy)}</span><span>${rt.escape((rt?.t?.("planning.attributed_value",{},"Attributed value") || "Attributed value"))} ${rt.escape(value)}</span>`;
  }

  renderPlanning(rt) {
    const plan = this.energyPlanning(rt);
    const mobilityRows = plan.mobilityPlanningRows.length ? plan.mobilityPlanningRows : plan.mobilityExperienceRows;
    const facts = [
      ["mdi:calendar-check-outline","Planned today",this.fmtKwh(plan.today.plannedKwh),plan.today.provisional ? "Provisional metric · no effective schedule" : "Published effective plan"],
      ["mdi:calendar-alert-outline","Still to plan",this.fmtKwh(plan.today.stillToPlanKwh),"Published by Energy"],
      ["mdi:weather-sunset-up","Tomorrow",this.fmtKwh(plan.tomorrow.plannedKwh),plan.tomorrow.state || "Next horizon"],
      ["mdi:source-branch-check","Contract",plan.contractVersion || "Not published",plan.source],
      ["mdi:shield-alert-outline","Planning quality",plan.state,
        plan.providerHold ? `Provider HOLD: ${plan.requestedProvider} not effective` : `D0 ${plan.quality.D0} · D1 ${plan.quality.D1}`]
    ];
    const rows = mobilityRows.slice(0, 8).map((row) => {
      const id = String(row.asset_id || row.target_asset_id || row.flexible_asset_id || row.consumer_asset_id || row.participant_id || "Mobility asset");
      const planned = row.planned_kwh ?? row.planned_energy_kwh ?? row.energy_kwh ?? null;
      const start = row.planned_start || row.start_time || row.window_start || "";
      const end = row.planned_end || row.end_time || row.window_end || "";
      const state = String(row.planning_state || row.state || row.status || row.reason_label || "").trim();
      const usefulState = state && state.toLowerCase() !== "published" ? state : "";
      const answer = planned !== null && planned !== undefined && Number.isFinite(Number(planned))
        ? `${Number(planned).toFixed(1)} kWh planned`
        : (start || end)
          ? [usefulState, start && end ? `${start} → ${end}` : (start || end)].filter(Boolean).join(" · ")
          : (usefulState || "No per-asset schedule published");
      return `<div class="rhi-data-row rhiVehicleRow">${this.vehicleIdentity(rt,id,row)}<span>${rt.escape(answer)}</span></div>`;
    }).join("");
    const contractGap = !plan.complete
      ? (plan.providerHold
        ? `Requested provider ${plan.requestedProvider} is not effective. Energy reports ${plan.reason || "provider HOLD"}; deterministic baseline is not automatically an executable plan. D0: ${plan.quality.D0}; D1: ${plan.quality.D1}.`
        : plan.published
          ? `Effective planning incomplete. D0: ${plan.quality.D0}; D1: ${plan.quality.D1}. ${plan.reason || "Awaiting canonical planning evidence"}. Published numeric metrics are provisional, not an executable schedule.`
          : "No effective native Energy planning horizon is published. Mobility does not reconstruct or estimate a plan.")
      : (plan.exactIdentityJoin && !mobilityRows.length
          ? "The effective Energy plan is complete, but no published asset allocation matches a canonical Mobility asset ID. The UX must not guess the relationship."
          : "");

    const knownRows = ['D0','D1'].map(id => {
      const known=plan.independentKnownDemand?.[id];
      const label=rt.t(id==='D0'?'planning.today':'planning.tomorrow',{},id==='D0'?'Today':'Tomorrow');
      if (!known?.available) return `<div class="rhi-data-row"><b>${rt.escape(label)}</b><span>${rt.escape(rt.t('common.unavailable',{},'Unavailable'))}</span></div>`;
      const basis=known.source==='baseline'
        ? rt.t('planning.independent_baseline_source',{},'Independent Energy baseline')
        : rt.t('planning.effective_baseline_source',{},'Effective Energy known-load outlook');
      const values=[
        [rt.t('planning.home_baseload',{},'Home baseload'),known.homeKwh],
        [rt.t('planning.solar_forecast',{},'Solar forecast'),known.solarKwh],
        [rt.t('planning.grid_import_baseline',{},'Grid import (known loads)'),known.gridImportKwh],
        [rt.t('planning.grid_export_baseline',{},'Grid export (known loads)'),known.gridExportKwh]
      ].map(([name,value])=>`${name}: ${this.fmtKwh(value)}`).join(' · ');
      const unknown=known.unknownFlexibleLoadCount
        ? ` · ${known.unknownFlexibleLoadCount} ${rt.t('planning.unknown_loads',{},'unknown flexible loads')}` : '';
      return `<div class="rhi-data-row rhiKnownDemandRow"><b>${rt.escape(label)}</b><span>${rt.escape(basis)} · ${rt.escape(values)}${rt.escape(unknown)}</span></div>`;
    }).join('');
    return `<section class="rhi-context-grid">
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:home-lightning-bolt"></ha-icon>${rt.escape(rt.t('planning.known_outlook',{},'Known home and solar outlook'))}</div>
        <h3>${rt.escape(rt.t('planning.baseline_not_schedule',{},'Independent baseline, not an executable plan'))}</h3>
        <p>${rt.escape(rt.t('planning.baseline_scope',{},'This Energy forecast covers evidenced household baseload and solar only; unknown vehicle demand and battery dispatch are excluded. It does not approve charging.'))}</p>
        <div class="rhi-data-list">${knownRows}</div>
      </article>
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:calendar-clock"></ha-icon>${rt.escape((rt?.t?.("planning.energy_owned",{},"Energy-owned planning") || "Energy-owned planning"))}</div>
        <h3>${rt.escape((rt?.t?.("planning.what_charge_when",{},"What will charge, and when?") || "What will charge, and when?"))}</h3>
        <p>${rt.escape((rt?.t?.("planning.schedule_desc",{},"Only schedule and energy details explicitly published by Energy are shown. If a vehicle only participates in planning but has no schedule yet, that gap is stated directly.") || "Only schedule and energy details explicitly published by Energy are shown. If a vehicle only participates in planning but has no schedule yet, that gap is stated directly."))}</p>
        ${rows ? `<div class="rhi-data-list">${rows}</div>` : ""}
        ${contractGap ? `<div class="rhi-context-note">${rt.escape(contractGap)}</div>` : ""}
      </article>
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:car-clock"></ha-icon>${rt.escape((rt?.t?.("planning.execution_context",{},"Mobility execution context") || "Mobility execution context"))}</div>
        <h3>${rt.escape((rt?.t?.("planning.can_execute",{},"Can the plan execute?") || "Can the plan execute?"))}</h3>
        <p>${rt.escape((rt?.t?.("planning.execution_desc",{},"Mobility keeps charger assignment, physical connection and command readiness separate from Energy planning. A published plan is not presented as executable unless those facts exist.") || "Mobility keeps charger assignment, physical connection and command readiness separate from Energy planning. A published plan is not presented as executable unless those facts exist."))}</p>
        <div class="rhi-data-list">
          <div class="rhi-data-row"><b>${rt.escape((rt?.t?.("planning.source",{},"Source") || "Source"))}</b><span>${rt.escape(plan.source)}</span></div>
          <div class="rhi-data-row"><b>${rt.escape((rt?.t?.("planning.vehicles_in_planning",{},"Vehicles in planning") || "Vehicles in planning"))}</b><span>${rt.escape(String(mobilityRows.length))}</span></div>
          <div class="rhi-data-row"><b>${rt.escape((rt?.t?.("planning.plan_state",{},"Plan state") || "Plan state"))}</b><span>${rt.escape(plan.state || (rt?.t?.("common.unavailable",{},"Unavailable") || "Unavailable"))}</span></div>
        </div>
      </article>
    </section>`;
  }

  renderStrategies(rt) {
    const strategy = this.energyStrategies(rt);
    const profileRows = strategy.configured.map((row) => {
      // A canonical editable property is a configured value, not a full profile.
      // Only the Energy producer may classify effective policy or a profile.
      const assetId=String(row.asset_id||'');
      const assetName=String(row.asset_display_name||rt.assetDisplayName?.(assetId)||assetId);
      const label=String(row.friendly_name||row.display_name||row.property_key||'Energy setting');
      const value=row.value===null||row.value===undefined?'Not available':String(row.value);
      return `<div class="rhi-data-row rhiVehicleRow"><b>${rt.escape(assetName)} · ${rt.escape(label)}</b><span>${rt.escape(value)}</span></div>`;
    }).join("");
    const effectiveRows = strategy.effective.map((row) => {
      const assetId = String(row.asset_id || "");
      const name = String(row.display_name || row.asset_label || rt.assetDisplayName?.(assetId) || assetId);
      const state = String(row.effective_state || row.configured_state || row.influence_state || row.reason_label || row.policy_id || "Published");
      return `<div class="rhi-data-row rhiVehicleRow">${this.vehicleIdentity(rt,assetId,row)}<span>${rt.escape(state)}</span></div>`;
    }).join("");
    const unavailable = !strategy.configuredAvailable && !strategy.effectiveAvailable
      ? "Energy strategy contracts are unavailable. Mobility does not invent a strategy or infer one from charging behavior."
      : "";
    return `<section class="rhi-context-grid">
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:tune-variant"></ha-icon>${rt.escape((rt?.t?.("strategy.configured_intent",{},"Configured intent") || "Configured intent"))}</div>
        <h3>${rt.escape(rt.t?.("strategy.configured_values",{},"Configured Mobility energy settings") || "Configured Mobility energy settings")}</h3>
        <p>${rt.escape("Backend-published Mobility-scoped Energy settings. Configuration editing and effective strategy selection remain Energy-owned.")}</p>
        ${profileRows ? `<div class="rhi-data-list">${profileRows}</div>` : ""}
        ${unavailable ? `<div class="rhi-context-note">${rt.escape(unavailable)}</div>` : ""}
      </article>
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:shield-check-outline"></ha-icon>${rt.escape((rt?.t?.("strategy.effective",{},"Effective strategy") || "Effective strategy"))}</div>
        <h3>${rt.escape((rt?.t?.("strategy.in_effect",{},"What is in effect") || "What is in effect"))}</h3>
        <p>${rt.escape((rt?.t?.("strategy.effective_desc",{},"Effective policy is filtered to exact Mobility asset ids so vehicle/charger behavior is not confused with unrelated Energy domains.") || "Effective policy is filtered to exact Mobility asset ids so vehicle/charger behavior is not confused with unrelated Energy domains."))}</p>
        ${effectiveRows ? `<div class="rhi-data-list">${effectiveRows}</div>` : `<div class="rhi-context-note">${rt.escape((rt?.t?.("strategy.no_effective",{},"No effective Mobility policy is currently published by Energy.") || "No effective Mobility policy is currently published by Energy."))}</div>`}
      </article>
    </section>`;
  }

  renderInsights(rt) {
    const insights = this.energyInsights(rt);
    // Mobility-owned command execution is useful Insight evidence even when
    // Energy cannot yet attribute kWh/EUR to a canonical vehicle and period.
    const executionRows=(rt.activityRowsFor?.("") || []).filter(row=>String(row.activity_type || "")==="execution");
    const executionHtml=executionRows.slice(0,5).map(row=>{
      const id=String(row.asset_id || ""),value=String(row.result || row.activity_state || "UNKNOWN");
      const observed=String(row.observed_at || "").trim();
      const parsed=observed ? new Date(observed) : null;
      const when=parsed && Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : "Time not published";
      return `<div class="rhi-data-row"><b>${rt.escape(rt.assetDisplayName?.(id) || id)} · ${rt.escape(String(row.operation_key || row.summary || "Command"))}</b><span>${rt.escape(value)} · ${rt.escape(when)}</span></div>`;
    }).join("");
    const rows = insights.rows.map((row) => {
      const energy = this.fmtKwh(row.energyKwh);
      const value = row.attributedEur === null ? "N/A" : `€${Number(row.attributedEur).toFixed(2)}`;
      const quality = row.measurementState || row.trustState || "UNAVAILABLE";
      const id = String(row.assetId || row.asset_id || row.vehicle_asset_id || row.source_asset_id || "");
      return `<article class="rhi-insight-vehicle">
        <div class="rhi-insight-vehicle-head"><div>${this.vehicleIdentity(rt,id,row)}</div><span>${rt.escape(quality)}</span></div>
        <div class="rhi-insight-metrics">
          <div><small>${rt.escape((rt?.t?.("insights.measured_energy",{},"Measured energy") || "Measured energy"))}</small><b>${rt.escape(energy)}</b></div>
          <div><small>${rt.escape((rt?.t?.("insights.attributed_value",{},"Attributed value") || "Attributed value"))}</small><b>${rt.escape(value)}</b></div>
        </div>
      </article>`;
    }).join("");
    const sessionRows=(insights.recentSessions||[]).map(session=>{
      const vehicleName=session.vehicleId
        ? String(rt.assetDisplayName?.(session.vehicleId)||session.vehicleId)
        : String(rt.t?.("insights.unassigned_vehicle",{},"Unassigned vehicle")||"Unassigned vehicle");
      const chargerName=String(rt.assetDisplayName?.(session.chargerId)||session.chargerId);
      const measured=session.energyKwh===null?"—":`${Number(session.energyKwh).toFixed(2)} kWh`;
      const euros=session.costEur===null
        ? String(rt.t?.("insights.session_cost_unavailable",{},"Cost not allocated")||"Cost not allocated")
        : `€${Number(session.costEur).toFixed(2)}`;
      const t=Date.parse(session.finishedAt||session.lastObservedAt||session.startedAt);
      const when=Number.isFinite(t)?new Date(t).toLocaleString():"—";
      return `<div class="rhi-data-row">
        <b>${rt.escape(vehicleName)} · ${rt.escape(chargerName)}</b>
        <span>${rt.escape(String(session.status))} · ${rt.escape(when)} · ${rt.escape(measured)} · ${rt.escape(euros)}</span>
      </div>`;
    }).join("");
    const sessionWindow=insights.sessionHistoryCount===null?""
      : `${Number(insights.sessionHistoryCount)} ${rt.escape(String(rt.t?.("insights.completed_sessions",{},"completed sessions in history")||"completed sessions in history"))}`;
    const gap = (!insights.meteringAvailable && !insights.valueAvailable)
      ? "Energy metering and value contracts are unavailable. Mobility does not estimate vehicle energy or financial value."
      : (!rows ? "Energy is available, but no published metering/value record currently matches a canonical Mobility vehicle id." : "");
    return `<section class="rhi-context-grid insights-grid">
      <article class="rhi-context-card rhi-insights-wide">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:chart-timeline-variant"></ha-icon>${rt.escape((rt?.t?.("insights.measured_mobility",{},"Measured Mobility") || "Measured Mobility"))}</div>
        <h3>${rt.escape((rt?.t?.("insights.vehicle_energy_value",{},"Vehicle energy & value") || "Vehicle energy & value"))}</h3>
        <p>${rt.escape((rt?.t?.("insights.vehicle_energy_desc",{},"Per-vehicle energy and financial attribution come directly from Energy public UX contracts. Mobility only joins them by canonical asset id.") || "Per-vehicle energy and financial attribution come directly from Energy public UX contracts. Mobility only joins them by canonical asset id."))}</p>
        ${rows ? `<div class="rhi-insight-vehicle-list">${rows}</div>` : ""}
        ${gap ? `<div class="rhi-context-note">${rt.escape(gap)}</div>` : ""}
      </article>
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:history"></ha-icon>${rt.escape((rt?.t?.("insights.mobility_evidence",{},"Mobility evidence") || "Mobility evidence"))}</div>
        <h3>${rt.escape((rt?.t?.("insights.execution_history",{},"Execution history") || "Execution history"))}</h3>
        <p>${rt.escape((rt?.t?.("insights.execution_history_desc",{},"Commands, readiness transitions and vehicle/charger execution remain Mobility-owned. Energy measurements complement that history; they do not replace it.") || "Commands, readiness transitions and vehicle/charger execution remain Mobility-owned. Energy measurements complement that history; they do not replace it."))}</p>
        <div class="rhi-data-list">
          <div class="rhi-data-row"><b>${rt.escape((rt?.t?.("insights.metering_contract",{},"Metering contract") || "Metering contract"))}</b><span>${rt.escape(insights.meteringContractVersion || (insights.meteringAvailable ? (rt?.t?.("common.published",{},"Published") || "Published") : (rt?.t?.("common.unavailable",{},"Unavailable") || "Unavailable")))}</span></div>
          <div class="rhi-data-row"><b>${rt.escape((rt?.t?.("insights.value_contract",{},"Value contract") || "Value contract"))}</b><span>${rt.escape(insights.valueContractVersion || (insights.valueAvailable ? (rt?.t?.("common.published",{},"Published") || "Published") : (rt?.t?.("common.unavailable",{},"Unavailable") || "Unavailable")))}</span></div>
          <div class="rhi-data-row"><b>${rt.escape((rt?.t?.("insights.value_state",{},"Value state") || "Value state"))}</b><span>${rt.escape(insights.valueState)}</span></div>
          <h4 class="rhi-insight-events-title">Recent Mobility commands</h4>
          ${executionHtml || `<div class="rhi-context-note">No command execution results published yet. Current asset status is available under Activity.</div>`}
          <button class="rhi-insight-open-activity" data-nav="${hbMobilityPath("/log")}">View Activity <ha-icon icon="mdi:chevron-right"></ha-icon></button>
        </div>
      </article>
      <article class="rhi-context-card rhi-insights-wide">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:ev-station"></ha-icon>${rt.escape(String(rt.t?.("insights.charging_sessions",{},"Charging sessions")||"Charging sessions"))}</div>
        <h3>${rt.escape(String(rt.t?.("insights.charging_history",{},"Recent charging history")||"Recent charging history"))}</h3>
        <p>${rt.escape(String(rt.t?.("insights.charging_history_desc",{},"Energy measures charging sessions; only physically proven vehicle identities are attributed. Costs stay unknown unless Energy allocates them.")||"Energy measures charging sessions; only physically proven vehicle identities are attributed. Costs stay unknown unless Energy allocates them."))}</p>
        ${sessionRows ? `<div class="rhi-data-list">${sessionRows}</div>` :
          `<div class="rhi-context-note">${rt.escape(String(rt.t?.("insights.no_charging_sessions",{},"No qualified charging sessions published yet.")||"No qualified charging sessions published yet."))}</div>`}
        ${sessionWindow ? `<small>${sessionWindow}</small>` : ""}
        ${!insights.sessionsAvailable ? `<div class="rhi-context-note">${rt.escape(String(rt.t?.("insights.session_source_unavailable",{},"Energy session history is unavailable or ambiguous.")||"Energy session history is unavailable or ambiguous."))}</div>` : ""}
      </article>
    </section>`;
  }

  renderLog(rt) {
    const published=rt.activityRowsFor ? rt.activityRowsFor("") : [];
    const kind=row=>String(row.activity_type||"").toLowerCase()==="execution"?"execution":String(row.activity_type||"").toLowerCase()==="charging"?"charger":"vehicle";
    const assetId=row=>String(row.asset_id||row.subject_asset_id||row.related_asset_id||"");
    const instant=row=>{
      if(kind(row)!=="execution")return null;
      const raw=String(row.observed_at||row.occurred_at||row.created_at||row.timestamp||"");
      if(!raw)return null;
      const t=Date.parse(raw);return Number.isFinite(t)?t:null;
    };
    const rows=published.filter(row=>this._activityType==="all"||kind(row)===this._activityType).sort((a,b)=>{
      // Grouping is a real contiguous cluster, not repeated headings whenever
      // differently timed asset types happen to alternate in the source.
      if(this._activityGroup==="type"){
        const priority={execution:0,vehicle:1,charger:2};
        const order=(priority[kind(a)]??9)-(priority[kind(b)]??9);
        if(order)return order;
      }
      if(this._activityGroup==="asset"){
        const compare=String(rt.assetDisplayName?.(assetId(a))||assetId(a)).localeCompare(String(rt.assetDisplayName?.(assetId(b))||assetId(b)));
        if(compare)return compare;
      }
      if(this._activitySort==="asset")return String(rt.assetDisplayName?.(assetId(a))||assetId(a)).localeCompare(String(rt.assetDisplayName?.(assetId(b))||assetId(b)));
      const ta=instant(a),tb=instant(b);
      return ta===null&&tb===null?0:ta===null?1:tb===null?-1:(this._activitySort==="oldest"?ta-tb:tb-ta);
    });
    const activityCount = Number(rt.mobilityActivityV2?.()?.activity_count ?? published.length) || published.length;
    const fmtTime = (row) => {
      const raw = row.observed_at || row.occurred_at || row.created_at || row.timestamp || row.started_at || "";
      if (!raw) return "";
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleString();
    };
    const statusOf = (row) => String(
      row.status || row.activity_state || row.result || row.result_code || row.execution_state || "Published"
    );
    const titleOf = (row) => String(
      row.message || row.command_label || row.summary || row.operation_key || row.activity_type || row.command_key || row.family || "Mobility activity"
    );
    const reasonOf = (row) => String(
      row.reason || row.blocked_reason || row.execution_reason || row.detail || row.error || ""
    );
    const assetOf = (row) => {
      const id = String(row.asset_id || row.subject_asset_id || row.related_asset_id || "");
      return id ? String(rt.assetDisplayName?.(id) || id) : "";
    };
    const mediaFor=row=>{
      const id=assetId(row),charger=rt.chargerById?.(id),vehicle=rt.vehicleById?.(id);
      if(charger)return {url:new HomeBrainChargerAdapter(rt,id,{registry_entry:charger}).chargerImageFromId(),icon:"mdi:ev-station"};
      if(vehicle)return {url:rt.visualImageUrl?.(vehicle,"vehicle","image","vehicle_fallback")||"",icon:"mdi:car-electric"};
      return {url:"",icon:kind(row)==="charger"?"mdi:ev-station":"mdi:history"};
    };
    const groupName=row=>this._activityGroup==="type"?({vehicle:"Vehicles",charger:"Chargers",execution:"Commands"}[kind(row)]||"Activity"):
      this._activityGroup==="asset"?(String(rt.assetDisplayName?.(assetId(row))||assetId(row)||"Unknown asset")):"";
    let previousGroup="";
    const entries = rows.map((row) => {
      const status = statusOf(row);
      const reason = reasonOf(row);
      const meta = [kind(row)==="execution"?(fmtTime(row)||"Time not published"):"Current status · no event timestamp",assetOf(row),status].filter(Boolean).join(" · ");
      const media=mediaFor(row),group=groupName(row);
      const groupHtml=group&&group!==previousGroup?`<h4 class="rhi-log-group">${rt.escape(group)}</h4>`:"";
      previousGroup=group;
      return `${groupHtml}<article class="rhi-log-row">
        <div class="rhi-log-icon">${media.url ? `<img src="${rt.escape(rt.cache?.(media.url)||media.url)}" alt="${rt.escape(assetOf(row))}" loading="lazy" onerror="this.style.display='none'">` : `<ha-icon icon="${media.icon}"></ha-icon>`}</div>
        <div class="rhi-log-copy"><b>${rt.escape(titleOf(row))}</b><small>${rt.escape(meta)}</small>${reason ? `<span>${rt.escape(reason)}</span>` : ""}</div>
      </article>`;
    }).join("");
    const exceptions = published.filter((row) => {
      const state = statusOf(row).toLowerCase();
      return ["failed","rejected","blocked","error","denied"].some((token)=>state.includes(token));
    });
    const gap = activityCount > 0 && !published.length
      ? `<div class="rhi-context-note">Activity contract reports ${rt.escape(String(activityCount))} recent items but publishes no activity rows.</div>`
      : "";
    return `<section class="rhi-context-grid log-grid">
      <article class="rhi-context-card rhi-log-wide">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:text-box-search-outline"></ha-icon>${rt.escape((rt?.t?.("activity.mobility_log",{},"Mobility log") || "Mobility log"))}</div>
        <h3>${rt.escape((rt?.t?.("activity.what_happened",{},"What happened?") || "What happened?"))}</h3>
        <p>${rt.escape((rt?.t?.("activity.desc",{},"Recent vehicle, charger and command activity is shown with the asset, outcome and backend reason. Technical contract names stay out of the primary reading path.") || "Recent vehicle, charger and command activity is shown with the asset, outcome and backend reason. Technical contract names stay out of the primary reading path."))}</p>
        <div class="rhi-log-controls" aria-label="Filter, sort and group Activity">
          <label>Show <select data-activity-type>${[["all","All"],["vehicle","Vehicles"],["charger","Chargers"],["execution","Commands"]].map(([k,v])=>`<option value="${k}" ${this._activityType===k?"selected":""}>${v}</option>`).join("")}</select></label>
          <label>Sort <select data-activity-sort>${[["newest","Newest first"],["oldest","Oldest first"],["asset","Asset name"]].map(([k,v])=>`<option value="${k}" ${this._activitySort===k?"selected":""}>${v}</option>`).join("")}</select></label>
          <label>Group <select data-activity-group>${[["type","Type"],["asset","Asset"],["none","None"]].map(([k,v])=>`<option value="${k}" ${this._activityGroup===k?"selected":""}>${v}</option>`).join("")}</select></label>
        </div>
        ${entries ? `<div class="rhi-log-list">${entries}</div>` : `<div class="rhi-context-note">${rt.escape((rt?.t?.("activity.no_rows",{},"No activity rows are currently published.") || "No activity rows are currently published."))}</div>`}
        ${gap}
      </article>
      <article class="rhi-context-card">
        <div class="rhi-context-card-kicker"><ha-icon icon="mdi:alert-outline"></ha-icon>${rt.escape((rt?.t?.("activity.exceptions",{},"Exceptions") || "Exceptions"))} · ${rt.escape(String(exceptions.length))}</div>
        <h3>${rt.escape((rt?.t?.("activity.what_attention",{},"What needs attention?") || "What needs attention?"))}</h3>
        <p>${exceptions.length ? `${rt.escape(String(exceptions.length))} failed or rejected item${exceptions.length === 1 ? "" : "s"}. The backend reason is shown below.` : (rt?.t?.("activity.no_failures",{},"No failed or rejected activity is currently published.") || "No failed or rejected activity is currently published.")}</p>
        ${exceptions.slice(0,8).map((row)=>`<div class="rhi-data-row"><b>${rt.escape(titleOf(row))}</b><span>${rt.escape(reasonOf(row) || statusOf(row))}</span></div>`).join("")}
      </article>
    </section>`;
  }

  renderContextCards(rt, data) {
    return `<section class="rhi-context-grid">
      ${data.cards.map((card) => `<article class="rhi-context-card"><div class="rhi-context-card-kicker"><ha-icon icon="${card.icon}"></ha-icon>${rt.escape(card.kicker)}</div><h3>${rt.escape(card.title)}</h3><p>${rt.escape(card.text)}</p></article>`).join("")}
    </section>`;
  }

  renderSupportFacts(rt, view) {
    const plan = view === "planning" ? this.energyPlanning(rt) : null;
    const chargingPlan = plan ? (plan.available ? (plan.today.state || "Published") : "Unavailable") : rt.supervisorOutcome("mobility", "opportunity", "Supervised");
    return `<section class="rhi-fact-grid support-facts">
      <div class="rhi-fact"><ha-icon icon="mdi:calendar-clock"></ha-icon><div><small>Charging plan</small><b>${rt.escape(chargingPlan)}</b><span>${view === "planning" ? "Energy backend" : "Mobility context"}</span></div></div>
      <div class="rhi-fact"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div><small>System trust</small><b>${rt.escape(rt.supervisorOutcome("mobility", "trust", "Unknown"))}</b><span>Mobility runtime</span></div></div>
      <div class="rhi-fact"><ha-icon icon="mdi:history"></ha-icon><div><small>Recent activity</small><b>Read-only</b><span>No frontend inference</span></div></div>
      <div class="rhi-fact"><ha-icon icon="mdi:database-check-outline"></ha-icon><div><small>Data policy</small><b>Contract-backed</b><span>Fail closed</span></div></div>
    </section>`;
  }

  styles() {
    return `:host{display:block;width:100%;box-sizing:border-box;}ha-card{background:transparent;box-shadow:none;border:none}
      ${hbMobilityPresentationStyles()}
      ${hbMobilitySharedShellStyles()}
      .page{position:relative}
      .status-strip.dashboard-status-strip{margin:8px 0 10px}
      .support-facts{margin-top:8px}
      .insights-grid{grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr)}
      .log-grid{grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr)}
    .rhi-insight-events-title{font-size:12px;color:#29466f;margin:14px 0 8px}.rhi-insight-open-activity{display:inline-flex;align-items:center;gap:5px;border:1px solid #d6e2f0;background:#f7faff;color:#075fd8;border-radius:9px;font-size:12px;font-weight:600;padding:8px 10px;margin-top:10px;cursor:pointer}
      .rhi-log-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:4px 0}.rhi-log-controls label{display:flex;align-items:center;gap:6px;font-size:12px;color:#536582;font-weight:600}.rhi-log-controls select{height:36px;border:1px solid #dbe5f0;border-radius:9px;background:#fff;color:#132744;font:inherit;padding:5px 8px}.rhi-log-group{margin:12px 0 2px;font-size:12px;font-weight:700;color:#29466f}.rhi-log-icon img{max-width:36px;max-height:36px;object-fit:contain}.rhi-log-copy b{font-size:12px}.rhi-log-copy small{font-size:11px}
    .rhi-log-list{display:grid;gap:7px;margin-top:10px}.rhi-log-row{display:grid;grid-template-columns:30px minmax(0,1fr);gap:9px;align-items:start;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);padding:9px 10px;background:#fff}.rhi-log-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#F1F6FF;color:#1467F5}.rhi-log-icon ha-icon{--mdc-icon-size:17px}.rhi-log-copy{min-width:0}.rhi-log-copy b,.rhi-log-copy small,.rhi-log-copy span{display:block}.rhi-log-copy b{font-size:13px;overflow-wrap:anywhere}.rhi-log-copy small{margin-top:2px;color:var(--rhi-color-muted);font-size:10px}.rhi-log-copy span{margin-top:4px;color:var(--rhi-color-muted);font-size:11px;overflow-wrap:anywhere}
      .rhiVehicleIdentity{display:flex;align-items:center;gap:10px;min-width:0}.rhiVehicleIdentity>span:last-child{min-width:0}.rhiVehicleIdentity b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhiVehicleIdentity small{display:block;margin-top:2px;font-size:9px;color:#718096}.rhiVehicleThumb{width:64px;height:42px;display:flex;align-items:center;justify-content:center;flex:0 0 64px;border-radius:10px;background:#f5f8fc;border:1px solid #e5ebf4;overflow:hidden}.rhiVehicleThumb img{display:block;max-width:60px;max-height:38px;object-fit:contain}.rhiVehicleThumbFallback ha-icon{--mdc-icon-size:22px;color:#5f6d84}.rhiVehicleRow{align-items:center;min-height:56px}.rhiVehicleRow>span:last-child{justify-self:end}.rhi-insight-vehicle-head .rhiVehicleIdentity{min-width:0}
      .rhi-insight-vehicle-list{display:grid;gap:7px;margin-top:10px}
      .rhi-insight-vehicle{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #edf1f6;border-radius:var(--rhi-radius-md);background:var(--rhi-soft);padding:10px 12px}
      .rhi-insight-vehicle-head{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:8px}.rhi-insight-vehicle-head small{font-size:8.5px;letter-spacing:.09em;color:#718096}.rhi-insight-vehicle-head h3{margin:1px 0 0;font-size:13px}.rhi-insight-vehicle-head>span{font-size:9px;color:#64748b}
      .rhi-insight-metrics{display:grid;grid-template-columns:repeat(2,minmax(95px,1fr));gap:6px}.rhi-insight-metrics>div{padding:6px 8px;border-left:1px solid #e4eaf2}.rhi-insight-metrics small{display:block;font-size:8.5px;color:#718096}.rhi-insight-metrics b{display:block;margin-top:2px;font-size:12px;color:var(--rhi-ink)}
      @media(max-width:900px){.insights-grid{grid-template-columns:1fr}.rhi-insight-vehicle{grid-template-columns:1fr}.rhi-insight-metrics>div:first-child{border-left:0}}
      @media(max-width:520px){.rhi-insight-metrics{grid-template-columns:1fr 1fr}.rhi-insight-vehicle{padding:9px 10px}}
      @media(max-width:760px){.status-strip.dashboard-status-strip{grid-template-columns:repeat(5,minmax(150px,1fr));overflow-x:auto}.status-strip.dashboard-status-strip .metric{min-width:150px}}
    `;
  }
}
if (!customElements.get("homebrain-mobility-placeholder-card")) {
  customElements.define("homebrain-mobility-placeholder-card", HomeBrainMobilityPlaceholderCard);
}
window.customCards.push({
  type: "homebrain-mobility-placeholder-card",
  name: "Home Brain Mobility Intelligence and Insights",
  description: "Contract-backed Mobility Intelligence and Insights projections."
});

class HomeBrainMobilityAssetDetailCard extends HTMLElement {
  constructor() {
    super();
    this.config = { dashboard_path: "/mobility-supervisor/dashboard" };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = "";
  }

  setConfig(config = {}) {
    this.config = { dashboard_path: "/mobility-supervisor/dashboard", ...(config || {}) };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = "";
  }

  selectedAssetId() {
    // HA keeps Lovelace view navigation in the browser URL. The generic detail card reads
    // ?asset=<asset_id>. Config asset_id remains supported for test cards or fixed mounts.
    let url;
    try { url = new URL(window.location.href); } catch (e) { url = { searchParams: new URLSearchParams(), hash: "" }; }
    let hashAsset = "";
    try {
      const hash = String(url.hash || "").replace(/^#/, "");
      if (hash.startsWith("asset=")) hashAsset = decodeURIComponent(hash.slice(6));
      else hashAsset = hash;
    } catch (e) {}
    return this.config.asset_id || url.searchParams.get("asset") || hashAsset || sessionStorage.getItem("homebrain_mobility_last_asset") || "";
  }

  set hass(hass) {
    try {
    this._hass = hass;
    const rt = new HomeBrainAssetRuntime(hass, this.config);
    let assetId = this.selectedAssetId();
    let entry = assetId ? rt.registryEntry(assetId) : null;
    if (!entry && this.config.default_asset_type) {
      const wanted = String(this.config.default_asset_type).toLowerCase();
      entry = rt.mobilityRegistry().find((a)=> wanted === "vehicle" ? rt.isVehicleAsset(a) : wanted === "charger" ? rt.isChargerAsset(a) : false) || null;
      assetId = entry?.asset_id || assetId;
    }
    if (!entry && !assetId) {
      entry = rt.mobilityRegistry().find((a)=>rt.isVehicleAsset(a)) || rt.mobilityRegistry().find((a)=>rt.isChargerAsset(a)) || null;
      assetId = entry?.asset_id || "";
    }

    if (!entry) {
      this.shadowRoot.replaceChildren();
      const fragment = document.createElement("template");
      fragment.innerHTML = `
        <ha-card>
          <div class="missing">
            <h2>${rt.escape((rt?.t?.("asset.not_registered",{},"Asset not registered") || "Asset not registered"))}</h2>
            <p>${rt.escape((rt?.t?.("asset.not_found",{},"No registered Mobility asset was found for") || "No registered Mobility asset was found for"))} <b>${rt.escape(assetId || (rt?.t?.("asset.missing_id",{},"missing asset id") || "missing asset id"))}</b>.</p>
            <button data-nav="/mobility-supervisor/dashboard">← ${rt.escape((rt?.t?.("asset.back_dashboard",{},"Back to Dashboard") || "Back to Dashboard"))}</button>
          </div>
          <style>
            ha-card{background:transparent;box-shadow:none;border:none}
            .missing{user-select:text;-webkit-user-select:text;margin:24px auto;padding:28px;width:min(100%,900px);background:#fff;border:1px solid #E5ECF6;border-radius:22px;box-shadow:0 16px 40px rgba(15,35,80,.07)}
            h2{margin:0 0 8px;color:#06142D}
            p{color:#66728B;font-weight:400}
            button{border:1px solid #DDE6F2;background:#fff;border-radius:12px;font-weight:500;padding:10px 14px;cursor:pointer;color:#06142D}
          

/* R22.10.3_CHARGE_SPEED_LAYOUT_ENFORCEMENT
   Vehicle card bottom row is source-driven and visible: metrics stay left in the
   existing order, charger selector + mode + charge speed render as real cells.
   The charge speed cell is not allowed to disappear due to nested grid overflow. */
.vehicle-control-row.mock-row{
  display:grid;
  grid-template-columns:minmax(176px,.58fr) minmax(260px,1.22fr) minmax(118px,.42fr) minmax(116px,.40fr);
  gap:6px;
  align-items:stretch;
  padding:0 12px 8px;
  min-width:0;
  overflow:visible;
}
.vehicle-control-row.mock-row>.vehicle-metrics-strip.mock-metrics{
  grid-column:1;
  min-width:0;
}
.vehicle-control-row.mock-row>.charge-mini-strip.mock-controls{
  display:contents;
}
.vehicle-control-row.mock-row .charger-select{
  grid-column:2;
  min-width:0;
  width:100%;
  flex:none;
}
.vehicle-control-row.mock-row .mode-select{
  grid-column:3;
  min-width:0;
  width:100%;
  flex:none;
}
.vehicle-control-row.mock-row .mini-current-stepper.compact-current{
  grid-column:4;
  display:grid;
  grid-template-columns:minmax(44px,1fr) 24px 24px;
  gap:5px;
  align-items:center;
  justify-items:center;
  min-width:0;
  width:100%;
  height:38px;
  min-height:38px;
  padding:0 7px;
  overflow:hidden;
  flex:none;
  background:#fff;
  border:1px solid var(--hb-line);
  border-radius:12px;
  box-sizing:border-box;
}
.vehicle-control-row.mock-row .mini-current-stepper.compact-current.readonly{
  grid-template-columns:minmax(56px,1fr);
}
.vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy{
  min-width:0;
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  justify-content:center;
  overflow:hidden;
  line-height:1.05;
}
.vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy small{
  display:block;
  font-size:8px;
  font-weight:650;
  color:#64708A;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy strong{
  display:block;
  font-size:13px;
  font-weight:650;
  color:#12213A;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.vehicle-control-row.mock-row .mini-current-stepper.compact-current .round-step{
  width:24px;
  min-width:24px;
  height:24px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  font-size:16px;
  line-height:1;
  background:#fff;
  color:#1467F5;
  border:1px solid var(--hb-line);
  box-shadow:none;
}
.vehicle-actions.clean-actions{
  display:grid;
  grid-template-columns:minmax(140px,1.05fr) minmax(120px,.95fr) minmax(110px,.85fr) minmax(12px,1fr) 42px 42px;
  gap:8px;
  align-items:center;
  padding:8px 12px 12px;
}
.vehicle-actions.clean-actions .presence-toggle.icon-only,
.vehicle-actions.clean-actions .details-action.icon-only{
  justify-self:end;
  width:42px;
  min-width:42px;
  max-width:42px;
  background:#fff;
  color:#1467F5;
  border-color:var(--hb-line);
}
.vehicle-actions.clean-actions .presence-toggle.icon-only ha-icon,
.vehicle-actions.clean-actions .details-action.icon-only ha-icon{
  color:#1467F5;
}
@media(max-width:1380px){
  .vehicle-control-row.mock-row{grid-template-columns:minmax(176px,.60fr) minmax(240px,1.20fr) minmax(112px,.42fr) minmax(112px,.42fr);}
}
@media(max-width:880px){
  .vehicle-control-row.mock-row{grid-template-columns:1fr 1fr;overflow:visible;}
  .vehicle-control-row.mock-row>.vehicle-metrics-strip.mock-metrics{grid-column:1 / -1;}
  .vehicle-control-row.mock-row .charger-select{grid-column:1 / -1;}
  .vehicle-control-row.mock-row .mode-select{grid-column:1;}
  .vehicle-control-row.mock-row .mini-current-stepper.compact-current{grid-column:2;}
}



/* R22.10.3 shared horizontal outcome/status header */
.status-strip.dashboard-status-strip,.status-strip.ops-status-strip{
  display:grid;grid-template-columns:repeat(5,minmax(0,1fr));
  border:1px solid rgba(14,35,72,.11);border-radius:17px;
  background:rgba(255,255,255,.96);box-shadow:0 16px 32px rgba(15,35,80,.08);
  overflow:hidden;max-width:none;width:100%;margin:8px 0 10px;
}
.status-strip.dashboard-status-strip .metric,.status-strip.ops-status-strip .metric{
  display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:center;
  padding:14px 16px;border-right:1px solid #E6ECF5;min-width:0;background:transparent;
}
.status-strip.dashboard-status-strip .metric:last-child,.status-strip.ops-status-strip .metric:last-child{border-right:0;}
.status-strip.dashboard-status-strip .metric ha-icon,.status-strip.ops-status-strip .metric ha-icon{--mdc-icon-size:23px;color:#1467F5;}
.status-strip.dashboard-status-strip .metric.tone-green ha-icon,.status-strip.ops-status-strip .metric.tone-green ha-icon{color:#18A957;}
.status-strip.dashboard-status-strip .metric.tone-orange ha-icon,.status-strip.ops-status-strip .metric.tone-orange ha-icon{color:#F59E0B;}
.status-strip.dashboard-status-strip .metric span,.status-strip.ops-status-strip .metric span{display:block;font-size:11px;font-weight:600;color:#66728B;line-height:1.1;}
.status-strip.dashboard-status-strip .metric b,.status-strip.ops-status-strip .metric b{display:block;font-size:16px;font-weight:650;color:#071327;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
@media(max-width:760px){.status-strip.dashboard-status-strip,.status-strip.ops-status-strip{grid-template-columns:1fr;max-width:100%}.status-strip.dashboard-status-strip .metric,.status-strip.ops-status-strip .metric{border-right:0;border-bottom:1px solid #E6ECF5}.status-strip.dashboard-status-strip .metric:last-child,.status-strip.ops-status-strip .metric:last-child{border-bottom:0}}
${hbMobilitySharedShellStyles()}

    /* R22.10.3 charger capability guard and outcome renderer alignment */
    .domain-tabs-wrap{margin:6px 0 8px}
    .status-strip.dashboard-status-strip,.status-strip.ops-status-strip,.outcome-header{width:100%;max-width:none;margin:8px 0 10px}
    .section-title{margin-top:8px;margin-bottom:8px}
    /* R22.11.8 dynamic release footer. Backend version is runtime data from the Mobility release contract. */
    .hi-version-block{display:none}
    .hi-release-footer{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%;box-sizing:border-box;margin:8px 0 0;padding:8px 14px;border-top:1px solid rgba(14,35,72,.10);background:rgba(255,255,255,.92);color:#53627A;font-size:11px;font-weight:500;line-height:1.2;white-space:normal;overflow:hidden}
    .hi-release-footer span+span::before{content:"•";margin-right:8px;color:#8A96AA}
    @media(max-width:760px){.hi-release-footer{font-size:10px;padding:8px 10px}}
    .page{gap:10px}

    /* R22.10.3 final dashboard enforcement: command framework + charge speed alignment */
    .vehicle-control-row.mock-row>.charge-mini-strip.mock-controls{
      display:grid;
      grid-template-columns:minmax(210px,1.28fr) minmax(124px,.74fr) minmax(136px,.78fr);
      gap:7px;
      align-items:stretch;
      height:40px;
      overflow:visible;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current{
      grid-column:auto;
      height:40px;
      min-height:40px;
      flex:unset;
      display:grid;
      grid-template-columns:minmax(52px,1fr) 28px 28px;
      gap:5px;
      align-items:center;
      padding:0 7px;
      border-radius:12px;
      min-width:0;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current.readonly{
      grid-template-columns:minmax(52px,1fr);
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy{
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:flex-start;
      min-width:0;
      line-height:1.05;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy small{
      font-size:8px;
      line-height:1;
      color:#6A768D;
      margin:0 0 2px;
      white-space:nowrap;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy strong{
      font-size:13px;
      line-height:1;
      font-weight:600;
      color:#06142D;
      white-space:nowrap;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .round-step{
      width:28px;
      height:28px;
      min-width:28px;
      border-radius:11px;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .vehicle-actions.clean-actions{
      grid-template-columns:minmax(132px,1.05fr) minmax(124px,.95fr) minmax(106px,.82fr) minmax(0,1fr) 38px 38px;
      align-items:center;
    }
</style>
        ${hbMobilityReleaseFooter(rt)}
        </ha-card>`;
      this.shadowRoot.append(fragment.content.cloneNode(true));
      this.shadowRoot.querySelectorAll("button[data-nav]").forEach((btn)=>btn.addEventListener("click",()=>rt.navigate(btn.getAttribute("data-nav"))));

      return;
    }

    const factory = new HomeBrainAssetFactory(rt);
    const adapter = factory.adapterFor(entry, this.config);
    if (!adapter) {
      this.shadowRoot.replaceChildren();
      const fragment = document.createElement("template");
      fragment.innerHTML = `<ha-card><div style="padding:24px">No adapter available for ${rt.escape(entry.asset_type)}</div></ha-card>`;
      this.shadowRoot.append(fragment.content.cloneNode(true));
      return;
    }

    const activeDetailControl = this.shadowRoot?.activeElement;
    if (activeDetailControl?.closest?.(".detail-vehicle-picker,.detail-charger-picker")) return;

    const sig = JSON.stringify({
      entry,
      assetId,
      lifecycle: rt.lifecycleStatus ? rt.lifecycleStatus(entry) : entry.lifecycle_state,
      properties: rt.propertyRows(assetId).map((p)=>[p.asset_id, p.property_key, p.value, p.health, p.write_supported, p.write_target_entity]),
      commands: rt.commandRegistry(assetId).map((c)=>[c.asset_id, c.command_id, c.command_key, c.frontend_allowed, c.execution_allowed, c.execution_status || ""]),
      intelligence: rt.intelligenceRowsFor ? rt.intelligenceRowsFor(assetId).map((r)=>[r.asset_id, r.cluster_id || r.cluster || r.key, r.summary || r.message || r.value, r.severity || ""]) : []
    });
    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      const model = adapter.build();
      model.backPath = this.config.dashboard_path || "/mobility-supervisor/dashboard";
      model.backLabel = "← Back to Dashboard";
      new HomeBrainAssetShell(this.shadowRoot, rt).render(model);
    }
  
    } catch (err) {
      console.error("HomeBrain Mobility asset detail render failed", err);
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      const msg = String((err && (err.stack || err.message)) || err || "Unknown detail render error").replace(/[&<>]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]));
      this.shadowRoot.replaceChildren();
      const fragment = document.createElement("template");
      fragment.innerHTML = `<ha-card><div style="margin:24px auto;width:min(100%,1100px);padding:28px;border:1px solid #F3B7B7;border-radius:22px;background:#FFF7F7;color:#061226;box-shadow:0 18px 48px rgba(80,15,15,.08)"><h2>Asset detail temporarily unavailable</h2><p>The selected Mobility asset could not render safely.</p><pre style="white-space:pre-wrap;font-size:12px">${msg}</pre><button data-back style="border:1px solid #DDE6F2;background:#fff;border-radius:12px;padding:10px 14px;font-weight:600">← Back to Dashboard</button></div></ha-card>`;
      this.shadowRoot.append(fragment.content.cloneNode(true));
      this.shadowRoot.querySelector('[data-back]')?.addEventListener('click', () => { try { history.pushState(null, '', (this.config && this.config.dashboard_path) || '/mobility-supervisor/dashboard'); window.dispatchEvent(new Event('location-changed')); } catch(e) {} });
    }
  }

  getCardSize() { return 12; }
}

if (!customElements.get("homebrain-mobility-asset-detail-card")) {
  customElements.define("homebrain-mobility-asset-detail-card", HomeBrainMobilityAssetDetailCard);
}
window.customCards.push({
  type: "homebrain-mobility-asset-detail-card",
  name: "Home Brain Mobility Generic Asset Detail Card",
  description: "R21.6 generic registry-driven asset detail card."
});

console.info(`Home Intelligence Mobility UX bundle loaded ${UX_VERSION}; backend version is read from the Mobility release contract at runtime.`);
