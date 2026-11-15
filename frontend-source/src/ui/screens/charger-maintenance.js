// 80-charger-maintenance-card.js
// Charger overview/maintenance custom card.

class HomeBrainMobilityChargerMaintenanceCard extends HTMLElement {
  setConfig(config) {
    this.config = { dashboard_path: hbMobilityPath("/dashboard"), ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._commandFeedback = this._commandFeedback || new Map();
    this._openPanels = this._openPanels || new Set();
    this._limitDrafts = this._limitDrafts || new Map();
    this._chargerPickerAsset = this._chargerPickerAsset || "";
    this._chargerPickerDraft = this._chargerPickerDraft || new Map();
    this._chargerPendingAppearance = this._chargerPendingAppearance || new Map();
    this._chargerAppearanceError = this._chargerAppearanceError || new Map();
    this._lastSignature = this._lastSignature || "";
    this._lastRevisionSignature = this._lastRevisionSignature || "";
    this._lastRenderAt = this._lastRenderAt || 0;
  }

  assetId(charger) { return charger?.asset_id || ""; }
  chargerId(charger) { return String(this.assetId(charger)).replace(/^charger_/, ""); }

  pendingChargerAppearance(rt, asset) {
    const assetId = this.assetId(asset);
    const pending = this._chargerPendingAppearance.get(assetId) || null;
    if (!pending) return null;
    const projection = new HomeBrainChargerAdapter(rt, this.chargerId(asset), { ...this.config, registry_entry:asset }).productProjection();
    const canonical = String(projection?.identity?.image_key || "").trim();
    if (canonical && canonical === pending.key) {
      this._chargerPendingAppearance.delete(assetId);
      this._chargerAppearanceError.delete(assetId);
      return null;
    }
    return pending;
  }

  failChargerAppearance(assetId, message = "Appearance update was not confirmed by Mobility.") {
    this._chargerPendingAppearance.delete(assetId);
    this._chargerAppearanceError.set(assetId, message);
    this._forceRender = true;
    this._lastSignature = "";
    if (this._hass) this.hass = this._hass;
  }

  chargerRuntimeReady(rt, charger) {
    const model = new HomeBrainChargerAdapter(rt, this.chargerId(charger), { ...this.config, registry_entry:charger }).build();
    return model?.projection?.facts?.operating?.resolved === true;
  }


  chargerImageFromId(id) {
    const rt = this._hass ? new HomeBrainAssetRuntime(this._hass, this.config) : null;
    const assetId = String(id || "").startsWith("charger_") ? String(id) : `charger_${id}`;
    const asset = rt ? (rt.chargerById(assetId) || rt.assetById(assetId) || { asset_id: assetId }) : { asset_id: assetId };
    if (rt) {
      const pending = this.pendingChargerAppearance(rt, asset);
      if (pending?.image) return pending.image;
      return new HomeBrainChargerAdapter(rt, this.chargerId(asset), { ...this.config, registry_entry:asset }).chargerImageFromId();
    }
    return rhiMobilityAssetUrl("chargers/charger_fallback.png");
  }


  renderChargerHero(rt, id, name, status) {
    const img = rt.cache(this.chargerImageFromId(id));
    const tone = this.statusTone(status);
    return `<div class="charger-visual ${tone}">
      <img src="${rt.escape(img)}" alt="${rt.escape(name)}" loading="eager" decoding="sync"
           onerror="this.onerror=null;this.classList.add('failed');this.closest('.charger-visual')?.classList.add('image-missing');" />
      <div class="charger-visual-fallback"><ha-icon icon="${id === 'utility_plug' ? 'mdi:power-socket-eu' : 'mdi:ev-station'}"></ha-icon></div>
    </div>`;
  }

  chargerVisualSelection(rt, charger, draft = {}) {
    return new HomeBrainChargerVisualPicker(rt).selection(charger, draft);
  }

  renderChargerPicker(rt, charger) {
    const assetId = this.assetId(charger);
    const draft = this._chargerPickerDraft.get(assetId) || {};
    return new HomeBrainChargerVisualPicker(rt).render(charger, { draft, showClose:true, context:"management" });
  }

  statusTone(status) {
    const s = String(status || "").toLowerCase();
    if (["charging", "running", "active", "connected", "available", "ready", "healthy", "trusted"].some((w) => s.includes(w))) return "ok";
    if (["fault", "error", "failed", "blocked", "unavailable", "offline"].some((w) => s.includes(w))) return "bad";
    if (["waiting", "preparing", "suspended", "paused", "unknown", "contract gap", "starting", "initializing"].some((w) => s.includes(w))) return "warn";
    if (["idle", "stopped", "disconnected"].some((w) => s.includes(w))) return "muted";
    return "muted";
  }

  commandIcon(command) {
    const id = String(command.command_id || "").toLowerCase();
    if (id.includes("restart") || id.includes("reset")) return "mdi:restart";
    if (id.includes("identify") || id.includes("locate")) return "mdi:crosshairs-gps";
    if (id.includes("unlock")) return "mdi:lock-open-outline";
    if (id.includes("lock")) return "mdi:lock-outline";
    if (id.includes("enable") || id.includes("resume") || id.includes("start")) return "mdi:play";
    if (id.includes("disable") || id.includes("pause") || id.includes("stop")) return "mdi:stop";
    if (id.includes("current") || id.includes("limit")) return "mdi:current-ac";
    if (id.includes("diagnostic")) return "mdi:stethoscope";
    return "mdi:gesture-tap-button";
  }

  commandState(rt, command) {
    // R22.11.24: charger overview must use the same command-state resolver as
    // charger detail. Do not locally disable bound R41.9 commands because power is
    // 0, session is Completed/SuspendedEV, or legacy intent_entity is absent.
    return rt.commandState ? rt.commandState(command) : { disabled: !command, busy: false, failed: false, status: "", reason: "" };
  }


  groupedCommands(rt, assetId) {
    const groups = { primary: [], secondary: [], diagnostic: [], maintenance: [], advanced: [], destructive: [] };
    for (const command of rt.commandRegistry(assetId)) {
      if (command.frontend_allowed === false) continue;
      const category = groups[command.category] ? command.category : "secondary";
      groups[category].push(command);
    }
    return groups;
  }

  field(rt, label, value, icon = "mdi:information-outline") {
    return `<div class="field mobility-fact"><ha-icon icon="${icon}"></ha-icon><span>${rt.escape(label)}</span><b>${rt.escape(value || "—")}</b></div>`;
  }

  detailField(rt, label, value) {
    return `<div class="detail-field"><span>${rt.escape(label)}</span><b>${rt.escape(value || "—")}</b></div>`;
  }

  renderCommand(rt, command, compact = false) {
    const state = this.commandState(rt, command);
    const tone = state.failed ? "failed" : state.busy ? "busy" : "";
    const reason = state.reason || "";
    const enums = command?.enum_options || {};
    const enumName = (command?.required_parameters || []).find((name) => Array.isArray(enums[name]) && enums[name].length) || "";
    if (command?.interaction_mode === "form" && enumName) {
      return `<label class="cmd enum-command ${tone} ${compact ? "compact" : ""} ${state.disabled ? "is-disabled" : ""}" title="${rt.escape(reason || command.label)}">
        <ha-icon icon="${this.commandIcon(command)}"></ha-icon>
        <select aria-label="${rt.escape(command.label)}" data-command-asset="${rt.escape(command.asset_id || "")}" data-command-id="${rt.escape(command.command_id || "")}" data-command-key="${rt.escape(command.command_key || command.command_id || "")}" data-command-param="${rt.escape(enumName)}" ${state.disabled ? "disabled" : ""}>
          <option value="">${rt.escape(command.label)}…</option>
          ${enums[enumName].map((option)=>`<option value="${rt.escape(option.value)}">${rt.escape(option.label || option.value)}</option>`).join("")}
        </select>
      </label>`;
    }
    return `<button class="cmd ${tone} ${compact ? "compact" : ""}" data-command-asset="${rt.escape(command.asset_id || "")}" data-command-id="${rt.escape(command.command_id || "")}" data-command-key="${rt.escape(command.command_key || command.command_id || "")}" ${state.disabled ? "disabled" : ""} title="${rt.escape(reason || command.label)}">
      <ha-icon icon="${this.commandIcon(command)}"></ha-icon>
      <span>${rt.escape(command.label)}</span>
      ${state.busy ? `<small>${rt.escape(rt.t("common.busy",{},"Working…"))}</small>` : state.failed ? `<small>${rt.escape(state.status)}</small>` : ""}
    </button>`;
  }


  formatKw(rt, value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "—";
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n)) return raw;
    const kw = Math.abs(n) > 100 ? n / 1000 : n;
    return rhiUxFormatNumber(kw,{locale:rt?.hass?.locale?.language || "en",maximumFractionDigits:2});
  }

  displayVehicleName(rt, value) {
    const raw = String(value || "").trim();
    if (!raw || ["none", "unknown", "unavailable"].includes(raw.toLowerCase())) return "None";
    const canonical = raw.startsWith("vehicle_") ? raw : `vehicle_${raw.replace(/^vehicle_/, "")}`;
    const reg = rt.registryEntry(canonical);
    return reg?.display_name || rt.vehicleLabel(raw);
  }

  lifecycleDisplay(rt, charger) {
    const status = rt.lifecycleStatus(charger);
    if (status === "active") return rt.t("state.active",{},"Active");
    if (status === "disabled") return rt.t("state.disabled",{},"Disabled");
    if (status === "retired") return rt.t("state.retired",{},"Retired");
    return rt.t("common.not_available",{},"Not available");
  }

  lifecycleToggleButton(rt, charger, extraClass = "mobility-lifecycle-action lifecycle-toggle labeled-action") {
    const status = rt.lifecycleStatus(charger);
    const desired = status === "disabled" ? "active" : "disabled";
    const model = rt.lifecycleWriteModel(charger, desired);
    const label = desired === "active" ? rt.t("action.activate",{},"Activate") : rt.t("action.disable",{},"Disable");
    const title = model.disabled ? rt.t("state.status_change_unavailable",{},"Status cannot be changed right now") : label;
    const button = `<button class="${extraClass}" data-lifecycle-asset="${rt.escape(this.assetId(charger))}" data-lifecycle-value="${rt.escape(desired)}" ${model.disabled ? "disabled" : ""} title="${rt.escape(title)}"><ha-icon icon="mdi:power"></ha-icon><span>${rt.escape(label)}</span></button>`;
    return model.disabled && extraClass.includes("labeled-action") ? `<span class="lifecycle-control-wrap">${button}<small class="lifecycle-disabled-reason">${rt.escape(title)}</small></span>` : button;
  }

  renderCollapsedCharger(rt, charger) {
    const name = charger.display_name || rt.titleize(charger.asset_id);
    const disabled = rt.lifecycleStatus(charger) === "disabled";
    const image = rt.cache(this.chargerImageFromId(this.chargerId(charger)));
    const photo = `<span class="inactive-photo"><img src="${rt.escape(image)}" alt="${rt.escape(name)}" loading="lazy" onerror="this.style.display='none'"></span>`;
    if (disabled) {
      // No charger commands, assignments, measurements, details or editor while disabled.
      return `<article class="inactive-row lifecycle-collapsed-row charger-collapsed-row disabled-identity-only" style="grid-template-columns:64px minmax(0,1fr) auto">
        ${photo}<div class="inactive-copy"><h3>${rt.escape(name)}</h3></div>
        <div class="inactive-actions">${this.lifecycleToggleButton(rt, charger, "cmd compact lifecycle-toggle labeled-action")}</div>
      </article>`;
    }
    // Missing/unknown lifecycle is NOT the customer's disabled state.
    const route = rt.assetDetailRoute(charger);
    return `<article class="inactive-row lifecycle-collapsed-row charger-collapsed-row">
      <span class="inactive-state">${rt.escape(this.lifecycleDisplay(rt, charger))}</span>
      ${photo}<div class="inactive-copy"><h3>${rt.escape(name)}</h3></div>
      <div class="inactive-actions"><button class="cmd compact icon-only" data-nav="${rt.escape(route)}" title="Open charger details"><ha-icon icon="mdi:chevron-right"></ha-icon><span>Details</span></button></div>
    </article>`;
  }

  renderCharger(rt, charger) {
    const id = this.chargerId(charger);
    const assetId = this.assetId(charger);
    const model = new HomeBrainChargerAdapter(rt, id, { ...this.config, registry_entry:charger }).build();
    const projection = model?.projection || {};
    const facts = projection.facts || {};
    const powerEvidence = new HomeBrainChargerAdapter(rt, id, { ...this.config, registry_entry:charger }).chargingPowerEvidence();
    const name = model?.display || charger.display_name || rt.titleize(assetId);
    const runtimeReady = facts.operating?.resolved === true;
    const status = facts.operating?.display || "—";
    const connectionState = facts.connection?.display || "—";
    const connectedVehicle = facts.connected_vehicle?.display || "—";
    const assignedId = String(projection?.relationships?.assigned_vehicle_id || "");
    const assignedVehicle = assignedId
      ? String(projection?.relationships?.assigned_vehicle_display_name || assignedId)
      : rt.t("common.no_vehicle_assigned",{},"No vehicle assigned");
    const power = facts.power?.display || "—";
    const actualCurrent = facts.actual_current?.display || "—";
    const currentLimit = facts.current_limit?.display || "—";
    const offeredCurrent = facts.offered_current?.display || "—";
    const activePhases = "—";
    const session = facts.session_energy?.display || "—";
    const connected = connectionState;
    const enabled = "—";
    const healthSummary = { value:facts.health?.display || "—", reason:facts.health?.reason || "", resolved:facts.health?.resolved === true };
    const freshness = "—";
    const trust = healthSummary.value;
    const connector = connectionState;
    const primary = projection.commands || [];
    // R43.2.54: all normal product commands render exactly once from
    // charger_actions.commands. Maintenance/diagnostic sections contain context only.
    const maintenance = [];
    const destructive = [];
    const issue = status.toLowerCase().includes("fault") || status.toLowerCase().includes("unavailable") || status.toLowerCase().includes("contract gap") || (healthSummary.resolved && !["ok", "healthy"].includes(String(healthSummary.value || "").toLowerCase()));
    const maintenanceOpen = this._openPanels.has(`${assetId}:maintenance`);
    const configOpen = this._openPanels.has(`${assetId}:config`);
    const mode = rt.t("common.automatic",{},"Automatic");
    const dataQuality = trust;
    const lastUpdate = charger.last_seen || "Unknown";
    const configFields = [
      this.detailField(rt, rt.t("common.profile",{},"Profile"), charger.profile || "—"),
      this.detailField(rt, rt.t("common.location",{},"Location"), charger.location || "—"),
      this.detailField(rt, rt.t("common.status",{},"Status"), this.lifecycleDisplay(rt, charger)),
      this.detailField(rt, rt.t("common.mode",{},"Mode"), mode),
      this.detailField(rt, rt.t("common.assigned_vehicle",{},"Assigned vehicle"), assignedVehicle),
      this.detailField(rt, rt.t("common.connected_vehicle",{},"Connected vehicle"), connectedVehicle),
      this.detailField(rt, rt.t("common.connector",{},"Connector"), connector),
      this.detailField(rt, rt.t("common.current_limit",{},"Current limit"), currentLimit),
      this.detailField(rt, rt.t("common.actual_current",{},"Actual current"), actualCurrent),
      this.detailField(rt, rt.t("common.offered_current",{},"Offered current"), offeredCurrent),
      this.detailField(rt, rt.t("common.power",{},"Power"), power),
      this.detailField(rt, rt.t("common.session_energy",{},"Session energy"), session),
      this.detailField(rt, rt.t("common.health",{},"Health"), healthSummary.value),
      this.detailField(rt, rt.t("common.last_update",{},"Last update"), lastUpdate)
    ].join("");
    const diagnosticsFields = [
      this.detailField(rt, "Asset id", assetId),
      this.detailField(rt, "Execution owner", charger.execution_owner || "—"),
      this.detailField(rt, "Published commands", String(rt.commandRegistry(assetId).length)),
      this.detailField(rt, "Sort order", String(charger.sort_order ?? "—")),
      this.detailField(rt, "Backend reason", healthSummary.reason || "—")
    ].join("");
    const pickerOpen = this._chargerPickerAsset === assetId;
    const appearanceError = this._chargerAppearanceError.get(assetId) || "";
    return `<article class="charger-card ${issue ? "attention" : ""}">
      <div class="charger-identity-card">
        <div class="charger-identity-copy">
          <div class="charger-identity-top">
            <div class="charger-title">
              <h3 title="${rt.escape(name)}">${rt.escape(name)}</h3>
              ${charger.location ? `<p class="charger-location" title="${rt.escape(charger.location)}">${rt.escape(charger.location)}</p>` : ""}
              <p class="charger-profile" title="${rt.escape(projection.identity?.profile || charger.profile || rt.t("common.not_configured",{},"Not configured"))}">${rt.escape(projection.identity?.profile || charger.profile || rt.t("common.not_configured",{},"Not configured"))}</p>
            </div>
            <span class="status ${this.statusTone(status)}">${rt.escape(status)}</span>
          </div>
          <button class="charger-appearance-action" data-charger-picker="${rt.escape(assetId)}" title="${rt.escape(rt.t("common.choose_appearance",{},"Choose appearance"))}"><ha-icon icon="mdi:palette-outline"></ha-icon><span>${rt.escape(rt.t("common.appearance",{},"Appearance"))}</span></button>
        </div>
        ${this.renderChargerHero(rt, id, name, status)}
      </div>
      ${pickerOpen ? this.renderChargerPicker(rt, charger) : ""}
      ${appearanceError ? `<div class="appearance-write-error" role="status"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${rt.escape(appearanceError)}</span></div>` : ""}
      <div class="charger-kpis mobility-fact-strip">
        ${this.field(rt, "Power", power, "mdi:flash")}
        ${this.field(rt, "Current", actualCurrent, "mdi:current-ac")}
        ${this.field(rt, "Limit", currentLimit, "mdi:speedometer")}
        ${this.field(rt, "Session", session, "mdi:lightning-bolt-circle")}
      </div>
      ${powerEvidence.state === "no_measured_power" ? `<div class="charger-power-evidence" role="status"><ha-icon icon="mdi:information-outline"></ha-icon><span>${rt.escape(powerEvidence.label)} — ${rt.escape(powerEvidence.reason)}</span></div>` : ""}
      <div class="charger-status-strip" aria-label="Charger operational status">
        <div class="charger-status-fact" title="Published charger connection state"><ha-icon icon="mdi:connection"></ha-icon><span><small>Connection</small><b>${rt.escape(connector)}</b></span></div>
        <div class="charger-status-fact" title="Configured/effective Mobility relationship"><ha-icon icon="mdi:car-electric"></ha-icon><span><small>${rt.escape(rt.t("common.assigned_vehicle",{},"Assigned vehicle"))}</small><b>${rt.escape(assignedVehicle)}</b></span></div>
        <div class="charger-status-fact" title="Canonical charger health"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><small>${rt.escape(rt.t("common.health",{},"Health"))}</small><b>${rt.escape(healthSummary.value)}</b></span></div>
      </div>
      <div class="command-row charger-command-row">
        ${primary.length ? primary.map((c) => this.renderCommand(rt, c)).join("") : `<div class="empty-actions">No direct actions available for this charger.</div>`}
        ${this.lifecycleToggleButton(rt, charger)}
        <button class="mobility-detail-action charger-card-details" data-nav="${rt.escape(rt.assetDetailRoute(charger))}" title="Open charger details">${rt.escape(rt.t("common.details",{},"Details"))}<ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
      ${this.config?.show_diagnostics === true ? `<section class="fold-section ${maintenanceOpen ? "open" : ""}" data-panel-key="${rt.escape(`${assetId}:maintenance`)}">
        <button class="fold-toggle" data-toggle-panel="${rt.escape(`${assetId}:maintenance`)}" type="button"><ha-icon icon="mdi:chevron-${maintenanceOpen ? "down" : "right"}"></ha-icon><span>${rt.escape(rt.t("common.technical_diagnostics",{},"Technical diagnostics"))}</span></button>
        <div class="fold-panel"><div class="detail-grid">${diagnosticsFields}</div></div>
      </section>` : ""}
      <section class="fold-section config-details ${configOpen ? "open" : ""}" data-panel-key="${rt.escape(`${assetId}:config`)}">
        <button class="fold-toggle" data-toggle-panel="${rt.escape(`${assetId}:config`)}" type="button"><ha-icon icon="mdi:chevron-${configOpen ? "down" : "right"}"></ha-icon><span>Profile & detailed configuration</span></button>
        <div class="fold-panel"><div class="detail-grid">${configFields}</div></div>
      </section>
    </article>`;
  }

  set hass(hass) {
    this._hass = hass;
    const rt = new HomeBrainAssetRuntime(hass, this.config);
    const forceRender = !!this._forceRender;
    this._forceRender = false;
    const revisionSignature = rt.productRevisionSignature("", [
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_COMMAND_V2",
      "MOBILITY_PROFILE_CATALOG_V2"
    ]);
    if (!forceRender && this._lastRenderOk && revisionSignature === this._lastRevisionSignature) return;
    this._lastRevisionSignature = revisionSignature;
    const factory = new HomeBrainAssetFactory(rt);
    const chargers = factory.chargers().filter((a) => rt.lifecycleStatus(a) !== "retired").sort((a,b)=>(Number(a.sort_order ?? 999)-Number(b.sort_order ?? 999)) || String(a.display_name).localeCompare(String(b.display_name)));
    const activeChargers = chargers.filter((c) => rt.lifecycleStatus(c) === "active");
    const inactiveChargers = chargers.filter((c) => rt.lifecycleStatus(c) !== "active" && rt.lifecycleStatus(c) !== "retired");
    const fleet = rt.mobilityFleetProjection();
    const activeModels = activeChargers.map((charger)=>({
      charger,
      model: factory.adapterFor(charger, this.config)?.build?.() || null
    }));
    const activeExperienceRows = activeModels.map(({charger, model})=>({
      asset_id: charger.asset_id,
      ...(model?.projection?.experience || {})
    }));
    const connectedCount = Number.isFinite(Number(fleet.connected_charger_count))
      ? Number(fleet.connected_charger_count)
      : activeModels.filter(({model})=>String(model?.projection?.intelligence?.connection?.state || "").toLowerCase() === "asset_connected").length;
    const chargingCount = Number.isFinite(Number(fleet.charging_charger_count))
      ? Number(fleet.charging_charger_count)
      : activeModels.filter(({model})=>String(model?.projection?.intelligence?.charging?.state || "").toLowerCase() === "running").length;
    const availableCount = Number.isFinite(Number(fleet.available_charger_count))
      ? Number(fleet.available_charger_count)
      : activeModels.filter(({model})=>String(model?.projection?.availability?.bucket || "").toLowerCase() === "free").length;
    const faultRows = activeExperienceRows.filter((row)=>String(row?.fault?.state || "").toLowerCase() === "active");
    const faultCount = faultRows.length;
    const aggregatePowerState = String(fleet.aggregate_power_state || "unknown").toLowerCase();
    const aggregatePower = Number(fleet.aggregate_actual_charging_power_kw);
    const totalPowerDisplay = Number.isFinite(aggregatePower) && aggregatePowerState !== "unknown"
      ? `${aggregatePower.toFixed(1)} kW${aggregatePowerState === "partial" ? " · partial" : " now"}`
      : "Power unknown";

    const signature = JSON.stringify({
      assets: chargers.map((c) => {
        const model = factory.adapterFor(c, this.config)?.build?.() || null;
        const projection = model?.projection || {};
        return [c.asset_id, model?.display || c.display_name, projection?.lifecycle?.state || rt.lifecycleStatus(c), projection?.facts, projection?.intelligence, projection?.relationships, projection?.availability,
          (projection?.commands || []).map((cmd)=>[cmd.command_id, cmd.frontend_allowed, cmd.execution_allowed, cmd.execution_status || "", cmd.blocked_reason || cmd.execution_reason || ""])];
      }),
      fleet,
      open: Array.from(this._openPanels || []).sort(),
      drafts: Array.from(this._limitDrafts || []),
      feedback: Array.from(this._commandFeedback || []).filter(([, until]) => Date.now() < until)
    });
    const labelFor = (row) => String(row?.short_name || row?.display_name || row?.name || row?.asset_id || "—").trim();
    const activeExperience = activeExperienceRows;
    const profiledRows = activeExperience.filter((row)=>!!String(row?.configuration_status?.profile_id || "").trim());
    const unprofiledRows = activeExperience.filter((row)=>!String(row?.configuration_status?.profile_id || "").trim());
    const availableRows = activeExperience.filter((row)=>String(row?.availability_intelligence?.state || "").toLowerCase() === "ok");
    const names = (rows)=>rows.slice(0,3).map(labelFor).join(" · ");

    const chargerHeaderCards = [
      { icon:"mdi:card-account-details-outline", label:rt.t("charger.profiles",{},"Profiles"), value:`${profiledRows.length}/${activeChargers.length} configured`, sub:unprofiledRows.length ? `${names(unprofiledRows)} without profile` : rt.t("charger.no_profile_summary",{},"All active chargers profiled"), tone:"neutral" },
      { icon:"mdi:ev-station", label:rt.t("charger.availability",{},"Availability"), value:`${availableCount}/${activeChargers.length} available`, sub:availableRows.length ? names(availableRows) : rt.t("common.no_charger_available",{},"No charger currently available"), tone:"neutral" },
      { icon:"mdi:lightning-bolt", label:rt.t("charger.runtime",{},"Runtime"), value:totalPowerDisplay, sub:`${connectedCount} connected · ${chargingCount} charging`, tone:"neutral" }
    ];
    if (faultCount) chargerHeaderCards.push({
      icon:"mdi:alert-circle-outline",
      label:rt.t("charger.issue",{},"Issue"),
      value:`${faultCount} fault${faultCount === 1 ? "" : "s"}`,
      sub:names(faultRows),
      tone:"warn"
    });

    const activeEl = this.shadowRoot?.activeElement;
    if (activeEl && ["SELECT", "INPUT"].includes(activeEl.tagName) && this._lastRenderOk) return;
    if (!this._forceRender && this._chargerPickerAsset && this._lastRenderOk) return;
    if (this._lastSignature === signature && this._lastRenderOk) return;
    this._lastSignature = signature;
    this._lastRenderOk = true;

    {
      const template = document.createElement("template");
      template.innerHTML = `<ha-card>
      <div class="page">
        <div class="hi-version-block" style="position:absolute;top:18px;right:22px;text-align:right;font-size:10.5px;line-height:1.25;font-weight:400;color:var(--secondary-text-color,#6B7280);opacity:.82;background:none;border:0;box-shadow:none;padding:0;margin:0;z-index:3;pointer-events:none;"><div>UX ${rt.escape(UX_VERSION)}</div><div>Backend ${rt.escape(rt.backendVersion())}</div></div>
        ${hbMobilityNav(this.config?.nav_active || "chargers")}
        ${hbMobilityPageHero(rt, "chargers")}
        ${hbMobilityStatusGrid(rt, chargerHeaderCards, "chargers-top-status")}
        ${hbMobilityQuickActions(rt, [
          { icon:"mdi:cog-outline", label:rt.t("charger.manage",{},"Manage chargers & profiles"), path:"/config/integrations/integration/rhi_mobility", primary:true },
          { icon:"mdi:car-electric", label:rt.t("charger.vehicle_management",{},"Vehicle Management"), path:hbMobilityPath("/dashboard") },
          { icon:"mdi:calendar-clock", label:rt.t("charger.charging_plan",{},"Charging plan"), path:hbMobilityPath("/planning") },
          { icon:"mdi:target", label:rt.t("charger.strategies",{},"Strategies"), path:hbMobilityPath("/strategies") }
        ])}
        <section class="section-title"><h2>${rt.escape(rt.t("charger.active",{},"Active chargers"))}</h2><span>${activeChargers.length} active · ${connectedCount} connected · ${chargingCount} charging · ${rt.escape(totalPowerDisplay)}</span></section>
        <section class="grid">
          ${activeChargers.length ? activeChargers.map((c) => this.renderCharger(rt, c)).join("") : `<div class="empty-state"><ha-icon icon="mdi:ev-station-off"></ha-icon><h2>${rt.escape(rt.t("charger.no_active",{},"No active chargers"))}</h2><p>${rt.escape(rt.t("charger.activate_when_needed",{},"Activate a charger below when needed."))}</p></div>`}
        </section>
        ${inactiveChargers.length ? `<section class="section-title compact-title"><h2>${rt.escape(rt.t("charger.inactive",{},"Inactive chargers"))}</h2><span>${inactiveChargers.length} inactive</span></section><section class="inactive-list">${inactiveChargers.map((c)=>this.renderCollapsedCharger(rt,c)).join("")}</section>` : `<section class="debt-strip"><ha-icon icon="mdi:information-outline"></ha-icon><b>Inactive chargers (0)</b><span>${rt.escape(rt.t("charger.disabled_hidden",{},"Disabled chargers are hidden."))}</span></section>`}
        
      </div>
      <style>${this.styles()}${hbMobilityResponsiveFinishStyles()}
/* R22.12.11.24 unified quick-action sizing */
.action.enum-action,.cmd.enum-command{height:43px;min-height:43px;max-height:43px;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;padding:0 11px;box-sizing:border-box;overflow:hidden}
.action.enum-action ha-icon,.cmd.enum-command ha-icon{flex:0 0 auto;grid-row:auto}
.action.enum-action select,.cmd.enum-command select{appearance:auto;-webkit-appearance:auto;min-width:0;max-width:170px;width:auto;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;font-weight:600;padding:0 2px;line-height:1;box-shadow:none;cursor:pointer;grid-column:auto}
.action.enum-action select:focus,.cmd.enum-command select:focus{outline:2px solid rgba(20,103,245,.20);outline-offset:3px;border-radius:6px}
.command-row>.cmd,.command-row>.enum-command{min-width:0;width:100%}
</style>
      ${hbMobilityReleaseFooter(rt)}
    </ha-card>`;
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }
    this._forceRender = false;

    this.shadowRoot.querySelectorAll("button[data-command-id]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (btn.disabled) return;
        const assetId = btn.getAttribute("data-command-asset");
        const commandId = btn.getAttribute("data-command-id");
        const command = rt.commandsFor(assetId).find((c)=>String(c.command_id || "") === String(commandId));
        if (!command) return;
        rt.callCommand(command);
      });
    });
    this.shadowRoot.querySelectorAll("select[data-command-id]").forEach((select) => {
      select.addEventListener("change", (ev) => {
        ev.stopPropagation();
        if (select.disabled || !select.value) return;
        const assetId = select.getAttribute("data-command-asset") || "";
        const commandId = select.getAttribute("data-command-id") || "";
        const commandKey = select.getAttribute("data-command-key") || commandId;
        const parameter = select.getAttribute("data-command-param") || "";
        const command = rt.commandsFor(assetId).find((candidate)=>String(candidate.command_key || candidate.command_id || "") === String(commandKey) || String(candidate.command_id || "") === String(commandId));
        if (!command || !parameter) return;
        rt.callCommand(command, { [parameter]: select.value });
        select.value = "";
      });
    });
    this.shadowRoot.querySelectorAll("button[data-toggle-panel]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const key = btn.getAttribute("data-toggle-panel");
        if (!key) return;
        const section = btn.closest(".fold-section");
        const icon = btn.querySelector("ha-icon");
        if (this._openPanels.has(key)) {
          this._openPanels.delete(key);
          section?.classList.remove("open");
          if (icon) icon.setAttribute("icon", "mdi:chevron-right");
        } else {
          this._openPanels.add(key);
          section?.classList.add("open");
          if (icon) icon.setAttribute("icon", "mdi:chevron-down");
        }
      });
    });
    this.shadowRoot.querySelectorAll("button[data-lifecycle-asset]").forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (btn.disabled) return;
        const assetId = btn.getAttribute("data-lifecycle-asset") || "";
        const value = btn.getAttribute("data-lifecycle-value") || "";
        if (!assetId || !value) return;
        btn.disabled = true;
        btn.classList.remove("failed");
        const ok = await rt.writeLifecycleStatusAsync(assetId, value);
        if (!ok) {
          btn.disabled = false;
          btn.classList.add("failed");
          btn.title = "Write rejected or canonical readback did not confirm lifecycle state.";
          return;
        }
        btn.classList.add("sent");
        this._lastSignature = "";
        setTimeout(()=>{ if (this.isConnected) this.hass = this._hass; }, 450);
      });
    });
    this.shadowRoot.querySelectorAll("button[data-charger-picker]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const assetId = btn.getAttribute("data-charger-picker") || "";
        this._chargerPickerAsset = this._chargerPickerAsset === assetId ? "" : assetId;
        if (!this._chargerPickerDraft.has(assetId)) this._chargerPickerDraft.set(assetId, {});
        this._forceRender = true;
        this._lastSignature = "";
        if (this.isConnected) this.hass = this._hass;
      });
    });
    this.shadowRoot.querySelectorAll("button[data-charger-picker-close]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        this._chargerPickerAsset = "";
        this._forceRender = true;
        this._lastSignature = "";
        if (this.isConnected) this.hass = this._hass;
      });
    });
    this.shadowRoot.querySelectorAll("[data-charger-picker-panel]").forEach((panel) => {
      const assetId = panel.getAttribute("data-charger-picker-panel") || "";
      const picker = new HomeBrainChargerVisualPicker(rt);
      const brandSelect = panel.querySelector("[data-charger-picker-brand]");
      const modelSelect = panel.querySelector("[data-charger-picker-model]");
      const variantSelect = panel.querySelector("[data-charger-picker-variant]");
      const appearanceSelect = panel.querySelector("[data-charger-picker-appearance]");
      const saveButton = panel.querySelector("[data-charger-picker-save]");
      const keyNode = panel.querySelector(".vehicle-picker-key code");
      const placeholder = (label)=>`<option value="" selected disabled>${rt.escape(label)}</option>`;

      panel.querySelectorAll("[data-charger-visual-choice]").forEach((choice)=>choice.addEventListener("click",(ev)=>{
        ev.preventDefault(); ev.stopPropagation();
        const draft={
          brand:choice.getAttribute("data-choice-brand") || "",
          model:choice.getAttribute("data-choice-model") || "",
          variant_id:choice.getAttribute("data-charger-visual-choice") || "",
          appearance_id:choice.getAttribute("data-choice-appearance") || ""
        };
        this._chargerPickerDraft.set(assetId,draft);
        this._forceRender=true; this._lastSignature="";
        if(this._hass) this.hass=this._hass;
      }));

      const updatePreview = () => {
        const catalog = picker.catalog();
        const charger = catalog.find((row)=>row.id===String(variantSelect?.value || "")) || null;
        const appearance = charger?.appearances?.find((row)=>row.id===String(appearanceSelect?.value || "")) || null;
        const key = charger && appearance && typeof rhiMobilityChargerVisualKey === "function"
          ? rhiMobilityChargerVisualKey(charger.id, appearance.id)
          : "";
        const asset = rt.chargerById(assetId) || rt.assetById(assetId) || {asset_id:assetId,asset_type:"charger"};
        const draft = this._chargerPickerDraft.get(assetId) || {};
        const selection = picker.selection(asset, draft);
        if (keyNode) keyNode.textContent = selection.key || key || "Unavailable";
        if (saveButton) {
          saveButton.setAttribute("data-charger-key", selection.key || key || "");
          saveButton.setAttribute("data-charger-profile-id", selection.profile_id || "");
          saveButton.disabled = !selection.writable;
        }
        const card = panel.closest(".charger-card");
        const preview = card?.querySelector(".charger-visual img");
        if (preview && selection.appearance?.package_file) preview.src = rt.cache(selection.appearance.package_file);
      };

      const refreshHierarchy = (level) => {
        const catalog = picker.catalog();
        const brand = String(brandSelect?.value || "");
        if (level === "brand") {
          const models = picker.modelsForBrand(brand, catalog);
          if (modelSelect) {
            modelSelect.disabled = !brand;
            modelSelect.innerHTML = placeholder("Choose model…") + models.map((model)=>`<option value="${rt.escape(model)}">${rt.escape(model)}</option>`).join("");
          }
          if (variantSelect) { variantSelect.disabled = true; variantSelect.innerHTML = placeholder("Choose variant…"); }
          if (appearanceSelect) { appearanceSelect.disabled = true; appearanceSelect.innerHTML = placeholder("Choose colour…"); }
        } else if (level === "model") {
          const model = String(modelSelect?.value || "");
          const variants = picker.variantsFor(brand, model, catalog);
          if (variantSelect) {
            variantSelect.disabled = !model;
            variantSelect.innerHTML = placeholder("Choose variant…") + variants.map((row)=>`<option value="${rt.escape(row.id)}">${rt.escape(row.variant || "Standard")} · ${rt.escape(row.years)}</option>`).join("");
          }
          if (appearanceSelect) { appearanceSelect.disabled = true; appearanceSelect.innerHTML = placeholder("Choose colour…"); }
        } else if (level === "variant") {
          const charger = catalog.find((row)=>row.id===String(variantSelect?.value || "")) || null;
          if (appearanceSelect) {
            appearanceSelect.disabled = !charger;
            appearanceSelect.innerHTML = placeholder("Choose colour…") + (charger?.appearances || []).map((row)=>`<option value="${rt.escape(row.id)}">${rt.escape(row.label)}</option>`).join("");
          }
        }
        updatePreview();
      };

      brandSelect?.addEventListener("change", (ev) => {
        ev.stopPropagation();
        const draft = { ...(this._chargerPickerDraft.get(assetId) || {}), brand:brandSelect.value, model:"", variant_id:"", appearance_id:"" };
        this._chargerPickerDraft.set(assetId, draft);
        refreshHierarchy("brand");
      });
      modelSelect?.addEventListener("change", (ev) => {
        ev.stopPropagation();
        const draft = { ...(this._chargerPickerDraft.get(assetId) || {}), model:modelSelect.value, variant_id:"", appearance_id:"" };
        this._chargerPickerDraft.set(assetId, draft);
        refreshHierarchy("model");
      });
      variantSelect?.addEventListener("change", (ev) => {
        ev.stopPropagation();
        const draft = { ...(this._chargerPickerDraft.get(assetId) || {}), variant_id:variantSelect.value, appearance_id:"" };
        this._chargerPickerDraft.set(assetId, draft);
        refreshHierarchy("variant");
      });
      appearanceSelect?.addEventListener("change", (ev) => {
        ev.stopPropagation();
        const draft = { ...(this._chargerPickerDraft.get(assetId) || {}), appearance_id:appearanceSelect.value };
        this._chargerPickerDraft.set(assetId, draft);
        updatePreview();
      });
    });
    this.shadowRoot.querySelectorAll("button[data-charger-picker-save]").forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        if (btn.disabled) return;
        const assetId = btn.getAttribute("data-charger-picker-save") || "";
        const profileId = btn.getAttribute("data-charger-profile-id") || "";
        const key = btn.getAttribute("data-charger-key") || "";
        if (!assetId || !key) return;
        const asset = rt.chargerById(assetId) || rt.assetById(assetId) || {asset_id:assetId,asset_type:"charger"};
        const selection = new HomeBrainChargerVisualPicker(rt).selection(asset,this._chargerPickerDraft.get(assetId) || {});
        this._chargerPendingAppearance.set(assetId,{
          key,
          image:selection?.appearance?.package_file || "",
          started_at:Date.now()
        });
        this._chargerAppearanceError.delete(assetId);
        this._forceRender=true; this._lastSignature="";
        if(this._hass)this.hass=this._hass;
        btn.disabled = true;
        const currentProjection = new HomeBrainChargerAdapter(rt, this.chargerId(asset), { ...this.config, registry_entry:asset }).productProjection();
        const currentProfile = String(currentProjection?.identity?.profile_id || "");
        const profileOk = !profileId || profileId === currentProfile || await rt.writePublishedPropertyAsync(assetId, "asset.profile_id", profileId);
        if (!profileOk) { this.failChargerAppearance(assetId,"Profile update was rejected. Appearance was not changed."); return; }
        const imageOk = await rt.writePublishedPropertyAsync(assetId, "charger.image_key", key);
        if (!imageOk) { this.failChargerAppearance(assetId,"Appearance update was rejected or canonical readback did not confirm it."); return; }
        btn.classList.add("sent");
        this._chargerPickerDraft.delete(assetId);
        this._chargerPickerAsset="";
        this._forceRender=true; this._lastSignature="";
        if(this._hass)this.hass=this._hass;
        setTimeout(()=>{
          const pending=this._chargerPendingAppearance.get(assetId);
          if(pending?.key===key) this.failChargerAppearance(assetId,"Appearance readback timed out; showing the canonical Mobility appearance again.");
        },8000);
      });
    });

    this.shadowRoot.querySelectorAll("button[data-nav]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const path = btn.getAttribute("data-nav");
        if (path) rt.navigate(path);
      });
    });
  }

  styles() {
    return `
    .charger-power-evidence{display:flex;align-items:flex-start;gap:7px;padding:9px 12px;margin:6px 0;border:1px solid #f1dcaa;border-radius:10px;background:#fffaf0;color:#775514;font-size:11px;line-height:1.45}.charger-power-evidence ha-icon{--mdc-icon-size:17px;flex:none}

      :host{display:block;--hb-blue:#1467F5;--hb-soft-blue:#EEF5FF;--hb-ink:#06142D;--hb-muted:#66728B;--hb-line:#E6EDF7;--hb-shadow:0 18px 44px rgba(15,35,80,.075);user-select:text;-webkit-user-select:text;color:var(--hb-ink)}
      ha-card{background:transparent;border:0;box-shadow:none}.page{position:relative;width:min(100%,1560px);margin:0 auto;padding:18px 26px 30px;box-sizing:border-box;display:grid;gap:12px}.release-badge{position:absolute;top:6px;right:26px;z-index:3;border:1px solid rgba(14,35,72,.10);background:rgba(255,255,255,.92);color:#33415C;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:650;line-height:1;box-shadow:0 8px 20px rgba(15,35,80,.055)}.hero{border:1px solid rgba(14,35,72,.10);border-radius:24px;background:linear-gradient(135deg,#FFFFFF 0%,#F8FBFF 48%,#EEF5FF 100%);box-shadow:var(--hb-shadow);padding:28px 34px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center}.hero-side{display:grid;grid-template-columns:auto auto;gap:12px;align-items:center}.hero-side.no-registered-chargers{grid-template-columns:auto;justify-self:end}.charger-hero-visual{width:230px;height:112px;border-radius:24px;background:linear-gradient(135deg,rgba(238,245,255,.95),rgba(255,255,255,.7));border:1px solid rgba(20,103,245,.10);display:flex;align-items:center;justify-content:center;gap:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}.charger-device{position:relative;width:58px;height:82px;border-radius:18px;background:#FFFFFF;border:1px solid var(--hb-line);box-shadow:0 14px 30px rgba(15,35,80,.12);display:flex;align-items:center;justify-content:center}.charger-device ha-icon{--mdc-icon-size:34px;color:var(--hb-blue)}.charger-device span{position:absolute;top:9px;width:22px;height:4px;border-radius:99px;background:#2DD56F}.flow-line{width:64px;height:6px;border-radius:999px;background:linear-gradient(90deg,#CFE0FF,#1467F5);box-shadow:0 0 18px rgba(20,103,245,.25)}.charger-car{width:58px;height:58px;border-radius:20px;background:#fff;border:1px solid var(--hb-line);box-shadow:0 14px 30px rgba(15,35,80,.10);display:flex;align-items:center;justify-content:center}.charger-car ha-icon{--mdc-icon-size:34px;color:var(--hb-ink)}.eyebrow{font-size:12px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--hb-blue);margin-bottom:8px}h1{font-size:46px;line-height:1;letter-spacing:-.055em;margin:0 0 10px;font-weight:650}p{margin:0;color:#34405A;font-size:16px;line-height:1.45;font-weight:600;max-width:780px}.hero-metrics{display:grid;grid-template-columns:repeat(3,112px);gap:10px}.hero-metrics div{background:rgba(255,255,255,.92);border:1px solid var(--hb-line);border-radius:18px;padding:14px;text-align:center;box-shadow:0 10px 28px rgba(15,35,80,.055)}.hero-metrics b{display:block;font-size:28px;font-weight:650}.hero-metrics span{font-size:12px;color:var(--hb-muted);font-weight:600}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px;align-items:start}.inactive-list{display:grid;gap:10px}.inactive-row{background:#fff;border:1px solid var(--hb-line);border-radius:18px;box-shadow:0 12px 36px rgba(15,35,80,.055);padding:10px 12px;display:grid;grid-template-columns:82px 1fr auto;gap:14px;align-items:center}.inactive-state{background:#EEF2F7;color:#53627A;border-radius:999px;font-weight:650;font-size:12px;padding:7px 10px;text-align:center}.inactive-copy h3{margin:0 0 2px;font-size:16px;font-weight:650}.inactive-copy p{margin:0;color:#64708A;font-weight:600}.inactive-actions{display:flex;gap:8px}.cmd.icon-only{width:36px;min-width:36px;max-width:36px;padding:0}.cmd.icon-only span{display:none}.debt-strip{display:flex;align-items:center;gap:12px;background:#F8FBFF;border:1px solid #DDEAFF;border-radius:18px;padding:12px 18px;color:#45536C;font-size:13px;font-weight:600}.debt-strip ha-icon{color:#1467F5}.charger-card{background:#fff;border:1px solid var(--hb-line);border-radius:20px;box-shadow:var(--hb-shadow);padding:14px;display:grid;gap:12px;min-width:0;align-self:start;align-content:start}.charger-card.attention{border-color:rgba(242,140,0,.35);background:linear-gradient(180deg,#fff,#fffaf3)}.charger-hero-card{min-height:178px;border-radius:16px;border:1px solid rgba(20,103,245,.10);background:linear-gradient(135deg,#FFFFFF 0%,#F7FAFF 52%,#EEF5FF 100%);padding:13px 14px;display:grid;grid-template-columns:minmax(0,1fr) minmax(136px,32%);gap:12px;align-items:center;overflow:hidden}.charger-head{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;gap:8px 12px;align-items:start;min-width:0}.charger-head.compact{grid-template-columns:44px minmax(0,1fr);align-content:start}.charger-head.compact .status{grid-column:1/-1;justify-self:start;margin-top:10px}.charger-icon{width:48px;height:48px;border-radius:16px;background:var(--hb-soft-blue);display:flex;align-items:center;justify-content:center}.charger-icon ha-icon{--mdc-icon-size:26px;color:var(--hb-blue)}h3{margin:0;font-size:18px;font-weight:650;letter-spacing:-.02em;white-space:normal;overflow-wrap:anywhere}.charger-title{min-width:0}.charger-title p{font-size:11px;color:var(--hb-muted);font-weight:600;margin:4px 0 0;white-space:normal;overflow-wrap:anywhere}.charger-title .charger-profile{color:#355D96}.charger-visual{position:relative;height:150px;border-radius:16px;background:rgba(255,255,255,.72);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}.charger-visual:before{content:"";position:absolute;inset:auto 14px 14px;height:12px;border-radius:50%;background:rgba(15,35,80,.08);filter:blur(8px)}.charger-visual img{position:relative;z-index:2;width:100%;height:100%;max-width:150px;max-height:144px;object-fit:contain;object-position:center;filter:drop-shadow(0 16px 20px rgba(15,35,80,.14))}.charger-visual img.failed{display:none}.charger-visual-fallback{display:none;position:relative;z-index:1;width:86px;height:86px;border-radius:26px;background:#fff;border:1px solid var(--hb-line);align-items:center;justify-content:center;box-shadow:0 16px 30px rgba(15,35,80,.10)}.charger-visual.image-missing .charger-visual-fallback{display:flex}.charger-visual-fallback ha-icon{--mdc-icon-size:46px;color:var(--hb-blue)}.status{border-radius:999px;padding:7px 10px;font-size:12px;font-weight:650;border:1px solid rgba(14,35,72,.08);white-space:nowrap}.status.ok{background:#E7F6EA;color:#087A35}.status.warn{background:#FFF1D9;color:#B76500}.status.bad{background:#FDE4E4;color:#C21E1E}.status.muted{background:#EEF1F6;color:#64708A}.charger-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.field{border:1px solid var(--hb-line);background:#FAFCFF;border-radius:15px;padding:11px;display:grid;grid-template-columns:24px minmax(0,1fr);column-gap:8px;align-items:center}.field ha-icon{--mdc-icon-size:20px;color:var(--hb-blue);grid-row:1/3}.field span{font-size:11px;color:var(--hb-muted);font-weight:600}.field b{font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.soft-line{display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid rgba(14,35,72,.07);padding-top:12px}.soft-line span{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--hb-line);background:#fff;border-radius:12px;padding:7px 9px;color:#34405A;font-size:12px;font-weight:600;min-width:0}.soft-line .charger-assignment{display:grid;grid-template-columns:18px minmax(0,1fr);grid-template-rows:auto auto;column-gap:6px;max-width:100%}.soft-line .charger-assignment ha-icon{grid-row:1/3}.soft-line .charger-assignment small{font-size:9px;color:var(--hb-muted);font-weight:600}.soft-line .charger-assignment b{font-size:12px;white-space:normal;overflow-wrap:anywhere}.soft-line ha-icon{--mdc-icon-size:16px;color:var(--hb-blue)}.mini-detail-link.icon-only{width:36px;height:36px;min-width:34px;border-radius:13px;border:1px solid var(--hb-line);background:#fff;color:#1467F5;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 10px 22px rgba(15,35,80,.05);padding:0;cursor:pointer}.mini-detail-link.icon-only ha-icon{--mdc-icon-size:18px;color:#1467F5}.mini-detail-link.icon-only span{display:none}.command-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px}.cmd{min-height:43px;border:1px solid rgba(14,35,72,.10);border-radius:13px;background:#fff;color:var(--hb-ink);box-shadow:0 10px 22px rgba(15,35,80,.05);font-weight:650;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;padding:0 10px}.cmd ha-icon{--mdc-icon-size:19px;color:var(--hb-blue)}.cmd.sent{background:#EEF5FF;border-color:#CFE0FF;color:#0B4BC1}.cmd.busy{background:#FFF8E8;border-color:#F8DB99}.cmd.failed{background:#FEF3F2;border-color:#FECDCA;color:#B42318}.cmd:disabled{opacity:.56;cursor:not-allowed;box-shadow:none}.cmd small{font-size:10px;color:var(--hb-muted);font-weight:650}.cmd.compact{min-height:38px;font-size:12px}.cmd.enum-command{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;gap:4px 8px;padding:7px 10px}.cmd.enum-command ha-icon{grid-row:1/3}.cmd.enum-command span{text-align:left}.cmd.enum-command select{grid-column:2;border:1px solid var(--hb-line);border-radius:8px;background:#fff;color:var(--hb-ink);font:inherit;font-size:11px;padding:4px 6px;min-width:0}.cmd.enum-command.is-disabled{opacity:.56}.fold-section{border-top:1px solid rgba(14,35,72,.07);padding-top:8px}.fold-toggle{appearance:none;border:0;background:transparent;color:var(--hb-blue);font-size:13px;font-weight:650;display:flex;align-items:center;gap:4px;padding:0;cursor:pointer}.fold-toggle ha-icon{--mdc-icon-size:16px}.fold-panel{display:none;margin-top:10px}.fold-section.open .fold-panel{display:block}.maintenance-row{margin-top:0}.limit-control{grid-column:1/-1;border:1px solid var(--hb-line);border-radius:15px;background:#FAFCFF;padding:11px;display:grid;gap:9px}.limit-control.missing{grid-template-columns:1fr auto;align-items:center}.limit-control b{font-weight:650}.limit-control span{font-size:12px;color:var(--hb-muted);font-weight:600}.limit-head{display:flex;justify-content:space-between;gap:12px}.limit-slider{width:100%;accent-color:var(--hb-blue)}.limit-actions{display:grid;grid-template-columns:1fr auto;gap:8px}.limit-note{font-size:10px;color:var(--hb-muted);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.limit-number{border:1px solid var(--hb-line);border-radius:12px;background:#fff;padding:8px 10px;font-weight:600;color:var(--hb-ink);min-width:0}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.detail-field{border:1px solid var(--hb-line);border-radius:12px;background:#FAFCFF;padding:9px 10px;min-width:0}.detail-field span{display:block;font-size:10px;color:var(--hb-muted);font-weight:650;text-transform:uppercase;letter-spacing:.03em}.detail-field b{display:block;margin-top:3px;font-size:12px;color:var(--hb-ink);font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.empty-actions{grid-column:1/-1;border:1px dashed #CBD5E1;border-radius:13px;padding:13px;color:var(--hb-muted);font-size:13px;font-weight:600;text-align:center}.empty-state{grid-column:1/-1;border:1px dashed #CBD5E1;border-radius:20px;background:#fff;padding:34px;text-align:center;color:var(--hb-muted);font-weight:600}.empty-state ha-icon{--mdc-icon-size:48px;color:var(--hb-blue);opacity:.55}.empty-state h2{color:var(--hb-ink);margin:10px 0 6px}
      .charger-hero-visual.image-strip{width:310px;height:130px;gap:10px;padding:10px;box-sizing:border-box;overflow:hidden}.charger-hero-visual.image-strip img{max-width:92px;max-height:106px;object-fit:contain;filter:drop-shadow(0 18px 22px rgba(15,35,80,.16))}.premium-image-hero{min-height:226px;grid-template-columns:1fr;grid-template-rows:142px auto;padding:14px;background:linear-gradient(135deg,#FFFFFF 0%,#F8FBFF 48%,#EEF5FF 100%)}.premium-image-hero .charger-visual{height:142px;width:100%;background:linear-gradient(135deg,rgba(238,245,255,.95),rgba(255,255,255,.72));border:1px solid rgba(20,103,245,.10)}.premium-image-hero .charger-visual img{max-width:150px;max-height:132px}.premium-image-hero .charger-head{grid-template-columns:44px minmax(0,1fr) auto}.premium-image-hero .charger-icon{width:44px;height:44px;border-radius:15px}.premium-image-hero .status{align-self:center}.charger-visual.ok:after{content:"";position:absolute;top:14px;right:16px;width:34px;height:6px;border-radius:999px;background:#37D67A;box-shadow:0 0 16px rgba(55,214,122,.35)}.charger-visual.warn:after{content:"";position:absolute;top:14px;right:16px;width:34px;height:6px;border-radius:999px;background:#F8B84E}.charger-visual.bad:after{content:"";position:absolute;top:14px;right:16px;width:34px;height:6px;border-radius:999px;background:#F04438}
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
.status-strip.dashboard-status-strip .metric b,.status-strip.ops-status-strip .metric b{display:block;font-size:16px;font-weight:600;color:#071327;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
@media(max-width:760px){.status-strip.dashboard-status-strip,.status-strip.ops-status-strip{grid-template-columns:1fr;max-width:100%}.status-strip.dashboard-status-strip .metric,.status-strip.ops-status-strip .metric{border-right:0;border-bottom:1px solid #E6ECF5}.status-strip.dashboard-status-strip .metric:last-child,.status-strip.ops-status-strip .metric:last-child{border-bottom:0}}
${hbMobilitySharedShellStyles()}
@media(max-width:900px){.page{padding:14px}.hero{grid-template-columns:1fr;padding:22px}.hero-side{grid-template-columns:1fr}.hero .charger-hero-visual{display:none}.hero-metrics{grid-template-columns:repeat(3,1fr)}h1{font-size:36px}.grid{grid-template-columns:1fr}.charger-hero-card{grid-template-columns:1fr}.charger-kpis{grid-template-columns:1fr}.charger-head{grid-template-columns:44px minmax(0,1fr);}.status{grid-column:1/-1;justify-self:start}.command-row{grid-template-columns:1fr 1fr}}
      @media(max-width:520px){.hero-metrics{grid-template-columns:1fr}.charger-hero-card{grid-template-columns:1fr}.charger-visual{height:120px}.command-row{grid-template-columns:1fr}.detail-grid{grid-template-columns:1fr}}


      /* R22.10.3 operations aligned with main dashboard */
      .title{position:relative;padding:6px 0 0}.title .eyebrow{font-size:12px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--hb-blue);margin-bottom:6px}.title h1{font-size:42px;line-height:1;letter-spacing:-.055em;margin:0 0 8px;font-weight:650}.title p{font-size:14px;color:#06142D;font-weight:600;max-width:780px}.top-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.summary{min-height:76px;border:1px solid var(--hb-line);border-radius:20px;background:#fff;box-shadow:var(--hb-shadow);padding:14px 18px;display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center}.summary.attention{border-color:#FFD8A8}.summary.recommendation{border-color:#C9DEFF}.summary-icon{width:44px;height:44px;border-radius:16px;background:#FFF1D9;display:flex;align-items:center;justify-content:center}.summary-icon.blue{background:#1467F5;color:white}.summary-icon ha-icon{color:#F39A1B}.summary-icon.blue ha-icon{color:white}.summary h3{margin:0 0 6px;font-size:16px;font-weight:650}.summary ul{margin:0;padding:0;list-style:none}.summary li{display:flex;gap:14px;font-size:12px;color:#34405A;font-weight:600}.section-title{display:flex;align-items:center;justify-content:space-between;margin-top:4px}.section-title h2{margin:0;font-size:20px;font-weight:650}.section-title span{font-size:12px;color:#66728B;border:1px solid var(--hb-line);border-radius:999px;padding:4px 10px;background:#fff;font-weight:650}.bottom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.info{background:#fff;border:1px solid var(--hb-line);border-radius:18px;box-shadow:0 14px 34px rgba(15,35,80,.055);padding:14px 16px;min-height:82px}.info h3{display:flex;align-items:center;gap:8px;font-size:15px;margin:0 0 8px}.info h3 ha-icon{color:#1467F5}.info p{font-size:12px;font-weight:600;color:#34405A}@media(max-width:860px){.top-grid,.bottom-grid{grid-template-columns:1fr}}
      /* R22.10.3 charge speed restore: compact, contract-driven, no min/max helper text. */
      .charge-mini-strip.mock-controls{display:flex;align-items:stretch;gap:8px;height:42px;overflow:hidden;min-width:0;grid-template-columns:none}
      .charger-select{flex:1 1 230px;min-width:170px}
      .mode-select{flex:0 1 132px;min-width:112px}
      .mini-current-stepper.compact-current{flex:0 0 156px;display:grid;grid-template-columns:minmax(56px,1fr) 32px 32px;align-items:center;gap:6px;padding:0 8px;background:#fff;border:1px solid var(--hb-line);border-radius:12px;box-shadow:none;min-width:0;height:42px;min-height:42px}
      .mini-current-stepper.compact-current .current-copy{display:flex;flex-direction:column;justify-content:center;min-width:0;line-height:1.05;overflow:hidden}
      .mini-current-stepper.compact-current small{display:block;font-size:9px;font-weight:500;color:#6A768D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:none;letter-spacing:0;margin:0}
      .mini-current-stepper.compact-current strong{font-size:13px;font-weight:600;color:#06142D;white-space:nowrap;line-height:1.15;margin-top:2px}
      .mini-current-stepper.compact-current.readonly{grid-template-columns:minmax(56px,1fr);flex-basis:112px}
      .mini-current-stepper.compact-current .round-step{width:30px;height:30px;min-width:30px;border-radius:12px;background:#fff;border:1px solid var(--hb-line);color:#1467F5;font-size:18px;font-weight:500;box-shadow:none;padding:0;display:flex;align-items:center;justify-content:center}
      .mini-power-read{display:none}
      .vehicle-actions.clean-actions{grid-template-columns:minmax(142px,1.05fr) minmax(130px,1fr) minmax(110px,.85fr) 1fr 42px 42px;align-items:center}
      .vehicle-actions.clean-actions .presence-toggle.icon-only,.vehicle-actions.clean-actions .details-action.icon-only{justify-self:end;background:#fff;color:#1467F5;border-color:var(--hb-line)}
      .vehicle-actions.clean-actions .presence-toggle.icon-only ha-icon,.vehicle-actions.clean-actions .details-action.icon-only ha-icon{color:#1467F5}
      @media(max-width:880px){.charge-mini-strip.mock-controls{height:auto;flex-wrap:wrap}.mini-current-stepper.compact-current{flex:1 1 150px}.vehicle-actions.clean-actions{grid-template-columns:1fr 1fr 1fr 42px 42px}.action-spacer{display:none}}

      /* rc.27 shared visual-library management + mobile density. */
      .appearance-write-error{display:flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:10px;font-weight:600}.appearance-write-error ha-icon{--mdc-icon-size:16px}
      .charger-appearance-action{height:34px;border-radius:10px;border:1px solid rgba(14,35,72,.10);background:#fff;color:#1467F5;display:inline-flex;align-items:center;gap:6px;padding:0 10px;font-size:11px;font-weight:600;cursor:pointer;grid-column:2/4;justify-self:start}
      .charger-appearance-action ha-icon{--mdc-icon-size:16px}
      .charger-picker-panel{margin:0 12px 10px;padding:12px 14px;border:1px solid #cfe0f6;border-radius:14px;background:linear-gradient(135deg,#fbfdff,#f3f8ff);box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
      .charger-picker-panel .vehicle-picker-grid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;align-items:end;margin-top:10px}
      .charger-picker-panel .vehicle-picker-hierarchy .vehicle-picker-key{grid-column:1/4}
      .charger-picker-panel .vehicle-picker-hierarchy .vehicle-picker-save{grid-column:4}
      .charger-picker-panel .vehicle-picker-head{display:flex;justify-content:space-between;gap:14px;align-items:start}
      .charger-picker-panel .vehicle-picker-head small{font-size:8.5px;letter-spacing:.13em;color:#64748b;font-weight:750}
      .charger-picker-panel .vehicle-picker-head h3{margin:2px 0 2px;font-size:15px;color:#0f172a}
      .charger-picker-panel .vehicle-picker-head p{margin:0;font-size:9.5px;color:#64748b}
      .charger-picker-panel label,.charger-picker-panel .vehicle-picker-key{display:flex;flex-direction:column;gap:4px}
      .charger-picker-panel label>span,.charger-picker-panel .vehicle-picker-key>span{font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
      .charger-picker-panel select{height:34px;border:1px solid #d7e2ef;border-radius:8px;background:#fff;color:#0f172a;padding:0 8px;font-size:10.5px;font-weight:600}
      .charger-picker-panel code{height:34px;display:flex;align-items:center;border:1px solid #d7e2ef;border-radius:8px;background:#fff;padding:0 8px;font-size:8.5px;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .charger-picker-panel .vehicle-picker-save{height:34px;border:1px solid #0b65ea;border-radius:8px;background:#0b65ea;color:#fff;padding:0 11px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:10px;font-weight:700}
      .charger-picker-panel .vehicle-picker-close{width:30px;height:30px;border:1px solid #dbe5f0;border-radius:8px;background:#fff;color:#64748b}
      .charger-picker-panel .vehicle-picker-gap{grid-column:1/-1;margin-top:8px;font-size:9.5px;color:#9a5a16;display:flex;gap:6px;align-items:center}
      @media(max-width:900px){.charger-picker-panel .vehicle-picker-grid{grid-template-columns:1fr 1fr}.charger-picker-panel .vehicle-picker-hierarchy .vehicle-picker-key{grid-column:1/-1}.charger-picker-panel .vehicle-picker-hierarchy .vehicle-picker-save{grid-column:auto}}
      @media(max-width:560px){
        .page{padding:8px 8px 18px;gap:8px}
        .charger-card{padding:10px;gap:8px;border-radius:16px}
        .charger-hero-card{grid-template-columns:minmax(0,1fr) 96px;min-height:116px;padding:10px;border-radius:14px}
        .charger-visual{height:96px}.charger-visual img{max-width:90px;max-height:90px}
        .charger-head{grid-template-columns:38px minmax(0,1fr) auto;gap:8px}
        .charger-icon{width:38px;height:38px;border-radius:12px}
        .charger-title h3{font-size:15px}.charger-title p{font-size:10px}
        .charger-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        .soft-line{gap:6px;flex-wrap:wrap}
        .charger-appearance-action{grid-column:2/4;height:32px;padding:0 8px}
        .grid{grid-template-columns:1fr;gap:10px}
      }

      /* rc.58 charger icon hierarchy and compact operational layout. */
      .charger-head{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;gap:6px 10px;align-items:center;min-width:0}
      .charger-head .charger-title{grid-column:1;grid-row:1;min-width:0}
      .charger-head>.status{grid-column:2;grid-row:1;justify-self:end}
      .charger-head>.charger-appearance-action{grid-column:1/-1;grid-row:2;justify-self:start}
      .charger-icon{display:none}
      .charger-title h3{font-size:17px;font-weight:600}
      .charger-title p{font-size:11px;font-weight:450;color:#66728B}
      .charger-kpis{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
      .field{min-height:52px;padding:8px 10px;border-radius:11px;background:#fff}
      .field ha-icon{--mdc-icon-size:19px;color:#355D96}
      .field span{font-size:10px;font-weight:500}
      .field b{font-size:13px;font-weight:600}
      .charger-state-actions{align-items:center}
      .charger-state-actions>span:not(.soft-line-spacer){background:transparent;border:0;padding:5px 4px}
      .charger-state-actions ha-icon{--mdc-icon-size:18px;color:#355D96}
      .soft-line-spacer{flex:1 1 auto;border:0;background:transparent;padding:0}
      .mini-detail-link.labeled-action{width:auto;min-width:0;height:34px;padding:0 10px;border-radius:9px;gap:6px;font-size:11px;font-weight:550;color:#355D96;box-shadow:none}
      .mini-detail-link.labeled-action span{display:inline}
      .mini-detail-link.labeled-action ha-icon{--mdc-icon-size:17px;color:#355D96}
      .command-row{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:7px}
      .cmd{min-height:38px;border-radius:10px;box-shadow:none;font-weight:550}
      .cmd ha-icon{--mdc-icon-size:18px}
      .cmd:disabled{opacity:.62;color:#7A8699;background:#FAFBFC}
      @media(max-width:760px){
        .charger-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
        .soft-line-spacer{display:none}
        .charger-state-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
        .charger-state-actions .labeled-action{width:100%;justify-content:center}
      }

      /* R22.12.11.24 Energy typography alignment — charger maintenance. */
      :host{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
      *{}
      .title h1{font-size:34px;line-height:1.08;font-weight:650;letter-spacing:-.025em;}
      .title p{font-size:13px;font-weight:400;color:var(--hb-muted,#66728B);}
      .eyebrow{font-size:11px;font-weight:650;}
      .charger-name,.charger-mini-copy b{font-weight:600;}
      .card-title,.info h3,.section-title h2{font-weight:600;}
      .label,.subtext,.charger-mini-copy span{font-weight:500;color:var(--hb-muted,#66728B);}
      .value,strong{font-weight:650;}
      .action{font-weight:600;}
      /* rc.56 compact Chargers body — keep operational content, remove oversized visual stage. */
      .page{gap:9px;padding:12px 18px 24px}
      .hero{
        min-height:0;padding:14px 18px;border-radius:18px;
        box-shadow:0 8px 24px rgba(15,35,80,.045);gap:16px;
      }
      .hero h1{font-size:30px;margin-bottom:5px}
      .hero p{font-size:11.5px;line-height:1.35;font-weight:500}
      .hero-metrics{grid-template-columns:repeat(3,96px);gap:6px}
      .hero-metrics div{padding:8px;border-radius:11px;box-shadow:none}
      .hero-metrics b{font-size:20px}.hero-metrics span{font-size:9.5px}
      .grid{display:grid;grid-template-columns:1fr;gap:10px}
      .charger-card{
        padding:10px;gap:8px;border-radius:16px;
        box-shadow:0 8px 24px rgba(15,35,80,.045);border-color:#e2e8f0;
      }
      .charger-card .premium-image-hero{
        display:grid;grid-template-columns:210px minmax(0,1fr);grid-template-rows:1fr;
        min-height:126px;height:126px;gap:12px;padding:8px 11px;
        border-radius:13px;align-items:center;overflow:hidden;
        background:linear-gradient(135deg,#fff 0%,#f8fbff 68%,#eef5ff 100%);
      }
      .charger-card .premium-image-hero .charger-visual{
        position:relative;width:100%;height:108px;min-height:108px;
        display:grid;place-items:center;border:0;border-radius:11px;
        background:rgba(255,255,255,.52);overflow:hidden;
      }
      .charger-card .premium-image-hero .charger-visual img{
        display:block;width:100%;height:100%;max-width:118px;max-height:102px;
        object-fit:contain;object-position:center;transform:none;
      }
      .charger-card .premium-image-hero .charger-visual-fallback{position:absolute;inset:0;display:none;place-items:center}.charger-card .premium-image-hero .charger-visual.image-missing .charger-visual-fallback{display:grid}.charger-card .premium-image-hero .charger-visual:not(.image-missing) .charger-visual-fallback{display:none}
      .charger-card .premium-image-hero .charger-head{
        display:grid;grid-template-columns:minmax(0,1fr) auto;
        grid-template-rows:auto auto;align-items:center;gap:6px 9px;min-width:0;
      }
      .charger-card .premium-image-hero .charger-icon{display:none}
      .charger-card .premium-image-hero .charger-title{grid-column:1;grid-row:1;min-width:0}
      .charger-card .charger-title h3{font-size:16px;line-height:1.1;margin:0 0 2px;white-space:normal;overflow-wrap:break-word;word-break:normal}
      .charger-card .charger-title p{font-size:10px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .charger-card .premium-image-hero .status{grid-column:2;grid-row:1;align-self:center;justify-self:end;font-size:10px;padding:5px 8px}
      .charger-card .charger-appearance-action{
        grid-column:1/3;grid-row:2;justify-self:start;
        height:31px;min-height:31px;border-radius:9px;padding:0 9px;font-size:10.5px;
      }
      .charger-card .charger-kpis{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
      .charger-card .field{padding:7px 8px;border-radius:10px;grid-template-columns:20px minmax(0,1fr);column-gap:6px}
      .charger-card .field ha-icon{--mdc-icon-size:17px}.charger-card .field span{font-size:9px}.charger-card .field b{font-size:12px}
      .charger-card .soft-line{padding-top:7px;gap:5px}
      .charger-card .soft-line span{padding:5px 7px;font-size:10.5px}
      .charger-card .command-row{gap:6px}.charger-card .cmd{min-height:38px;border-radius:10px;font-size:11px}
      .charger-card .fold-section{padding-top:6px}.charger-card .fold-toggle{font-size:11.5px}
      .charger-card .visual-picker-panel{margin:0}

      @media(max-width:900px){
        .page{padding:10px 12px 20px}
        .hero{grid-template-columns:1fr}
        .hero-side{justify-self:stretch;grid-template-columns:1fr auto}
        .hero .charger-hero-visual{display:none}
        .charger-card .premium-image-hero{grid-template-columns:170px minmax(0,1fr)}
        .charger-card .charger-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:620px){
        .page{padding:8px 8px 18px}
        .hero{padding:12px}
        .hero h1{font-size:24px}
        .hero-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}
        .charger-card{padding:8px;gap:7px}
        .charger-card .premium-image-hero{
          grid-template-columns:112px minmax(0,1fr);height:106px;min-height:106px;
          padding:7px 8px;gap:8px;
        }
        .charger-card .premium-image-hero .charger-visual{height:92px;min-height:92px}
        .charger-card .premium-image-hero .charger-visual img{max-width:88px;max-height:86px}
        .charger-card .premium-image-hero .charger-head{grid-template-columns:minmax(0,1fr) auto;gap:4px 7px}
        .charger-card .premium-image-hero .charger-icon{width:34px;height:34px;border-radius:10px}
        .charger-card .charger-title h3{font-size:14px}
        .charger-card .charger-title p{font-size:9px}
        .charger-card .premium-image-hero .status{font-size:9px;padding:4px 6px}
        .charger-card .charger-appearance-action{height:29px;min-height:29px;font-size:9.5px;padding:0 7px}
        .charger-card .charger-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
        .charger-card .soft-line{flex-wrap:wrap}
        .charger-card .command-row{grid-template-columns:1fr 1fr}
      }
      @media(max-width:410px){
        .charger-card .premium-image-hero{grid-template-columns:96px minmax(0,1fr)}
        .charger-card .premium-image-hero .charger-visual img{max-width:78px}
        .charger-card .command-row{grid-template-columns:1fr}
      }

      /* Canonical management identity card. New class names deliberately isolate this
         product surface from accumulated legacy premium-image-hero/header overrides. */
      .lifecycle-control-wrap{display:grid;gap:2px;align-items:center;min-width:0}.lifecycle-control-wrap>.lifecycle-toggle{width:100%}.lifecycle-disabled-reason{display:block;max-width:180px;font-size:8px;line-height:1.1;color:#8A5A12;font-weight:550;white-space:normal}
      .charger-card .charger-identity-card{
        display:grid;grid-template-columns:minmax(0,1fr) 160px;
        min-height:120px;gap:14px;padding:10px 12px;
        align-items:center;box-sizing:border-box;overflow:hidden;
        border:1px solid rgba(20,103,245,.10);border-radius:13px;
        background:linear-gradient(135deg,#fff 0%,#f8fbff 68%,#eef5ff 100%);
      }
      .charger-card .charger-identity-card>.charger-visual{
        position:relative;inset:auto;width:100%;height:104px;
        min-height:104px;max-height:104px;display:grid;place-items:center;
        overflow:hidden;border:0;border-radius:11px;background:rgba(255,255,255,.56);
      }
      .charger-card .charger-identity-card>.charger-visual img{
        position:static;inset:auto;display:block;width:100%;height:100%;
        max-width:132px;max-height:98px;object-fit:contain;object-position:center;
        transform:none;margin:auto;
      }
      .charger-card .charger-identity-copy{min-width:0;display:grid;gap:8px;align-content:center}
      .charger-card .charger-identity-top{
        display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;
        align-items:start;min-width:0;
      }
      .charger-card .charger-identity-card .charger-title{min-width:0;max-width:100%}
      .charger-card .charger-identity-card .charger-title h3{
        margin:0 0 3px;font-size:16px;line-height:1.15;font-weight:600;
        white-space:normal;overflow:visible;text-overflow:clip;
        overflow-wrap:normal;word-break:normal;hyphens:none;
      }
      .charger-card .charger-identity-card .charger-title p{
        margin:2px 0 0;font-size:10.5px;line-height:1.25;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;
      }
      .charger-card .charger-identity-card .status{
        justify-self:end;align-self:start;white-space:nowrap;font-size:10px;padding:5px 8px;
      }
      .charger-card .charger-identity-card .charger-appearance-action{
        position:static;grid-column:auto;grid-row:auto;justify-self:start;
        height:31px;min-height:31px;margin:0;padding:0 9px;font-size:10.5px;
      }
      @media(max-width:760px){
        .charger-card .charger-identity-card{grid-template-columns:minmax(0,1fr) 118px;gap:10px}
        .charger-card .charger-identity-card>.charger-visual{height:92px;min-height:92px;max-height:92px}
        .charger-card .charger-identity-card>.charger-visual img{max-width:108px;max-height:86px}
      }
      @media(max-width:430px){
        .charger-card .charger-identity-card{grid-template-columns:minmax(0,1fr) 94px;padding:8px;gap:8px}
        .charger-card .charger-identity-card>.charger-visual{height:80px;min-height:80px;max-height:80px}
        .charger-card .charger-identity-card>.charger-visual img{max-width:86px;max-height:74px}
        .charger-card .charger-identity-card .charger-title h3{font-size:14px}
        .charger-card .charger-identity-card .charger-title p{font-size:9.5px}
      }

    `;
  }

  getCardSize(){ return 10; }
}

if (!customElements.get("homebrain-mobility-charger-maintenance-card")) {
  customElements.define("homebrain-mobility-charger-maintenance-card", HomeBrainMobilityChargerMaintenanceCard);
}
window.customCards.push({
  type: "homebrain-mobility-charger-maintenance-card",
  name: "Home Brain Mobility Charger Maintenance Card",
  description: "Premium responsive operational view for all Mobility chargers."
});



/**
 * Home Brain Mobility Dashboard Card — 2.2.2
 *
 * Adds consistent charging visibility and charger restart/startup guards.
 * This replaces the legacy Lovelace/button-card dashboard composition. The YAML now
 * only mounts this custom element. The card consumes the canonical registry and
 * runtime contracts, then renders the premium Mobility product dashboard from the
 * bundled JavaScript.
 */
