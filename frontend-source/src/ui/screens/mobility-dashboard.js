// 90-mobility-dashboard-card.js
// Mobility dashboard and vehicle overview custom card.

class HomeBrainMobilityDashboardCard extends HTMLElement {
  setConfig(config) {
    this.config = { dashboard_path: "/mobility-supervisor/dashboard", ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._sent = this._sent || new Map();
    this._selectedChargers = this._selectedChargers || new Map();
    this._currentOverrides = this._currentOverrides || new Map();
    this._vehicleFilter = this._vehicleFilter || "all";
    this._vehicleSort = this._vehicleSort || "default";
    this._vehiclePickerAsset = this._vehiclePickerAsset || "";
    this._vehiclePickerDraft = this._vehiclePickerDraft || new Map();
    this._vehiclePendingAppearance = this._vehiclePendingAppearance || new Map();
    this._vehicleAppearanceError = this._vehicleAppearanceError || new Map();
    this._lastDashboardRenderAt = this._lastDashboardRenderAt || 0;
    this._lastSignature = this._lastSignature || "";
    this._lastRevisionSignature = this._lastRevisionSignature || "";
    if (!this._viewPositionBound) {
      this._viewPositionListener = ()=>this.rememberViewPosition();
      window.addEventListener("pagehide", this._viewPositionListener);
      this._viewPositionBound = true;
    }
  }

  disconnectedCallback() {
    if (this._viewPositionBound && this._viewPositionListener) {
      window.removeEventListener("pagehide", this._viewPositionListener);
      this._viewPositionBound = false;
    }
  }

  assetId(asset) { return asset?.asset_id || ""; }
  vehicleId(asset) { return String(this.assetId(asset)).replace(/^vehicle_/, ""); }
  chargerId(assetOrId) { return String(assetOrId?.asset_id || assetOrId || "").replace(/^charger_/, ""); }

  pendingVehicleAppearance(rt, asset) {
    const assetId = this.assetId(asset);
    const pending = this._vehiclePendingAppearance.get(assetId) || null;
    if (!pending) return null;
    const projection = new HomeBrainVehicleAdapter(rt, this.vehicleId(asset), { ...this.config, registry_entry:asset }).productProjection();
    const canonical = String(projection?.identity?.image_key || "").trim();
    if (canonical && canonical === pending.key) {
      this._vehiclePendingAppearance.delete(assetId);
      this._vehicleAppearanceError.delete(assetId);
      return null;
    }
    return pending;
  }

  failVehicleAppearance(assetId, message = "Appearance update was not confirmed by Mobility.") {
    this._vehiclePendingAppearance.delete(assetId);
    this._vehicleAppearanceError.set(assetId, message);
    this._forceRender = true;
    this._holdRenderUntil = 0;
    this._lastSignature = "";
    if (this._hass) this.hass = this._hass;
  }

  /** Centralized charger image resolver.
   * Priority: profile/type words -> asset_id -> default. Keep this in one place
   * so Dashboard, Vehicle cards and Charger Maintenance remain visually aligned.
   */
  chargerImage(assetOrId) {
    const rt = this.rt || null;
    const asset = typeof assetOrId === "object"
      ? assetOrId
      : (rt && typeof rt.chargerById === "function" ? (rt.chargerById(assetOrId) || rt.assetById(assetOrId) || { asset_id: assetOrId }) : { asset_id: assetOrId });
    if (rt) {
      const adapter = new HomeBrainChargerAdapter(rt, this.chargerId(asset), { ...this.config, registry_entry:asset });
      const packageFile = adapter.chargerImageFromId();
      if (packageFile) return packageFile;
    }
    return rhiMobilityAssetUrl("chargers/charger_fallback.png");
  }

  chargerImageFromId(id) { return this.chargerImage(id); }

  displaySubtitle(asset, model = null) {
    const profile = String(asset?.profile || model?.subtitle || "").trim();
    return profile || model?.subtitle || asset?.asset_type || "Vehicle";
  }

  isGood(value) {
    const s = String(value || "").toLowerCase();
    return ["ready","on track","secure","trusted","complete","fresh","ok","comfort ready","charging","connected"].some((w)=>s.includes(w));
  }
  isBad(value) {
    const s = String(value || "").toLowerCase();
    return ["attention","degraded","failed","critical","issue","unsafe","unlocked","stale","not connected","open","blocked"].some((w)=>s.includes(w));
  }
  tone(value) {
    const s = String(value || "").toLowerCase();
    if (this.isGood(s)) return "ok";
    if (s.includes("charging") || s.includes("heating") || s.includes("waiting")) return "warn";
    if (this.isBad(s)) return "bad";
    return "muted";
  }

  commandState(rt, command) {
    // One command state model across overview and detail screens.
    return rt.commandState ? rt.commandState(command) : { disabled: !command, busy:false, failed:false, status:"", reason:"" };
  }

  completeCommandIntent(rt, command, assetId = "") {
    // R22.10.3 hotfix: Previous release called this helper but did not ship it.
    // Keep this function deliberately small: complete metadata that is already
    // discovered from the backend command contract, but never synthesize new
    // commands or hardcode known vehicle/charger identities.
    if (!command) return null;
    const completed = { ...command };
    const canonical = assetId ? rt.canonicalAssetId(assetId) : (completed.asset_id || "");
    if (!completed.asset_id && canonical) completed.asset_id = canonical;
    if (!completed.parameter_schema && typeof completed.parameter_schema_json === "string" && completed.parameter_schema_json.trim()) {
      const parsed = rt.parseJsonValue(completed.parameter_schema_json, null);
      if (parsed && typeof parsed === "object") completed.parameter_schema = parsed;
    }
    return completed;
  }

  selectCommand(rt, assetId, ids) {
    return rt.selectCommand(assetId, ids);
  }

  commandUsable(rt, command) {
    return rt.commandUsable(command);
  }

  chooseFirstUsable(rt, commands) {
    const list = (commands || []).filter(Boolean);
    return list.find((command) => this.commandUsable(rt, command)) || list[0] || null;
  }

  commandsByCategory(rt, assetId, categories) {
    const wanted = categories.map((c)=>String(c).toLowerCase());
    return rt.commandRegistry(assetId)
      .filter((c)=>c.frontend_allowed !== false)
      .filter((c)=>wanted.includes(String(c.category || "secondary").toLowerCase()));
  }

  commandKey(command) {
    return `${command?.asset_id || ""}::${command?.command_id || command?.command_key || ""}`;
  }

  renderCommand(rt, command, label, icon, extraClass = "") {
    const buttonLabel = command?.label || label;
    if (!command) return `<button class="action ${extraClass}" disabled><ha-icon icon="${icon}"></ha-icon><span>${rt.escape(buttonLabel)}</span></button>`;
    const completed = this.completeCommandIntent(rt, command, command.asset_id || "") || command;
    const st = this.commandState(rt, completed);
    const title = st.reason || st.status || "";
    const enums = completed?.enum_options || {};
    const requiredEnum = (completed.required_parameters || []).find((name) => Array.isArray(enums[name]) && enums[name].length);
    if (completed.interaction_mode === "form" && requiredEnum) {
      return `<label class="action enum-action ${extraClass} ${st.disabled ? "is-disabled" : ""}" title="${rt.escape(title)}"><ha-icon icon="${icon}"></ha-icon><select aria-label="${rt.escape(buttonLabel)}" data-command-asset="${rt.escape(completed.asset_id || "")}" data-command-id="${rt.escape(completed.command_id || "")}" data-command-key="${rt.escape(completed.command_key || completed.command_id || "")}" data-command-param="${rt.escape(requiredEnum)}" ${st.disabled ? "disabled" : ""}><option value="">${rt.escape(buttonLabel)}…</option>${enums[requiredEnum].map((option)=>`<option value="${rt.escape(option.value)}">${rt.escape(option.label || option.value)}</option>`).join("")}</select></label>`;
    }
    const backendSent = String(st.status || "").toLowerCase() === "sent";
    const cls = st.busy ? "busy" : st.failed ? "failed" : backendSent ? "sent-ack" : "";
    return `<button class="action ${extraClass} ${cls}" data-asset-id="${rt.escape(completed.asset_id || "")}" data-command-id="${rt.escape(completed.command_id || "")}" data-command-key="${rt.escape(completed.command_key || completed.command_id || "")}" ${st.disabled ? "disabled" : ""} title="${rt.escape(title)}"><ha-icon icon="${icon}"></ha-icon><span>${rt.escape(buttonLabel)}</span></button>`;
  }


  sourceUnavailable(rt, assetId) {
    // UX must not construct raw/source status entities. Backend contract health is exposed through runtime health gates.
    return false;
  }

  fmtKw(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    const locale = this._hass?.locale?.language || "en";
    return `${rhiUxFormatNumber(value,{locale,maximumFractionDigits:2})} kW`;
  }

  fmtAmp(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    const n = Number(value);
    return `${Number.isInteger(n) ? n : n.toFixed(1)} A`;
  }

  metricWithUnit(rt, value, unit = "", propertyKey = "") {
    const raw = String(value ?? "").trim();
    if (!raw || ["—", "Unknown", "Not available", "Unavailable"].includes(raw)) return raw || "—";
    return rt.formatValue(raw, unit, propertyKey);
  }



  resolveEffectiveCharger(rt, vehicleAsset, chargers) {
    const assetId = this.assetId(vehicleAsset);
    const model = new HomeBrainVehicleAdapter(rt, this.vehicleId(vehicleAsset), { ...this.config, registry_entry:vehicleAsset }).build();
    const chargerId = String(model?.projection?.relationships?.effective_charger_id || "").trim();
    if (!chargerId) return null;
    return rt.chargerById(chargerId) || chargers.find((c)=>String(c.asset_id || "") === chargerId) || null;
  }

  vehicleChargingInfo(rt, vehicleAsset) {
    const model = new HomeBrainVehicleAdapter(rt, this.vehicleId(vehicleAsset), { ...this.config, registry_entry:vehicleAsset }).build();
    return model?.projection?.facts?.live_charging || { active:false, status:"Unknown", power:null, detail:"Charging context unavailable." };
  }

  chargingContext(rt, vehicleAsset, chargers = []) {
    const assetId = this.assetId(vehicleAsset);
    const model = new HomeBrainVehicleAdapter(rt, this.vehicleId(vehicleAsset), { ...this.config, registry_entry:vehicleAsset }).build();
    const projection = model?.projection || {};
    const assignedId = String(projection?.relationships?.effective_charger_id || "").trim();
    const assigned = assignedId ? (rt.chargerById(assignedId) || chargers.find((c)=>String(c.asset_id || "") === assignedId) || null) : null;
    const info = projection?.facts?.live_charging || { active:false, status:"Unknown", power:null, detail:"Charging context unavailable." };
    const limit = projection?.configuration?.charge_power_control || { value:null, display:"—", entity:"", intent:"", visible:false, executable:false, property:null };
    return { assetId, assigned, info, limit, currentEntity:limit?.entity || "", projection };
  }

  commandIcon(command) {
    const id = String(command?.command_id || "").toLowerCase();
    if (id.includes("restart") || id.includes("reboot") || id.includes("reset")) return "mdi:restart";
    if (id.includes("identify") || id.includes("locate")) return "mdi:crosshairs-gps";
    if (id.includes("stop") || id.includes("pause")) return "mdi:stop";
    if (id.includes("start") || id.includes("charge") || id.includes("resume")) return "mdi:lightning-bolt";
    if (id.includes("climate") || id.includes("heat") || id.includes("precondition")) return "mdi:fan";
    if (id.includes("unlock")) return "mdi:lock-open-outline";
    if (id.includes("lock")) return "mdi:lock-outline";
    if (id.includes("present") || id.includes("active")) return "mdi:power";
    if (id.includes("profile")) return "mdi:card-account-details-outline";
    if (id.includes("selected_charger") || id.includes("charger")) return "mdi:ev-station";
    if (id.includes("target_soc")) return "mdi:battery-charging-80";
    if (id.includes("ready_by")) return "mdi:clock-outline";
    return "mdi:gesture-tap-button";
  }

  dashboardVehicleCommands(rt, assetId, context = {}) {
    const asset = context?.asset || rt.vehicleById(assetId) || rt.assetById(assetId) || { asset_id:assetId, asset_type:"vehicle" };
    const model = new HomeBrainVehicleAdapter(rt, this.vehicleId(asset), { ...this.config, registry_entry:asset }).build();
    return model?.projection?.commands || [];
  }

  lifecycleDisplay(rt, asset) {
    const status = rt.lifecycleStatus(asset);
    if (status === "active") return rt.t("state.active",{},"Active");
    if (status === "disabled") return rt.t("state.disabled",{},"Disabled");
    if (status === "retired") return rt.t("state.retired",{},"Retired");
    return rt.t("common.not_available",{},"Not available");
  }

  lifecycleToggleButton(rt, asset, extraClass = "presence-toggle icon-only") {
    const status = rt.lifecycleStatus(asset);
    const desired = status === "disabled" ? "active" : "disabled";
    const model = rt.lifecycleWriteModel(asset, desired);
    const label = desired === "active" ? rt.t("action.activate",{},"Activate") : rt.t("action.disable",{},"Disable");
    const title = model.disabled ? rt.t("state.status_change_unavailable",{},"Status cannot be changed right now") : label;
    const button = `<button class="action mobility-lifecycle-action ${extraClass}" data-lifecycle-asset="${rt.escape(this.assetId(asset))}" data-lifecycle-value="${rt.escape(desired)}" ${model.disabled ? "disabled" : ""} title="${rt.escape(title)}"><ha-icon icon="mdi:power"></ha-icon><span>${rt.escape(label)}</span></button>`;
    return model.disabled && extraClass.includes("manage-lifecycle") ? `<span class="lifecycle-control-wrap">${button}<small class="lifecycle-disabled-reason">${rt.escape(title)}</small></span>` : button;
  }

  chargingActivityDisplay(rt, asset) {
    const model = new HomeBrainVehicleAdapter(rt, this.vehicleId(asset), { ...this.config, registry_entry:asset }).build();
    const charging = model?.projection?.signals?.charging;
    if (!charging) return rt.t("common.unavailable",{},"Unavailable");
    const value = String(charging.display || charging.value || "Unavailable");
    const reason = String(charging.reason || "").trim();
    return reason && reason !== value ? `${value} · ${reason}` : value;
  }

  renderChargerAssignmentSelect(rt, vehicleAsset) {
    const assetId = this.assetId(vehicleAsset);
    const adapter = new HomeBrainVehicleAdapter(rt, this.vehicleId(vehicleAsset), { ...this.config, registry_entry: vehicleAsset });
    const model = adapter.chargerAssignmentModel();
    if (!model.resolved) {
      return `<div class="mini-control charger-select readonly" title="Assignment unavailable because vehicle.selected_charger is not published"><ha-icon icon="mdi:ev-station"></ha-icon><span class="relationship-copy"><small>Assigned charger</small><strong>Unavailable</strong></span></div>`;
    }
    if (!model.writable) {
      return `<div class="mini-control charger-select readonly" title="Read-only selected charger from canonical vehicle property contract"><ha-icon icon="mdi:ev-station"></ha-icon><span class="relationship-copy"><small>Assigned charger</small><strong>${rt.escape(model.display)}</strong></span></div>`;
    }
    const current = String(model.editor_value ?? "");
    const currentKnown = model.choices.some((choice)=>choice.value === current);
    return `<div class="mini-control charger-select writable" title="Change assigned charger"><ha-icon icon="mdi:ev-station"></ha-icon><span class="relationship-copy"><small>Assigned charger · Change</small><select data-property-asset="${rt.escape(assetId)}" data-property-key="vehicle.selected_charger" aria-label="Change assigned charger">${current && !currentKnown ? `<option value="${rt.escape(current)}" selected disabled>${rt.escape(model.display || current)}</option>` : ""}${model.choices.map((choice)=>`<option value="${rt.escape(choice.value)}" ${choice.value === current ? "selected" : ""}>${rt.escape(choice.label)}</option>`).join("")}</select></span></div>`;
  }

  renderVehicleControlRow(rt, vehicleAsset, chargers) {
    const ctx = this.chargingContext(rt, vehicleAsset, chargers);
    const metricSlots = ctx.projection?.facts?.overview_metrics || [];
    const chargePowerModel = ctx.projection?.configuration?.charge_power_control_model || null;
    const limitValue = chargePowerModel?.resolved && Number.isFinite(Number(chargePowerModel.value)) ? Number(chargePowerModel.value) : null;
    const currentValue = limitValue === null ? "—" : (Number.isInteger(limitValue) ? String(limitValue) : Number(limitValue).toFixed(2).replace(/\.00$/, ""));
    const meta = {
      min: Number.isFinite(chargePowerModel?.min) ? chargePowerModel.min : 0,
      max: Number.isFinite(chargePowerModel?.max) ? chargePowerModel.max : 0,
      step: Number.isFinite(chargePowerModel?.step) ? chargePowerModel.step : 0
    };
    const canCurrent = !!(chargePowerModel?.resolved && chargePowerModel?.writable && meta.step > 0 && meta.max >= meta.min);
    const displayCurrent = currentValue === "—" ? "Unavailable" : `${currentValue} kW`;
    const requestedReason = String(chargePowerModel?.reason || (!chargePowerModel?.resolved ? "Requested charging power is not published for this vehicle." : (!chargePowerModel?.writable ? "Requested charging power is read-only." : ""))).replaceAll("_"," ");
    const atMin = canCurrent && limitValue !== null && limitValue <= meta.min + 0.000001;
    const atMax = canCurrent && limitValue !== null && limitValue >= meta.max - 0.000001;
    const currentControl = `
      <div class="mini-current-stepper compact-current ${canCurrent ? "" : "readonly"}" title="${rt.escape(requestedReason || "Requested vehicle charging power")}">
        <span class="current-copy"><small>Requested power</small><strong>${rt.escape(displayCurrent)}</strong>${!canCurrent && requestedReason ? `<em>${rt.escape(requestedReason)}</em>` : ""}</span>
        ${canCurrent ? `<button class="round-step" data-property-step="vehicle.requested_charge_power_kw" data-vehicle-asset="${rt.escape(ctx.assetId)}" data-charge-power-value="${rt.escape(limitValue ?? meta.min)}" data-delta="-${rt.escape(meta.step)}" data-min="${rt.escape(meta.min)}" data-max="${rt.escape(meta.max)}" data-unit="kW" ${atMin ? "disabled" : ""}>−</button>
        <button class="round-step" data-property-step="vehicle.requested_charge_power_kw" data-vehicle-asset="${rt.escape(ctx.assetId)}" data-charge-power-value="${rt.escape(limitValue ?? meta.min)}" data-delta="${rt.escape(meta.step)}" data-min="${rt.escape(meta.min)}" data-max="${rt.escape(meta.max)}" data-unit="kW" ${atMax ? "disabled" : ""}>+</button>` : ``}
      </div>`;
    const actualPowerNumber = Number(ctx.info?.power);
    const hasPhysicalCharger = !!ctx.info?.physical_charger;
    const actualKnown = hasPhysicalCharger && Number.isFinite(actualPowerNumber);
    const actualPowerDisplay = actualKnown ? `${Math.max(0, actualPowerNumber).toFixed(1).replace(/\.0$/, "")} kW` : (ctx.info?.active ? "Power not proven" : "—");
    const actualReason = actualKnown ? "Actual power from the physically connected charger." : (hasPhysicalCharger ? "Actual charger power is unavailable." : "Physical charger identity is not proven, so power is not attributed to this vehicle.");
    const actualPowerControl = `
      <div class="mini-power-read actual-power-read ${actualKnown ? "" : "readonly"}" title="${rt.escape(actualReason)}">
        <span class="power-copy"><small>Charging now</small><strong>${rt.escape(actualPowerDisplay)}</strong>${!actualKnown ? `<em>${rt.escape(actualReason)}</em>` : ""}</span>
      </div>`;
    return `<section class="vehicle-control-row mock-row" title="${rt.escape(ctx.info.detail)}">
      <div class="vehicle-metrics-strip mock-metrics">
        ${metricSlots.map((slot, index)=>`<div class="metric-chip ${index === 2 ? "battery-chip" : ""}" title="${rt.escape(slot.label || rt.t("common.not_available",{},"Not available"))}"><span>${rt.escape(slot.label)}</span><b>${rt.escape(slot.resolved ? slot.display : "—")}</b></div>`).join("")}
      </div>
      <div class="charge-mini-strip mock-controls has-speed no-mode">
        ${this.renderChargerAssignmentSelect(rt, vehicleAsset)}
        ${currentControl}
        ${actualPowerControl}
      </div>
    </section>`;
  }

  vehiclePresent(rt, asset) {
    return rt.lifecycleStatus(asset) === "active";
  }


  renderInactiveVehicle(rt, asset) {
    const factory = new HomeBrainAssetFactory(rt);
    const model = factory.adapterFor(asset, this.config)?.build?.() || null;
    const display = model?.display || asset.display_name || rt.vehicleLabel(asset.asset_id);
    const subtitle = model?.subtitle || asset.profile || "Vehicle";
    const route = rt.assetDetailRoute(asset);
    const lifecycleLabel = this.lifecycleDisplay(rt, asset);
    // Missing canonical lifecycle is a publication gap, never a disabled vehicle.
    const activateButton = rt.lifecycleStatus(asset)==="disabled"
      ? this.lifecycleToggleButton(rt, asset, "activate-soft manage-lifecycle") : "";
    // Identity artwork is still useful when the lifecycle is disabled: an
    // inactive fleet must remain recognizable instead of becoming a blank list.
    const image=String(model?.image || "");
    const photo=image ? `<img src="${rt.escape(rt.cache(image))}" alt="${rt.escape(display)}" loading="lazy" onerror="this.style.display='none'">` : `<ha-icon icon="mdi:car-off"></ha-icon>`;
    if (rt.lifecycleStatus(asset) === "disabled") {
      // Disabled is explicitly published; identity and Enable are the ONLY actions.
      return `<article class="inactive-row compact-present-row lifecycle-collapsed-row disabled-identity-only" style="grid-template-columns:64px minmax(0,1fr) auto">
        <span class="inactive-photo">${photo}</span><div class="inactive-copy"><h3>${rt.escape(display)}</h3></div>
        <div class="inactive-actions">${activateButton}</div>
      </article>`;
    }
    // Unknown lifecycle cannot be treated as disabled and must not offer Enable.
    return `<article class="inactive-row compact-present-row lifecycle-collapsed-row">
      <span class="inactive-state">${rt.escape(lifecycleLabel)}</span>
      <span class="inactive-photo">${photo}</span>
      <div class="inactive-copy"><h3>${rt.escape(display)}</h3><p>${rt.escape(subtitle)}</p></div>
      <div class="inactive-actions"><button class="action icon-only" data-nav="${rt.escape(route)}" title="Open details"><ha-icon icon="mdi:chevron-right"></ha-icon><span>Details</span></button></div>
    </article>`;
  }

  vehicleVisualSelection(rt, asset, draft = {}) {
    return new HomeBrainVehicleVisualPicker(rt).selection(asset, draft);
  }

  renderVehiclePicker(rt, asset) {
    const assetId = this.assetId(asset);
    const draft = this._vehiclePickerDraft.get(assetId) || {};
    return new HomeBrainVehicleVisualPicker(rt).render(asset, { draft, showClose:true, context:"management" });
  }

  renderVehicle(rt, asset, chargers) {
    const factory = new HomeBrainAssetFactory(rt);
    const adapter = factory.adapterFor(asset, this.config);
    const model = adapter?.build?.() || null;
    const id = this.vehicleId(asset);
    const assetId = this.assetId(asset);
    const display = model?.display || asset.display_name || rt.vehicleLabel(assetId);
    const subtitle = this.displaySubtitle(asset, model);
    const image = model?.image || "";
    const route = rt.assetDetailRoute(asset);
    const ctx = this.chargingContext(rt, asset, chargers);
    const relLabels = model?.projection?.relationships || {};
    const assignedName = relLabels.charger_display_name || ctx.assigned?.display_name || "No charger selected";
    const hasEffectiveCharger = !!String(relLabels.effective_charger_id || "").trim();
    const hasConnectedCharger = !!String(relLabels.physically_connected_charger_id || "").trim();
    const activeChargerId = String(relLabels.physically_connected_charger_id || relLabels.effective_charger_id || relLabels.configured_charger_id || ctx.assigned?.asset_id || "");
    const activeChargerAsset = activeChargerId ? (rt.chargerById(activeChargerId) || rt.assetById(activeChargerId) || { asset_id: activeChargerId, asset_type: "charger" }) : null;
    const activeChargerRoute = activeChargerAsset ? rt.assetDetailRoute(activeChargerAsset) : "";
    const chargerImage = activeChargerId ? this.chargerImage(activeChargerId) : rhiMobilityAssetUrl("chargers/charger_fallback.png");
    const notPresentButton = this.lifecycleToggleButton(rt, asset, "presence-toggle manage-lifecycle");
    const vehicleCommands = model?.projection?.commands || [];
    const chargingActivity = this.chargingActivityDisplay(rt, asset);
    const pickerOpen = this._vehiclePickerAsset === assetId;
    const pickerDraft = pickerOpen ? (this._vehiclePickerDraft.get(assetId) || {}) : {};
    const visual = this.vehicleVisualSelection(rt, asset, pickerDraft);
    const pendingAppearance = this.pendingVehicleAppearance(rt, asset);
    const visualFilter = pendingAppearance?.filter ?? visual?.color?.filter ?? "none";
    const visualImage = pendingAppearance?.image || visual?.vehicle?.package_file || image;
    const appearanceError = this._vehicleAppearanceError.get(assetId) || "";
    return `<article class="vehicle-card premium-vehicle-card">
      <div class="hero-split-row">
        <div class="vehicle-hero-panel">
          <div class="vehicle-copy"><h2>${rt.escape(display)}</h2><p>${rt.escape(subtitle)}</p><p class="vehicle-activity-inline">${rt.escape(chargingActivity)}</p></div>
          <div class="vehicle-image">${visualImage ? `<img src="${rt.escape(rt.cache(visualImage))}" alt="${rt.escape(display)}" style="filter:${rt.escape(visualFilter)}">` : `<ha-icon icon="mdi:car-estate"></ha-icon>`}</div>
          <button class="vehicle-visual-edit vehicle-appearance-action" data-vehicle-picker="${rt.escape(assetId)}" title="Choose vehicle and colour"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Vehicle & colour</span></button>
        </div>
        <div class="charger-hero-panel">
          <div class="charger-mini-copy"><b>${rt.escape(assignedName)}</b>${activeChargerRoute ? `<button class="charger-link-inline" data-nav="${rt.escape(activeChargerRoute)}" title="Open assigned charger details">Charger details <ha-icon icon="mdi:chevron-right"></ha-icon></button>` : ""}</div>
          <div class="charger-mini-image"><img src="${rt.escape(rt.cache(chargerImage))}" alt="${rt.escape(assignedName)}" loading="lazy" onerror="this.style.display='none';this.closest('.charger-mini-image')?.classList.add('image-missing')"><ha-icon icon="mdi:ev-station"></ha-icon></div>
        </div>
      </div>
      <div class="status-top-row vehicle-intelligence-strip">
        ${(Array.isArray(model?.status) ? model.status : []).slice(0, 5).map((tile) => this.intelligenceStatusRow(rt, tile)).join("")}
      </div>
      ${pickerOpen ? this.renderVehiclePicker(rt, asset) : ""}
      ${appearanceError ? `<div class="appearance-write-error" role="status"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${rt.escape(appearanceError)}</span></div>` : ""}
      ${this.renderVehicleControlRow(rt, asset, chargers)}
      <div class="vehicle-actions clean-actions">
        ${vehicleCommands.map((cmd, index)=>this.renderCommand(rt, cmd, cmd?.label || "Action", this.commandIcon(cmd), index === 0 ? "primary-charge" : "")).join("")}
        ${Array.from({length: Math.max(0, 3 - vehicleCommands.length)}).map(()=>`<span class="action-spacer"></span>`).join("")}
        ${notPresentButton || ""}
        <button class="vehicle-card-details mobility-detail-action" data-nav="${rt.escape(route)}" aria-label="Open details for ${rt.escape(display)}">Details <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
    </article>`;
  }

  overviewVehicleSignals(rt, assetId) {
    const asset = rt.vehicleById(assetId) || rt.assetById(assetId) || { asset_id:assetId, asset_type:"vehicle" };
    const model = new HomeBrainVehicleAdapter(rt, this.vehicleId(asset), { ...this.config, registry_entry:asset }).build();
    return model?.projection?.signals || {};
  }

  renderOverviewVehicleRow(rt, asset, chargers) {
    const factory = new HomeBrainAssetFactory(rt);
    const model = factory.adapterFor(asset, this.config)?.build?.() || null;
    const assetId = this.assetId(asset);
    const display = model?.display || asset.display_name || rt.vehicleLabel(assetId);
    const image = model?.image || "";
    const visual = this.vehicleVisualSelection(rt, asset);
    const visualFilter = visual?.color?.filter || "none";
    const route = rt.assetDetailRoute(asset);
    const signals = model?.projection?.signals || {};
    const charging = this.chargingActivityDisplay(rt, asset);
    const commands = (model?.projection?.commands || []).slice(0, 2);
    const signalValue = (tile, fallback = "—") => tile?.value && !String(tile.value).toLowerCase().includes("contract gap") ? tile.value : fallback;
    const signalTone = (tile) => {
      const tone = String(tile?.tone || "").toLowerCase();
      const value = String(tile?.value || "").toLowerCase();
      if (!tile || !value || ["unknown","unavailable","contract gap"].some((token)=>value.includes(token))) return "muted";
      return tone === "error" ? "bad" : tone === "attention" ? "warn" : tone === "active" ? "active" : "ok";
    };
    return `<article class="ov-vehicle-row">
      <button class="ov-vehicle-main" data-nav="${rt.escape(route)}" title="Open vehicle details">
        <span class="ov-vehicle-image">${image ? `<img src="${rt.escape(rt.cache(image))}" alt="${rt.escape(display)}" style="filter:${rt.escape(visualFilter)}">` : `<ha-icon icon="mdi:car-electric"></ha-icon>`}</span>
        <span class="ov-vehicle-copy"><b>${rt.escape(display)}</b><small>${rt.escape(signalValue(signals.energy))} · ${rt.escape(signalValue(signals.range))}</small></span>
      </button>
      <div class="ov-signal ${signalTone(signals.security)}" title="${rt.escape(signals.security?.subvalue || signals.security?.reason || "")}"><ha-icon icon="mdi:lock-outline"></ha-icon><span>Security</span><b>${rt.escape(signalValue(signals.security, "Unknown"))}</b></div>
      <div class="ov-signal" title="Published climate/comfort property"><ha-icon icon="mdi:fan"></ha-icon><span>Comfort</span><b>${rt.escape(signals.climate)}</b></div>
      <div class="ov-signal ${signalTone(signals.maintenance)}" title="${rt.escape(signals.maintenance?.subvalue || "")}"><ha-icon icon="mdi:wrench-outline"></ha-icon><span>Maintenance</span><b>${rt.escape(signalValue(signals.maintenance, "Unknown"))}</b></div>
      <div class="ov-charging-state"><ha-icon icon="mdi:lightning-bolt"></ha-icon><span>${rt.escape(charging)}</span></div>
      <div class="ov-assignment">${this.renderChargerAssignmentSelect(rt, asset)}</div>
      <div class="ov-row-actions">
        ${commands.map((cmd, index)=>this.renderCommand(rt, cmd, cmd?.label || "Action", this.commandIcon(cmd), index === 0 ? "primary-charge" : "")).join("")}
        <button class="action ov-detail" data-nav="${rt.escape(route)}" title="Open vehicle details">Details <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
    </article>`;
  }

  renderOverviewChargerRow(rt, charger) {
    const factory = new HomeBrainAssetFactory(rt);
    const model = factory.adapterFor(charger, this.config)?.build?.() || null;
    const assetId = this.assetId(charger);
    const display = model?.display || charger.display_name || rt.chargerLabel(assetId);
    const route = model?.detailRoute || rt.assetDetailRoute(charger);
    const facts = model?.projection?.facts || {};
    const status = facts.operating?.display || "Unknown";
    const power = facts.power?.display || "—";
    const image = model?.image || this.chargerImage(charger);
    return `<article class="ov-charger-row">
      <span class="ov-charger-image"><img src="${rt.escape(rt.cache(image))}" alt="${rt.escape(display)}" onerror="this.style.display='none'"><ha-icon icon="mdi:ev-station"></ha-icon></span>
      <span class="ov-charger-copy"><b>${rt.escape(display)}</b><small><i class="ov-dot"></i>${rt.escape(status)}</small></span>
      <span class="ov-charger-power"><b>${rt.escape(power)}</b><small>Current power</small></span>
      <button class="action icon-only ov-detail" data-nav="${rt.escape(route)}" title="Open charger details"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
    </article>`;
  }

  dashboardTabFromRoute() {
    const path = String(window.location?.pathname || "").replace(/\/+$/, "");
    if (path.endsWith("/overview")) return "overview";
    if (path.endsWith("/dashboard")) return "vehicles";
    return this._localNavActive || this.config?.nav_active || "vehicles";
  }

  viewPositionKey() {
    try {
      const path = String(window.location?.pathname || "");
      const search = String(window.location?.search || "");
      return `rhi_mobility_scroll:${path}${search}`;
    } catch (e) {
      return "rhi_mobility_scroll:unknown";
    }
  }

  rememberViewPosition() {
    try { sessionStorage.setItem(this.viewPositionKey(), String(Math.max(0, window.scrollY || 0))); } catch (e) {}
  }

  restoreViewPositionOnce() {
    const key = this.viewPositionKey();
    if (this._restoredPositionKey === key) return;
    this._restoredPositionKey = key;
    let y = 0;
    try { y = Number(sessionStorage.getItem(key) || 0); } catch (e) { y = 0; }
    if (!Number.isFinite(y) || y <= 0) return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({ top:y, left:0, behavior:"auto" })));
  }

  overviewChargerSummary(rt, chargers) {
    const buckets = { free:0, in_use:0, unavailable:0, disabled:0, unknown:0 };
    for (const charger of chargers) {
      const adapter = new HomeBrainChargerAdapter(rt, this.chargerId(charger), { ...this.config, registry_entry:charger });
      const row = adapter.overviewAvailability();
      const key = Object.prototype.hasOwnProperty.call(buckets, row.bucket) ? row.bucket : "unknown";
      buckets[key] += 1;
    }
    const parts = [];
    if (buckets.free) parts.push(`${buckets.free} free`);
    if (buckets.in_use) parts.push(`${buckets.in_use} in use`);
    if (buckets.unavailable) parts.push(`${buckets.unavailable} unavailable`);
    if (buckets.disabled) parts.push(`${buckets.disabled} disabled`);
    if (buckets.unknown) parts.push(`${buckets.unknown} N/A`);
    return {
      ...buckets,
      total:chargers.length,
      label:chargers.length ? (parts.join(" · ") || "State N/A") : "No chargers published"
    };
  }

  activityDisplay(row = {}) {
    const message = String(row?.message || "").trim();
    return {
      message: message || "N/A",
      timestamp: String(row?.observed_at || row?.timestamp || "").trim()
    };
  }

  overviewNumeric(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(String(value).replace(",", ".").replace(/[^0-9+.-]/g, ""));
    return Number.isFinite(number) ? number : null;
  }

  overviewOutsideTemperature() {
    const states = Object.values(this._hass?.states || {});
    const weather = states.find((state) => String(state?.entity_id || "").startsWith("weather.") && Number.isFinite(Number(state?.attributes?.temperature)));
    if (weather) {
      const value = Number(weather.attributes.temperature);
      const unit = String(weather.attributes.temperature_unit || this._hass?.config?.unit_system?.temperature || "°C");
      return { resolved:true, display:`${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`, source:weather.entity_id };
    }
    const outdoor = states.find((state) => {
      const id = String(state?.entity_id || "").toLowerCase();
      const attrs = state?.attributes || {};
      const name = String(attrs.friendly_name || "").toLowerCase();
      return attrs.device_class === "temperature"
        && Number.isFinite(Number(state?.state))
        && /(outside|outdoor|buiten|exterior|ambient)/.test(`${id} ${name}`);
    });
    if (outdoor) {
      const value = Number(outdoor.state);
      const unit = String(outdoor.attributes?.unit_of_measurement || this._hass?.config?.unit_system?.temperature || "°C");
      return { resolved:true, display:`${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`, source:outdoor.entity_id };
    }
    return { resolved:false, display:"N/A", source:"" };
  }

  overviewDepartureInstant(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const absolute = Date.parse(raw);
    if (Number.isFinite(absolute)) return absolute;
    const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return null;
    const now = new Date();
    const candidate = new Date(now);
    candidate.setHours(Number(match[1]), Number(match[2]), 0, 0);
    if (candidate.getTime() < now.getTime() - 5 * 60 * 1000) candidate.setDate(candidate.getDate() + 1);
    return candidate.getTime();
  }

  overviewNextDeparture(rt, vehicles = []) {
    const candidates = [];
    for (const vehicle of vehicles) {
      const assetId = this.assetId(vehicle);
      const projection = new HomeBrainVehicleAdapter(rt, this.vehicleId(vehicle), { ...this.config, registry_entry:vehicle }).productProjection();
      const departure = projection?.facts?.ready_by || null;
      if (!departure || departure.value === undefined || departure.value === null || String(departure.value).trim() === "") continue;
      const instant = this.overviewDepartureInstant(departure.value);
      if (instant === null || instant < Date.now() - 5 * 60 * 1000) continue;
      const climate = projection?.facts?.climate_state || null;
      candidates.push({ vehicle, assetId, instant, climate });
    }
    candidates.sort((a,b)=>a.instant-b.instant);
    const next = candidates[0] || null;
    if (!next) return { resolved:false, vehicle:null, vehicleName:"N/A", climate:"N/A", departure:"" };
    const climate = next.climate ? String(rt.propertyDisplayValue(next.climate) || "N/A") : "N/A";
    const vehicleName = String(next.vehicle?.display_name || rt.vehicleLabel(next.assetId) || next.assetId);
    return { resolved:true, vehicle:next.vehicle, vehicleName, climate, departure:new Date(next.instant).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) };
  }

  overviewShortLabel(asset = {}, fallback = "") {
    const preferred = String(asset?.short_name || asset?.shortName || "").trim();
    if (preferred) return preferred;
    const display = String(asset?.display_name || asset?.display || fallback || asset?.asset_id || "").trim();
    if (!display) return "—";
    return display
      .replace(/Volkswagen/gi, "VW")
      .replace(/Mercedes(?:-Benz)?/gi, "MB")
      .replace(/Wallbox/gi, "WB")
      .replace(/Commander/gi, "")
      .replace(/Business Socket/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 14);
  }

  overviewChargingStatus(rt, vehicles = [], chargers = []) {
    const fleet = rt.mobilityFleetProjection();
    const factory = new HomeBrainAssetFactory(rt);
    const chargerModels = chargers.map((charger)=>factory.adapterFor(charger, this.config)?.build?.()).filter(Boolean);
    const vehicleModels = vehicles.map((vehicle)=>factory.adapterFor(vehicle, this.config)?.build?.()).filter(Boolean);
    const connectedRows = chargerModels.filter((model)=>String(model?.projection?.intelligence?.connection?.state || "").toLowerCase() === "asset_connected");
    const availableRows = chargerModels.filter((model)=>String(model?.projection?.availability?.bucket || "").toLowerCase() === "free");
    const label = (model)=>this.overviewShortLabel(
      { display_name:model?.display, asset_id:model?.projection?.identity?.asset_id },
      model?.display || model?.projection?.identity?.asset_id || "—"
    );
    const provenMappings = vehicleModels
      .filter((model)=>model?.projection?.relationships?.identity_proven && model?.projection?.relationships?.physically_connected_charger_id)
      .map((model)=>{
        const chargerId = model.projection.relationships.physically_connected_charger_id;
        const chargerModel = chargerModels.find((candidate)=>candidate?.projection?.identity?.asset_id === chargerId);
        return `${this.overviewShortLabel({display_name:model.display},model.display)}→${label(chargerModel || {display:rt.chargerLabel(chargerId),projection:{identity:{asset_id:chargerId}}})}`;
      });

    // null/empty from a backend is unknown, not numerical zero.
    const publishedCount=value=>value===null||value===undefined||value===''?null:
      (Number.isFinite(Number(value))?Number(value):null);
    const connected = publishedCount(fleet.connected_charger_count);
    const charging = publishedCount(fleet.charging_charger_count);
    const available = publishedCount(fleet.available_charger_count);
    const chargingFallback = chargerModels.filter((model)=>String(model?.projection?.intelligence?.charging?.state || "").toLowerCase() === "running").length;
    const powerState = String(fleet.aggregate_power_state || "unknown").toLowerCase();
    const power = fleet.aggregate_actual_charging_power_kw==null
      ? NaN : Number(fleet.aggregate_actual_charging_power_kw);
    const powerDisplay = Number.isFinite(power) && powerState !== "unknown"
      ? `${power.toFixed(1)} kW${powerState === "partial" ? " · partial" : " now"}`
      : "Power unknown";
    const chargerBuckets=chargerModels.map(model=>String(model?.projection?.availability?.bucket||'').toLowerCase());
    const fullyObserved=chargerBuckets.length>0 &&
      chargerBuckets.every(bucket=>['free','in_use','unavailable','disabled'].includes(bucket));
    const definitelyFree=fullyObserved && chargerBuckets.every(bucket=>bucket==='free');
    const currentContext = provenMappings.length
      ? provenMappings.slice(0,2).join(" · ")
      : connectedRows.length ? connectedRows.slice(0,3).map(label).join(" · ")
        : definitelyFree ? "No charger connected"
          : "Charger connection or vehicle identity not verified";
    const availabilityDisplay = availableRows.length
      ? `${availableRows.slice(0,3).map(label).join(" · ")} available`
      : (Number.isFinite(available) ? `${available} available` : "Availability unknown");

    const knownConnected=Number.isFinite(connected)?connected:fullyObserved?connectedRows.length:null;
    const knownCharging=Number.isFinite(charging)?charging:fullyObserved?chargingFallback:null;
    const knownAvailable=Number.isFinite(available)?available:fullyObserved?availableRows.length:null;
    return {
      connected:knownConnected,
      charging:knownCharging,
      available:knownAvailable,
      powerDisplay,
      stateDisplay:`${knownCharging===null?"Unknown":knownCharging} charging · ${knownConnected===null?"Unknown":knownConnected} connected`,
      currentContext,
      availabilityDisplay,
      powerState
    };
  }

  overviewRangeStatus(rt, vehicles = []) {
    const factory = new HomeBrainAssetFactory(rt);
    const models = vehicles.map((vehicle)=>factory.adapterFor(vehicle, this.config)?.build?.()).filter(Boolean);
    const policy = rt.rangePolicyProjection();
    const threshold = policy?.range?.low_range_km==null ? NaN : Number(policy.range.low_range_km);
    const rows = models.map((model)=>({ model, signal:model?.projection?.signals?.range || {} }));
    const ok = rows.filter(({signal})=>String(signal.state || "").toLowerCase() === "ok");
    const low = rows.filter(({signal})=>String(signal.state || "").toLowerCase() === "low")
      .map(({model,signal})=>({ name:this.overviewShortLabel({display_name:model.display}, model.display), summary:String(signal.display || signal.value || "Low range") }));
    const unknown = rows.filter(({signal})=>!["ok","low"].includes(String(signal.state || "").toLowerCase()));
    const total = vehicles.length;
    return {
      thresholdKm:Number.isFinite(threshold) ? threshold : null,
      sufficient:ok.length,
      low,
      unknown:unknown.length,
      total,
      headline:!total ? "Range not evaluated" : Number.isFinite(threshold) ? `${ok.length}/${total} ≥${threshold} km` : `${ok.length}/${total} range OK`,
      line1:!total ? "No active vehicles to evaluate" : low.length ? low.slice(0,2).map((row)=>`${row.name} ${row.summary}`).join(" · ") : "No low-range vehicle",
      line2:!total ? "0 vehicles evaluated" : unknown.length ? `${unknown.length} range unknown` : (Number.isFinite(threshold) ? `Policy threshold ${threshold} km` : "Range policy applied")
    };
  }

  overviewSecurityStatus(rt, vehicles = []) {
    const factory = new HomeBrainAssetFactory(rt);
    const groups = { secure:[], unsafe:[], incomplete:[], unknown:[] };
    for (const vehicle of vehicles) {
      const model = factory.adapterFor(vehicle, this.config)?.build?.() || null;
      const signal = model?.projection?.signals?.security || {};
      const state = String(signal.state || "unknown").toLowerCase();
      const bucket = Object.prototype.hasOwnProperty.call(groups,state) ? state : "unknown";
      groups[bucket].push({
        name:this.overviewShortLabel({display_name:model?.display}, model?.display || this.assetId(vehicle)),
        summary:String(signal.display || signal.value || state)
      });
    }
    return {
      unsafe:groups.unsafe,
      unsafeCount:groups.unsafe.length,
      secure:groups.secure.length,
      incomplete:groups.incomplete.length,
      unknown:groups.unknown.length
    };
  }

  overviewMaintenanceStatus(rt, vehicles = []) {
    const factory = new HomeBrainAssetFactory(rt);
    const groups = { overdue:[], due_soon:[], scheduled:[], ok:[], unknown:[] };
    for (const vehicle of vehicles) {
      const model = factory.adapterFor(vehicle, this.config)?.build?.() || null;
      const signal = model?.projection?.signals?.maintenance || {};
      const state = String(signal.state || "unknown").toLowerCase();
      const bucket = Object.prototype.hasOwnProperty.call(groups,state) ? state : "unknown";
      groups[bucket].push({
        name:this.overviewShortLabel({display_name:model?.display}, model?.display || this.assetId(vehicle)),
        summary:String(signal.display || signal.value || state),
        intelligence:signal
      });
    }
    return {
      overdue:groups.overdue,
      dueSoon:groups.due_soon,
      scheduled:groups.scheduled,
      ok:groups.ok,
      unknown:groups.unknown,
      actionable:[...groups.overdue, ...groups.due_soon],
      actionableCount:groups.overdue.length + groups.due_soon.length
    };
  }

  overviewStatusModel(rt, vehicles = [], chargers = []) {
    const security = this.overviewSecurityStatus(rt, vehicles);
    const maintenance = this.overviewMaintenanceStatus(rt, vehicles);
    return {
      charging:this.overviewChargingStatus(rt, vehicles, chargers),
      range:this.overviewRangeStatus(rt, vehicles),
      security,
      maintenance
    };
  }

  renderOverviewPage(rt, vehicles, chargers, activityRows, reco) {
    const activeVehicles = vehicles.filter((v)=>rt.lifecycleStatus(v) === "active");
    const inactiveVehicles = vehicles.filter((v)=>rt.lifecycleStatus(v) === "disabled");
    const unverifiedVehicles = vehicles.filter((v)=>rt.lifecycleStatus(v) === "unknown");
    const status = this.overviewStatusModel(rt, activeVehicles, chargers);
    const securityNames = status.security.unsafe.length
      ? status.security.unsafe.slice(0,2).map((row)=>row.name).join(" · ")
      : !activeVehicles.length
        ? (unverifiedVehicles.length ? `${unverifiedVehicles.length} vehicle lifecycle statuses unverified` : "No verified active vehicles")
        : (status.security.incomplete ? `${status.security.incomplete} incomplete` :
          (status.security.unknown ? `${status.security.unknown} unknown` :
            status.security.secure===activeVehicles.length ? "All covered vehicles secure" : "Security evidence incomplete"));
    const maintenanceAction = status.maintenance.actionable.length
      ? status.maintenance.actionable.slice(0,2).map((row)=>`${row.name} ${row.summary}`).join(" · ")
      : (activeVehicles.length ? "Nothing due < policy window" : "Not assessed · no verified active vehicles");
    const nextMaintenance = status.maintenance.scheduled.length
      ? `Next ${status.maintenance.scheduled[0].name} · ${status.maintenance.scheduled[0].summary}`
      : (!activeVehicles.length ? "No verified active vehicles" : status.maintenance.unknown.length ? `${status.maintenance.unknown.length} unknown` : "No scheduled maintenance");

    return `
      ${hbMobilityPageHero(rt, "overview")}

      <section class="ov-status-grid ov-domain-statusbar" aria-label="Mobility overview status">
        <article class="ov-status-item charging">
          <span class="ov-status-icon"><ha-icon icon="mdi:lightning-bolt"></ha-icon></span>
          <div><small>Charging</small><b>${rt.escape(status.charging.powerDisplay)}</b><em>${rt.escape(status.charging.stateDisplay)}</em><em>${rt.escape(status.charging.currentContext)} · ${rt.escape(status.charging.availabilityDisplay)}</em></div>
        </article>
        <article class="ov-status-item range ${status.range.low.length ? "warn" : ""}">
          <span class="ov-status-icon"><ha-icon icon="mdi:road-variant"></ha-icon></span>
          <div><small>Range</small><b>${rt.escape(status.range.headline)}</b><em>${rt.escape(status.range.line1)}</em><em>${rt.escape(status.range.line2)}</em></div>
        </article>
        <article class="ov-status-item security ${status.security.unsafeCount ? "warn" : ""}">
          <span class="ov-status-icon"><ha-icon icon="mdi:lock-outline"></ha-icon></span>
          <div><small>Security</small><b>${rt.escape(activeVehicles.length ? `${status.security.unsafeCount} unsafe` : "Not evaluated")}</b><em>${rt.escape(`${status.security.secure} secure · ${status.security.incomplete} incomplete`)}</em><em>${rt.escape(securityNames)}</em></div>
        </article>
        <article class="ov-status-item maintenance ${status.maintenance.actionableCount ? "warn" : ""}">
          <span class="ov-status-icon"><ha-icon icon="mdi:wrench-outline"></ha-icon></span>
          <div><small>Maintenance</small><b>${rt.escape(activeVehicles.length ? `${status.maintenance.overdue.length} overdue · ${status.maintenance.dueSoon.length} due soon` : "Not evaluated")}</b><em>${rt.escape(maintenanceAction)}</em><em>${rt.escape(nextMaintenance)}</em></div>
        </article>
      </section>

      <section class="ov-quickbar energy-like" aria-label="Quick actions">
        <span class="ov-quick-title">${rt.escape(rt.t("common.quick_actions",{},"Quick actions"))}</span>
        <button class="ov-nav-action primary" data-nav="${hbMobilityPath("/dashboard")}"><ha-icon icon="mdi:car-cog"></ha-icon>${rt.escape(rt.t("common.vehicle_actions",{},"Vehicle actions"))}</button>
        <button class="ov-nav-action" data-nav="${hbMobilityPath("/planning")}"><ha-icon icon="mdi:calendar-clock"></ha-icon>${rt.escape(rt.t("charger.charging_plan",{},"Charging plan"))}</button>
        <button class="ov-nav-action" data-nav="${hbMobilityPath("/dashboard")}"><ha-icon icon="mdi:fan"></ha-icon>${rt.escape(rt.t("common.precondition",{},"Precondition"))}</button>
        <button class="ov-nav-action" data-nav="${hbMobilityPath("/dashboard")}"><ha-icon icon="mdi:ev-station"></ha-icon>${rt.escape(rt.t("common.change_charger",{},"Change charger"))}</button>
      </section>

      <section class="ov-panel ov-core-vehicles ov-overview-vehicles">
        <div class="ov-panel-head">
          <div><h2>${rt.escape(rt.t("dashboard.vehicles",{},"Vehicles"))}</h2><p>${rt.escape(rt.t("dashboard.vehicles_description",{},"Readiness first: range and energy, security, comfort, maintenance, charger relationship and direct actions."))}</p></div>
          <button data-nav="${hbMobilityPath("/dashboard")}">${rt.escape(rt.t("charger.vehicle_management",{},"Vehicle Management"))} <ha-icon icon="mdi:chevron-right"></ha-icon></button>
        </div>
        <div class="ov-vehicle-list">${activeVehicles.length ? activeVehicles.map((vehicle)=>this.renderOverviewVehicleRow(rt,vehicle,chargers)).join("") : `<div class="ov-empty">No active vehicles. ${inactiveVehicles.length ? `${inactiveVehicles.length} disabled vehicle${inactiveVehicles.length===1?"":"s"}.` : ""} ${unverifiedVehicles.length ? `${unverifiedVehicles.length} vehicle lifecycle publication${unverifiedVehicles.length===1?" is":"s are"} missing or unavailable.` : ""} ${!inactiveVehicles.length && !unverifiedVehicles.length ? "No vehicle is published by the Mobility backend." : ""}</div>`}</div>
        ${inactiveVehicles.length ? `<div class="ov-inactive-summary"><div class="ov-inactive-title"><strong>${rt.escape(rt.t("dashboard.inactive_vehicles",{},"Inactive vehicles"))}</strong><span>${inactiveVehicles.length} · ${rt.escape(rt.t("dashboard.inactive_vehicles_description",{},"Disabled vehicles stay visible with identity and Enable only."))}</span></div><div class="inactive-list">${inactiveVehicles.map(v=>this.renderInactiveVehicle(rt,v)).join("")}</div></div>` : ""}
        ${unverifiedVehicles.length ? `<div class="ov-inactive-summary"><div class="ov-inactive-title"><strong>Lifecycle status unavailable</strong><span>${unverifiedVehicles.length} vehicles · Mobility canonical asset.lifecycle_status not published or unavailable. Do not reactivate.</span></div><div class="inactive-list">${unverifiedVehicles.map(v=>this.renderInactiveVehicle(rt,v)).join("")}</div></div>` : ""}
      </section>`;
  }

  renderVehiclesPage(rt, activeVehicles, inactiveVehicles, unverifiedVehicles, chargers, reco, plan, trust, activity, intelligenceSummary) {
    const factory = new HomeBrainAssetFactory(rt);
    const vehicleLabel = (vehicle) => {
      const model = factory.adapterFor(vehicle, this.config)?.build?.() || null;
      return String(model?.display || vehicle?.display_name || rt.vehicleLabel(this.assetId(vehicle)) || this.assetId(vehicle));
    };
    const attentionRequired = (vehicle) => {
      const model = factory.adapterFor(vehicle, this.config)?.build?.() || null;
      return model?.projection?.attention_required === true;
    };
    const sortRows = (rows) => {
      const copy = [...rows];
      if (this._vehicleSort === "name") copy.sort((a,b)=>vehicleLabel(a).localeCompare(vehicleLabel(b)));
      return copy;
    };

    const allActive = sortRows(activeVehicles);
    const allInactive = sortRows(inactiveVehicles);
    const allUnverified = sortRows(unverifiedVehicles);
    const filter = this._vehicleFilter || "all";
    const visibleActive = filter === "disabled" ? [] : filter === "attention" ? allActive.filter(attentionRequired) : allActive;
    const visibleInactive = filter === "active" ? [] : filter === "attention" ? allInactive.filter(attentionRequired) : allInactive;
    const visibleUnverified = ["active","disabled"].includes(filter) ? [] : filter === "attention" ? allUnverified.filter(attentionRequired) : allUnverified;

    const fleet = rt.mobilityFleetProjection();
    const activeCount = fleet.active_vehicle_count==null || fleet.active_vehicle_count==="" ? allActive.length : Number.isFinite(Number(fleet.active_vehicle_count)) ? Number(fleet.active_vehicle_count) : allActive.length;
    const inactiveCount = allInactive.length;
    const unverifiedCount = allUnverified.length;
    const attentionCount = [...allActive, ...allInactive, ...allUnverified].filter(attentionRequired).length;
    const assignedRows = allActive.filter((vehicle)=>{
      const model = factory.adapterFor(vehicle, this.config)?.build?.() || null;
      return !!String(model?.projection?.relationships?.configured_charger_id || "").trim();
    });
    const configuredCount = assignedRows.length;
    const unassignedRows = allActive.filter((vehicle)=>!assignedRows.includes(vehicle));
    const profiledRows = allActive.filter((vehicle)=>{
      const model = factory.adapterFor(vehicle, this.config)?.build?.() || null;
      return !!String(model?.projection?.configuration?.profile_id || "").trim();
    });
    const unprofiledRows = allActive.filter((vehicle)=>!profiledRows.includes(vehicle));
    const managementPath = "/config/integrations/integration/rhi_mobility";
    const names = (rows)=>rows.slice(0,3).map((row)=>this.overviewShortLabel(row, vehicleLabel(row))).join(" · ");

    return `
      ${hbMobilityPageHero(rt, "vehicles")}
      ${hbMobilityStatusGrid(rt, [
        { icon:"mdi:car-multiple", label:"Fleet", value:`${activeCount} active`, sub:[inactiveCount ? `${inactiveCount} disabled` : "",unverifiedCount ? `${unverifiedCount} lifecycle unverified` : ""].filter(Boolean).join(" · ") || "No disabled vehicles", tone:"neutral" },
        { icon:"mdi:card-account-details-outline", label:"Profiles", value:`${profiledRows.length}/${activeCount} configured`, sub:unprofiledRows.length ? `${names(unprofiledRows)} without profile` : "All active vehicles profiled", tone:"neutral" },
        { icon:"mdi:ev-station", label:"Charging setup", value:`${configuredCount}/${activeCount} assigned`, sub:unassignedRows.length ? `${names(unassignedRows)} no charger` : "All active vehicles assigned", tone:"neutral" }
      ], "vehicles-top-status")}
      ${hbMobilityQuickActions(rt, [
        { icon:"mdi:cog-outline", label:rt.t("common.manage_vehicles_profiles",{},"Manage vehicles & profiles"), path:managementPath, primary:true },
        { icon:"mdi:ev-station", label:rt.t("common.charger_management",{},"Charger Management"), path:hbMobilityPath("/charger-maintenance") },
        { icon:"mdi:calendar-clock", label:rt.t("charger.charging_plan",{},"Charging plan"), path:hbMobilityPath("/planning") },
        { icon:"mdi:target", label:rt.t("charger.strategies",{},"Strategies"), path:hbMobilityPath("/strategies") }
      ])}

      <section class="vehicle-management-bar vehicle-filter-bar" aria-label="Vehicle filters and sorting">
        <div class="vehicle-filter-group" role="group" aria-label="Filter vehicles">
          ${[
            ["all","All",allActive.length+inactiveCount+unverifiedCount],
            ["active","Active",activeCount],
            ["disabled","Disabled",inactiveCount],
            ["attention","Attention",attentionCount]
          ].map(([key,label,count])=>`<button class="${filter===key?"active":""}" data-vehicle-filter="${key}"><span>${label}</span><b>${count}</b></button>`).join("")}
        </div>
        <label class="vehicle-sort-control"><span>Sort</span><select data-vehicle-sort><option value="default" ${this._vehicleSort==="default"?"selected":""}>Configured order</option><option value="name" ${this._vehicleSort==="name"?"selected":""}>Name</option></select></label>
      </section>


      ${visibleActive.length ? `
        <section class="vehicle-workspace-head">
          <div><h2>${rt.escape(rt.t("dashboard.active_vehicles",{},"Active vehicles"))}</h2><p>${rt.escape(rt.t("dashboard.active_vehicles_description",{},"Readiness and actions first. Charger assignment and lifecycle remain Mobility-owned controls."))}</p></div>
          <span class="vehicle-count-pill">${visibleActive.length} shown</span>
        </section>
        <section class="vehicles vehicle-workspace-list">${visibleActive.map((v)=>this.renderVehicle(rt,v,chargers)).join("")}</section>
      ` : (filter !== "disabled" && filter !== "all" ? `<div class="vehicle-filter-empty">No active vehicles match this filter.</div>` : "")}

      ${visibleUnverified.length ? `
        <section class="vehicle-workspace-head inactive-head"><div><h2>Lifecycle status unavailable</h2><p>These registered vehicles are not confirmed disabled. The canonical lifecycle publication is missing or unavailable; activation remains blocked.</p></div><span class="vehicle-count-pill muted">${visibleUnverified.length} shown</span></section>
        <section class="inactive-list">${visibleUnverified.map(v=>this.renderInactiveVehicle(rt,v)).join("")}</section>
      ` : ""}
      ${visibleInactive.length ? `
        <section class="vehicle-workspace-head inactive-head">
          <div><h2>${rt.escape(rt.t("dashboard.inactive_vehicles",{},"Inactive vehicles"))}</h2><p>${rt.escape(rt.t("dashboard.inactive_vehicles_description",{},"Disabled vehicles stay available for deliberate reactivation and detail access."))}</p></div>
          <span class="vehicle-count-pill muted">${visibleInactive.length} shown</span>
        </section>
        <section class="inactive-list">${visibleInactive.map((v)=>this.renderInactiveVehicle(rt,v)).join("")}</section>
      ` : (filter === "disabled" ? `<div class="vehicle-filter-empty">No disabled vehicles.</div>` : "")}
    `;
  }

  versionBlock(rt) { return ""; }

  intelligenceStatusRow(rt, tile = {}) {
    const label = tile.label || "Intelligence";
    const value = tile.value || rt.t("common.not_available",{},"Not available");
    const detail = String(tile.subvalue || tile.reason || "").trim();
    const rawTone = String(tile.tone || "neutral").toLowerCase();
    const pillTone = rawTone === "error" ? "bad" : rawTone === "attention" ? "warn" : rawTone === "active" ? "ok" : "muted";
    const title = detail ? `${label}: ${value} — ${detail}` : `${label}: ${value}`;
    return `<div class="status-row intelligence-status-row" title="${rt.escape(title)}"><ha-icon icon="${rt.escape(tile.icon || "mdi:information-outline")}"></ha-icon><span>${rt.escape(label)}</span><b class="pill ${pillTone}">${rt.escape(value)}</b>${detail ? `<small>${rt.escape(detail)}</small>` : ""}</div>`;
  }

  issueRows(rt, vehicles) {
    const rows = [];
    let missing = 0;
    for (const a of vehicles) {
      const label = a.display_name || rt.vehicleLabel(a.asset_id);
      const attention = rt.supervisorOutcome(a.asset_id, "attention", "");
      const reason = rt.supervisorOutcome(a.asset_id, "attention_reason", "");
      if (!attention) {
        missing += 1;
        continue;
      }
      const att = String(attention).toLowerCase();
      if (!["none", "ok", "not applicable"].includes(att)) {
        rows.push(`<li><b>${rt.escape(label)}</b><span>${rt.escape(reason || attention)}</span></li>`);
      }
    }
    if (rows.length) return rows.join("");
    if (missing) return `<li><b>Supervisor</b><span>Attention unavailable for ${missing} vehicle${missing === 1 ? "" : "s"}.</span></li>`;
    return `<li class="clear"><b>All vehicles</b><span>Backend supervisor reports no attention requiring action.</span></li>`;
  }

  recommended(rt) {
    const action = rt.supervisorOutcome("mobility", "recommended_action", "");
    const reason = rt.supervisorOutcome("mobility", "recommended_reason", "") || rt.supervisorOutcome("mobility", "attention", "");
    if (action) return { label: "Mobility", action, reason: reason || "Backend supervisor recommendation." };
    return { label: "Mobility", action: "Unknown", reason: "Backend supervisor recommendation unavailable." };
  }

  set hass(hass) {
    this._hass = hass;
    try {
          const now = Date.now();
          const forceRender = !!this._forceRender;
          this._forceRender = false;
          const activeEl = this.shadowRoot?.activeElement;
          if (!forceRender && (now < (this._holdRenderUntil || 0)) && this._lastRenderOk) return;
          if (!forceRender && activeEl && ["SELECT", "INPUT"].includes(activeEl.tagName) && this._lastRenderOk) return;
          if (!forceRender && this._vehiclePickerAsset && this._lastRenderOk) return;
          if (!forceRender && this._lastRenderOk && now - (this._lastDashboardRenderAt || 0) < 900) return;
          this._lastDashboardRenderAt = now;
          const rt = new HomeBrainAssetRuntime(hass, this.config);
          this.rt = rt;
          const revisionSignature = rt.productRevisionSignature("", [
            "MOBILITY_EXPERIENCE_V2",
            "MOBILITY_EXPERIENCE_V2",
            "MOBILITY_COMMAND_V2",
            "MOBILITY_ACTIVITY_V2",
            "MOBILITY_PROFILE_CATALOG_V2",
            "MOBILITY_SUPERVISION_V2"
          ]);
          if (!forceRender && this._lastRenderOk && revisionSignature === this._lastRevisionSignature) return;
          this._lastRevisionSignature = revisionSignature;
          const factory = new HomeBrainAssetFactory(rt);
          const vehicles = factory.vehicles().filter((a)=>a.lifecycle_state !== "Retired").sort((a,b)=>(Number(a.sort_order ?? 999)-Number(b.sort_order ?? 999)) || String(a.display_name).localeCompare(String(b.display_name)));
          const chargers = factory.chargers().filter((a)=>a.frontend_allowed !== false && rt.lifecycleStatus(a) === "active").sort((a,b)=>(Number(a.sort_order ?? 999)-Number(b.sort_order ?? 999)) || String(a.display_name).localeCompare(String(b.display_name)));
          const activeVehicles = vehicles.filter((v)=>rt.lifecycleStatus(v) === "active");
          const inactiveVehicles = vehicles.filter((v)=>rt.lifecycleStatus(v) === "disabled");
          const unverifiedVehicles = vehicles.filter((v)=>rt.lifecycleStatus(v) === "unknown");
          const reco = this.recommended(rt);
          const plan = rt.supervisorOutcome("mobility", "opportunity", "Unknown") || "Unknown";
          const trust = rt.supervisorOutcome("mobility", "trust", "Unknown") || "Unknown";
          const activityRows = rt.activityRowsFor ? rt.activityRowsFor("") : [];
          const intelligenceRows = rt.intelligenceRowsFor ? rt.intelligenceRowsFor("") : [];
          const activity = activityRows.slice(0, 3).map((a)=>a.message || a.activity_state || a.activity_type || "Current activity");
          const intelligenceSummary = intelligenceRows.find((r)=>r.message || r.meaning || r.value || r.title || r.insight_type);
          const signature = JSON.stringify({
            vehicles: vehicles.map((v) => {
              const model = factory.adapterFor(v, this.config)?.build?.() || null;
              const projection = model?.projection || {};
              return [
                v.asset_id,
                model?.display || v.display_name,
                projection?.lifecycle?.state || rt.lifecycleStatus(v),
                projection?.relationships,
                projection?.signals,
                projection?.facts?.overview_metrics || [],
                (projection?.commands || []).map((cmd)=>[cmd.command_id, cmd.frontend_allowed, cmd.execution_allowed, cmd.execution_status || "", cmd.blocked_reason || cmd.execution_reason || ""])
              ];
            }),
            chargers: chargers.map((c) => {
              const model = factory.adapterFor(c, this.config)?.build?.() || null;
              const projection = model?.projection || {};
              return [c.asset_id, projection?.lifecycle?.state || rt.lifecycleStatus(c), projection?.facts, projection?.availability];
            }),
            reco, plan, trust, activity, sent: Array.from(this._sent || []).filter(([, t]) => Date.now() - t < 3000)
          });
          const activeElement = this.shadowRoot?.activeElement;
          if (!forceRender && this._lastSignature === signature && this._lastRenderOk && !(activeElement && ["SELECT", "INPUT"].includes(activeElement.tagName))) return;
          this._lastSignature = signature;
          this._lastRenderOk = true;
          const navActive = this.dashboardTabFromRoute();
          const pageContent = navActive === "overview"
            ? this.renderOverviewPage(rt, vehicles, chargers, activityRows, reco)
            : this.renderVehiclesPage(rt, activeVehicles, inactiveVehicles, unverifiedVehicles, chargers, reco, plan, trust, activity, intelligenceSummary);
          {
      const template = document.createElement("template");
      template.innerHTML = `<ha-card><div class="page rhiUxDomainBody rhi-ux-root">${this.versionBlock(rt)}
            ${hbMobilityNav(navActive)}
            ${pageContent}
          </div>${hbMobilityReleaseFooter(rt)}<style>${this.styles()}${typeof rhiUxVisualPickerStyles === "function" ? rhiUxVisualPickerStyles() : ""}${navActive === "overview" ? this.overviewStyles() : ""}${hbMobilityResponsiveFinishStyles()}
            /* Canonical action sizing */
            .action.enum-action,.cmd.enum-command{height:40px;min-height:40px;max-height:40px;display:flex;align-items:center;justify-content:center;gap:7px;padding:0 10px;box-sizing:border-box;overflow:hidden}
            .action.enum-action ha-icon,.cmd.enum-command ha-icon{flex:0 0 auto}
            .action.enum-action select,.cmd.enum-command select{appearance:auto;min-width:0;max-width:170px;width:auto;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;font-weight:600;padding:0 2px;box-shadow:none;cursor:pointer}
          </style></ha-card>`;
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }
          this.wireEvents(rt);
          this.restoreViewPositionOnce();
    } catch (err) {
      console.error("HomeBrain Mobility dashboard render failed", err);
      const message = String((err && (err.stack || err.message)) || err || "Unknown render error");
      const safe = message.replace(/[&<>]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]));
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      let backendVersion = "Unknown";
      try { backendVersion = new HomeBrainAssetRuntime(this._hass || hass, this.config).backendVersion(); } catch (e) {}
      {
      const template = document.createElement("template");
      template.innerHTML = `<ha-card>
        <div class="hb-error-page">
          <div class="hi-version-block" style="position:absolute;top:18px;right:22px;text-align:right;font-size:10.5px;line-height:1.25;font-weight:400;color:var(--secondary-text-color,#6B7280);opacity:.82;background:none;border:0;box-shadow:none;padding:0;margin:0;z-index:3;pointer-events:none;"><div>UX ${String(UX_VERSION).replace(/[&<>]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]))}</div><div>Backend ${String(backendVersion).replace(/[&<>]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]))}</div></div>
          <h1>Mobility</h1>
          <h2>${rhiUxEscape(rhiMobilityT(this._hass || hass,"dashboard.temporarily_unavailable",{},"Dashboard temporarily unavailable"))}</h2>
          <p>${rhiUxEscape(rhiMobilityT(this._hass || hass,"dashboard.render_failed",{},"The frontend loaded, but the dashboard could not render the current backend contract safely."))}</p>
          <pre>${safe}</pre>
        </div>
        <style>
          ha-card{background:transparent;border:0;box-shadow:none}
          .hb-error-page{position:relative;margin:24px auto;width:min(100%,1100px);box-sizing:border-box;padding:28px;border:1px solid #F3B7B7;border-radius:22px;background:#FFF7F7;color:#061226;user-select:text;-webkit-user-select:text;box-shadow:0 18px 48px rgba(80,15,15,.08)}
          .hi-version-block{position:absolute;top:18px;right:22px;text-align:right;font-size:10.5px;line-height:1.25;font-weight:400;color:var(--secondary-text-color,#6B7280);opacity:.82;background:none;border:0;box-shadow:none;padding:0}
          h1{margin:0 0 8px;font-size:34px;letter-spacing:-.04em}
          h2{margin:0 0 8px;font-size:20px}
          p{font-weight:600;color:#5F6D84}
          pre{white-space:pre-wrap;overflow:auto;background:#fff;border:1px solid #F0D0D0;border-radius:14px;padding:14px;font-size:12px;max-height:360px}
        
/* R22.12.11.24 unified quick-action sizing */
.action.enum-action,.cmd.enum-command{height:43px;min-height:43px;max-height:43px;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;padding:0 11px;box-sizing:border-box;overflow:hidden}
.action.enum-action ha-icon,.cmd.enum-command ha-icon{flex:0 0 auto;grid-row:auto}
.action.enum-action select,.cmd.enum-command select{appearance:auto;-webkit-appearance:auto;min-width:0;max-width:170px;width:auto;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;font-weight:600;padding:0 2px;line-height:1;box-shadow:none;cursor:pointer;grid-column:auto}
.action.enum-action select:focus,.cmd.enum-command select:focus{outline:2px solid rgba(20,103,245,.20);outline-offset:3px;border-radius:6px}
.command-row>.cmd,.command-row>.enum-command{min-width:0;width:100%}
</style>
        ${hbMobilityReleaseFooter(new HomeBrainAssetRuntime(this._hass || hass, this.config))}
      </ha-card>`;
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }
    }
  }
  wireEvents(rt) {
    this.shadowRoot.querySelectorAll("button[data-intent]").forEach((btn)=>btn.addEventListener("click",()=>{
      const assetId = btn.getAttribute("data-asset-id") || "";
      const commandId = btn.getAttribute("data-command-id") || "";
      const commandKey = btn.getAttribute("data-command-key") || commandId;
      const command = commandKey ? rt.commandsFor(assetId).find((c)=>String(c.command_key || c.command_id || "") === String(commandKey) || String(c.command_id || "") === String(commandId)) : null;
      if (command) rt.callCommand(command);
    }));
    this.shadowRoot.querySelectorAll("select[data-command-id]").forEach((select)=>select.addEventListener("change",()=>{
      const value = select.value;
      if (!value || select.disabled) return;
      const assetId = select.getAttribute("data-command-asset") || "";
      const commandId = select.getAttribute("data-command-id") || "";
      const commandKey = select.getAttribute("data-command-key") || commandId;
      const parameter = select.getAttribute("data-command-param") || "";
      const command = rt.commandsFor(assetId).find((candidate)=>String(candidate.command_key || candidate.command_id || "") === String(commandKey) || String(candidate.command_id || "") === String(commandId));
      if (!command || !parameter) return;
      rt.callCommand(command, { [parameter]: value });
      select.value = "";
    }));
    this.shadowRoot.querySelectorAll("button[data-nav]").forEach((btn)=>btn.addEventListener("click",()=>{
      const target = btn.getAttribute("data-nav") || "";
      this.rememberViewPosition();
      if (!target) return;
      rt.navigate(target);
    }));
    this.shadowRoot.querySelectorAll("button[data-vehicle-filter]").forEach((btn)=>btn.addEventListener("click",()=>{
      const value = btn.getAttribute("data-vehicle-filter") || "all";
      if (!["all","active","disabled","attention"].includes(value)) return;
      this._vehicleFilter = value;
      this._forceRender = true;
      this._lastSignature = "";
      this._restoredPositionKey = this.viewPositionKey();
      if (this._hass) this.hass = this._hass;
    }));
    this.shadowRoot.querySelectorAll("select[data-vehicle-sort]").forEach((select)=>select.addEventListener("change",()=>{
      this._vehicleSort = select.value === "name" ? "name" : "default";
      this._forceRender = true;
      this._lastSignature = "";
      this._restoredPositionKey = this.viewPositionKey();
      if (this._hass) this.hass = this._hass;
    }));
    this.shadowRoot.querySelectorAll("button[data-vehicle-picker]").forEach((btn)=>btn.addEventListener("click",()=>{
      const assetId = btn.getAttribute("data-vehicle-picker") || "";
      const closing = this._vehiclePickerAsset === assetId;
      if (closing) this._vehiclePickerDraft.delete(assetId);
      else this._vehiclePickerDraft.set(assetId,{});
      this._vehiclePickerAsset = closing ? "" : assetId;
      this._forceRender = true; this._lastSignature = "";
      if (this._hass) this.hass = this._hass;
    }));
    this.shadowRoot.querySelectorAll("button[data-vehicle-picker-close]").forEach((btn)=>btn.addEventListener("click",()=>{
      const assetId = btn.getAttribute("data-vehicle-picker-close") || this._vehiclePickerAsset || "";
      if (assetId) this._vehiclePickerDraft.delete(assetId);
      this._vehiclePickerAsset = ""; this._forceRender = true; this._lastSignature = "";
      if (this._hass) this.hass = this._hass;
    }));
    this.shadowRoot.querySelectorAll("[data-picker-panel]").forEach((panel)=>{
      const assetId = panel.getAttribute("data-picker-panel") || "";
      const picker = new HomeBrainVehicleVisualPicker(rt);
      const asset = rt.vehicleById(assetId) || rt.assetById(assetId) || {asset_id:assetId,asset_type:"vehicle"};
      const brandSelect = panel.querySelector("[data-vehicle-picker-brand]");
      const modelSelect = panel.querySelector("[data-vehicle-picker-model]");
      const variantSelect = panel.querySelector("[data-vehicle-picker-variant]");
      const colorSelect = panel.querySelector("[data-vehicle-picker-color]");
      const saveButton = panel.querySelector("[data-vehicle-picker-save]");
      const keyNode = panel.querySelector(".vehicle-picker-key code");
      const placeholder=(label)=>`<option value="" selected disabled>${rt.escape(label)}</option>`;

      panel.querySelectorAll("[data-vehicle-visual-choice]").forEach((choice)=>choice.addEventListener("click",()=>{
        const draft={
          brand:choice.getAttribute("data-choice-brand") || "",
          model:choice.getAttribute("data-choice-model") || "",
          variant_id:choice.getAttribute("data-vehicle-visual-choice") || "",
          color_id:choice.getAttribute("data-choice-color") || ""
        };
        this._vehiclePickerDraft.set(assetId,draft);
        this._forceRender=true; this._lastSignature="";
        if(this._hass) this.hass=this._hass;
      }));

      const updatePreview=()=>{
        const draft=this._vehiclePickerDraft.get(assetId) || {};
        const visual=picker.selection(asset,draft);
        if(keyNode) keyNode.textContent=visual.key || "Unavailable";
        if(saveButton){
          saveButton.setAttribute("data-vehicle-key",visual.key || "");
          saveButton.setAttribute("data-vehicle-profile-id",visual.profile_id || "");
          saveButton.disabled=!visual.writable;
        }
        const card=panel.closest(".vehicle-card");
        const preview=card?.querySelector(".vehicle-image img");
        if(preview && visual?.vehicle?.package_file) preview.src=rt.cache(visual.vehicle.package_file);
        if(preview) preview.style.filter=visual?.color?.filter || "none";
      };

      const refreshHierarchy=(level)=>{
        const catalog=picker.catalog();
        const brand=String(brandSelect?.value || "");
        if(level==="brand"){
          const models=picker.modelsForBrand(brand,catalog);
          if(modelSelect){modelSelect.disabled=!brand;modelSelect.innerHTML=placeholder("Choose model…")+models.map((model)=>`<option value="${rt.escape(model)}">${rt.escape(model)}</option>`).join("");}
          if(variantSelect){variantSelect.disabled=true;variantSelect.innerHTML=placeholder("Choose variant…");}
          if(colorSelect){colorSelect.disabled=true;colorSelect.innerHTML=placeholder("Choose colour…");}
        }else if(level==="model"){
          const model=String(modelSelect?.value || "");
          const variants=picker.variantsFor(brand,model,catalog);
          if(variantSelect){variantSelect.disabled=!model;variantSelect.innerHTML=placeholder("Choose variant…")+variants.map((row)=>`<option value="${rt.escape(row.id)}">${rt.escape(row.variant)} · ${rt.escape(row.years)}</option>`).join("");}
          if(colorSelect){colorSelect.disabled=true;colorSelect.innerHTML=placeholder("Choose colour…");}
        }else if(level==="variant"){
          const vehicle=catalog.find((row)=>row.id===String(variantSelect?.value || "")) || null;
          if(colorSelect){colorSelect.disabled=!vehicle;colorSelect.innerHTML=placeholder("Choose colour…")+(vehicle?.colors || []).map((row)=>`<option value="${rt.escape(row.id)}">${rt.escape(row.label)}</option>`).join("");}
        }
        updatePreview();
      };

      brandSelect?.addEventListener("change",()=>{
        this._vehiclePickerDraft.set(assetId,{...(this._vehiclePickerDraft.get(assetId)||{}),brand:brandSelect.value,model:"",variant_id:"",color_id:""});
        refreshHierarchy("brand");
      });
      modelSelect?.addEventListener("change",()=>{
        this._vehiclePickerDraft.set(assetId,{...(this._vehiclePickerDraft.get(assetId)||{}),model:modelSelect.value,variant_id:"",color_id:""});
        refreshHierarchy("model");
      });
      variantSelect?.addEventListener("change",()=>{
        this._vehiclePickerDraft.set(assetId,{...(this._vehiclePickerDraft.get(assetId)||{}),variant_id:variantSelect.value,color_id:""});
        refreshHierarchy("variant");
      });
      colorSelect?.addEventListener("change",()=>{
        this._vehiclePickerDraft.set(assetId,{...(this._vehiclePickerDraft.get(assetId)||{}),color_id:colorSelect.value});
        updatePreview();
      });
    });
    this.shadowRoot.querySelectorAll("button[data-vehicle-picker-save]").forEach((btn)=>btn.addEventListener("click",async ()=>{
      if(btn.disabled) return;
      const assetId=btn.getAttribute("data-vehicle-picker-save") || "";
      const profileId=btn.getAttribute("data-vehicle-profile-id") || "";
      const key=btn.getAttribute("data-vehicle-key") || "";
      if(!assetId || !key) return;
      const asset=rt.vehicleById(assetId) || rt.assetById(assetId) || {asset_id:assetId,asset_type:"vehicle"};
      const picker=new HomeBrainVehicleVisualPicker(rt);
      const selection=picker.selection(asset,this._vehiclePickerDraft.get(assetId) || {});
      this._vehiclePendingAppearance.set(assetId,{
        key,
        image:selection?.vehicle?.package_file || "",
        filter:selection?.color?.filter || "none",
        started_at:Date.now()
      });
      this._vehicleAppearanceError.delete(assetId);
      this._forceRender=true; this._lastSignature="";
      if(this._hass)this.hass=this._hass;
      btn.disabled=true;
      const currentProjection=new HomeBrainVehicleAdapter(rt,this.vehicleId(asset),{...this.config,registry_entry:asset}).productProjection();
      const currentProfile=String(currentProjection?.identity?.profile_id || "");
      const profileOk=!profileId || profileId===currentProfile || await rt.writePublishedPropertyAsync(assetId,"asset.profile_id",profileId);
      if(!profileOk){this.failVehicleAppearance(assetId,"Profile update was rejected. Appearance was not changed.");return;}
      const imageOk=await rt.writePublishedPropertyAsync(assetId,"vehicle.image_key",key);
      if(!imageOk){this.failVehicleAppearance(assetId,"Appearance update was rejected or canonical readback did not confirm it.");return;}
      btn.classList.add("sent");
      this._vehiclePickerDraft.delete(assetId);
      this._vehiclePickerAsset="";
      this._forceRender=true; this._lastSignature="";
      if(this._hass)this.hass=this._hass;
      setTimeout(()=>{
        const pending=this._vehiclePendingAppearance.get(assetId);
        if(pending?.key===key) this.failVehicleAppearance(assetId,"Appearance readback timed out; showing the canonical Mobility appearance again.");
      },8000);
    }));
    this.shadowRoot.querySelectorAll("button[data-lifecycle-asset]").forEach((btn)=>btn.addEventListener("click",async ()=>{
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
        btn.title = "Write rejected or canonical readback did not confirm the requested lifecycle state.";
      } else {
        btn.classList.add("sent");
      }
      this._forceRender = true;
      this._holdRenderUntil = 0;
      this._lastSignature = "";
      if (this._hass) this.hass = this._hass;
    }));

    this.shadowRoot.querySelectorAll("button[data-property-step],button[data-charge-power-step],button[data-current-step]").forEach((btn)=>btn.addEventListener("click",async ()=>{
      const vehicleAsset = btn.getAttribute("data-vehicle-asset") || btn.getAttribute("data-charger-asset");
      const propertyKey = btn.getAttribute("data-property-step") || "";
      const delta = Number(btn.getAttribute("data-delta") || 0);
      const min = Number(btn.getAttribute("data-min") || 0);
      const max = Number(btn.getAttribute("data-max") || 100);
      const attrValue = Number(btn.getAttribute("data-charge-power-value") || btn.getAttribute("data-current-value"));
      const cur = Number.isFinite(attrValue) ? attrValue : null;
      const next = Math.max(min, Math.min(max, (cur ?? min) + delta));
      if (!propertyKey || !vehicleAsset) return;
      const vehicleEntry = rt.vehicleById(vehicleAsset) || rt.assetById(vehicleAsset) || {asset_id:vehicleAsset,asset_type:"vehicle"};
      const projection = new HomeBrainVehicleAdapter(rt, this.vehicleId(vehicleEntry), { ...this.config, registry_entry:vehicleEntry }).productProjection();
      const model = propertyKey === "vehicle.requested_charge_power_kw"
        ? projection?.configuration?.charge_power_control_model
        : rt.propertyControlModel(vehicleAsset, propertyKey);
      const wrap = btn.closest(".mini-current-stepper");
      const buttons = [...(wrap?.querySelectorAll("button[data-property-step],button[data-charge-power-step],button[data-current-step]") || [])];
      buttons.forEach((b)=>{ b.disabled = true; b.classList.remove("failed"); });
      const ok = await rt.writePropertyControlAsync(model, next);
      if (!ok) {
        buttons.forEach((b)=>{ b.classList.add("failed"); b.title = "Write rejected or canonical readback did not confirm the requested value."; });
      }
      this._forceRender = true;
      this._holdRenderUntil = 0;
      this._lastSignature = "";
      if (this._hass) this.hass = this._hass;
    }));
    this.shadowRoot.querySelectorAll("select[data-property-asset][data-property-key]").forEach((select)=>{
      const hold = ()=>{ this._holdRenderUntil = Date.now() + 1200; };
      select.addEventListener("pointerdown", hold);
      select.addEventListener("focus", hold);
      select.addEventListener("change",async ()=>{
        const assetId = select.getAttribute("data-property-asset") || "";
        const propertyKey = select.getAttribute("data-property-key") || "";
        if (!assetId || !propertyKey || select.disabled) return;
        select.disabled = true;
        select.classList.remove("failed");
        const ok = await rt.writePublishedPropertyAsync(assetId, propertyKey, select.value);
        if (!ok) {
          select.classList.add("failed");
          select.title = "Write rejected or canonical readback did not confirm the selected value.";
        }
        this._forceRender = true;
        this._holdRenderUntil = 0;
        this._lastSignature = "";
        if (this._hass) this.hass = this._hass;
      });
    });
  }

  overviewStyles() { return `
    .intelligence-status-row small{grid-column:2/-1;display:block;min-width:0;margin-top:-2px;font-size:7.5px;line-height:1.05;font-weight:500;color:#8A5A12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n    .appearance-write-error{display:flex;align-items:center;gap:7px;margin:0 2px;padding:8px 10px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:10px;font-weight:600}.appearance-write-error ha-icon{--mdc-icon-size:16px}
    .rhi-page-hero-overview{position:relative;display:block;min-height:clamp(176px,16vw,218px);border:0;border-radius:18px;background:linear-gradient(90deg,#fff 0%,#fff 30%,rgba(255,255,255,.94) 39%,rgba(255,255,255,.18) 60%,rgba(255,255,255,0) 76%);box-shadow:none;overflow:hidden;margin:0}
    .rhi-page-hero-overview:before{display:none}
    .rhi-page-hero-overview .rhi-page-hero-copy{position:relative;z-index:4;width:min(48%,650px);max-width:none;padding:32px 20px 28px 24px}
    .rhi-page-hero-overview .rhi-page-hero-copy>small{font-size:10px;color:#214A86;letter-spacing:.16em}
    .rhi-page-hero-overview .rhi-page-hero-copy h1{font-size:clamp(31px,3.1vw,48px);line-height:.98;letter-spacing:-.048em;color:#08133A;margin:8px 0 10px}
    .rhi-page-hero-overview .rhi-page-hero-copy p{max-width:510px;font-size:clamp(12px,1.15vw,16px);line-height:1.42;color:#536A91;font-weight:500}
    .rhi-page-hero-overview .rhi-page-hero-meta{display:none}
    .rhi-page-hero-overview .rhi-page-hero-art{position:absolute;z-index:1;inset:0 0 0 27%;min-height:0;display:block;overflow:hidden}
    .rhi-page-hero-overview .rhi-page-hero-art:before{content:"";display:block;position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.96) 9%,rgba(255,255,255,.68) 19%,rgba(255,255,255,.13) 37%,rgba(255,255,255,0) 55%)}
    .rhi-page-hero-overview .rhi-page-hero-art img{position:absolute;inset:0;width:100%;height:100%;min-height:0;max-height:none;object-fit:cover;object-position:center 52%;transform:none}

    .ov-domain-statusbar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0}
    .inactive-row.compact-present-row{grid-template-columns:74px 64px minmax(0,1fr) auto;align-items:center;gap:10px}.inactive-photo{height:42px;min-width:62px;display:grid;place-items:center;background:#f2f6fc;border-radius:9px}.inactive-photo img{max-width:62px;max-height:40px;object-fit:contain}.inactive-photo ha-icon{--mdc-icon-size:22px;color:#7b90ad}@media(max-width:560px){.inactive-row.compact-present-row{grid-template-columns:52px 48px minmax(0,1fr) auto;gap:5px}.inactive-photo{min-width:42px;height:38px}.inactive-photo img{max-width:42px;max-height:36px}}
    .ov-inactive-summary{margin-top:10px;padding:10px;border:1px solid #e0e8f2;border-radius:14px;background:#fcfdff}.ov-inactive-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}.ov-inactive-title strong{font-size:13px;color:#132744}.ov-inactive-title span{font-size:11px;color:#66748d}.ov-inactive-summary .inactive-list{gap:5px}.ov-inactive-summary .inactive-row{min-height:52px;padding:7px 10px}
    .ov-domain-statusbar .ov-status-item{min-width:0;min-height:94px;display:grid;grid-template-columns:52px minmax(0,1fr);gap:11px;align-items:center;padding:12px 14px;border:1px solid #DBE6F3;border-radius:15px;background:rgba(255,255,255,.97);box-shadow:0 8px 22px rgba(21,61,115,.045)}
    .ov-domain-statusbar .ov-status-icon{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#EEF5FF;color:#1467F5}
    .ov-domain-statusbar .ov-status-icon ha-icon{--mdc-icon-size:27px}
    .ov-domain-statusbar .charging .ov-status-icon{background:#EEF5FF;color:#1467F5}
    .ov-domain-statusbar .range.warn .ov-status-icon,.ov-domain-statusbar .security.warn .ov-status-icon,.ov-domain-statusbar .maintenance.warn .ov-status-icon{background:#FFF4E8;color:#FF7500}
    .ov-domain-statusbar .ov-status-item>div{min-width:0;display:block}
    .ov-domain-statusbar small{display:block;margin:0 0 3px;color:#31558E;font-size:10px;font-weight:650}
    .ov-domain-statusbar b{display:block;margin:0 0 3px;color:#0B173D;font-size:clamp(14px,1.25vw,18px);font-weight:720;line-height:1.08;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ov-domain-statusbar .range.warn b,.ov-domain-statusbar .security.warn b,.ov-domain-statusbar .maintenance.warn b{color:#F05B0A}
    .ov-domain-statusbar em{display:block;margin-top:2px;color:#55709B;font-size:10px;font-style:normal;font-weight:500;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    .ov-quickbar{margin:0;min-height:52px;padding:6px 10px;border:1px solid #DBE6F3;border-radius:14px;background:#fff;box-shadow:0 5px 16px rgba(21,61,115,.03)}
    .ov-quick-title{font-size:9.5px;letter-spacing:.13em;color:#31558E}
    .ov-nav-action{height:40px;min-height:40px;border:1px solid #D8E4F1;background:#fff;color:#075FD8;box-shadow:none;font-size:11px;font-weight:660}
    .ov-nav-action.primary{background:#0B66F6;border-color:#0B66F6;color:#fff}

    .ov-overview-vehicles{margin:0;padding:14px 16px 12px;border:1px solid #DDE7F2;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(21,61,115,.04)}
    .ov-overview-vehicles .ov-panel-head{margin:0 0 8px}
    .ov-overview-vehicles .ov-panel-head h2{font-size:24px;color:#08133A}
    .ov-overview-vehicles .ov-panel-head p{font-size:11px;color:#56709A}
    .ov-overview-vehicles .ov-panel-head button{height:38px;border:1px solid #DCE7F4;border-radius:11px;background:#fff;color:#075FD8;font-weight:650}
    .ov-overview-vehicles .ov-vehicle-list{display:grid;gap:7px}
    .ov-overview-vehicles .ov-vehicle-row{min-height:82px;border:1px solid #DFE8F3;border-radius:13px;background:#fff;box-shadow:none;padding:7px 9px}
    .ov-overview-vehicles .ov-vehicle-image{width:74px;height:48px}
    .ov-overview-vehicles .ov-vehicle-copy b{font-size:13px;color:#0A173B}
    .ov-overview-vehicles .ov-vehicle-copy small,.ov-overview-vehicles .ov-signal span,.ov-overview-vehicles .ov-charging-state{font-size:9px;color:#6680A6}
    .ov-overview-vehicles .ov-signal b{font-size:10.5px}
    .ov-overview-vehicles .mini-control.charger-select{min-height:34px;border-radius:9px}
    .ov-overview-vehicles .ov-row-actions .cmd,.ov-overview-vehicles .ov-row-actions .action{height:34px;min-height:34px;font-size:10px}

    @media(max-width:1024px){
      .rhi-page-hero-overview{min-height:188px}
      .rhi-page-hero-overview .rhi-page-hero-copy{width:50%;padding:26px 16px 22px 18px}
      .rhi-page-hero-overview .rhi-page-hero-art{inset:0 0 0 30%}
      .ov-domain-statusbar .ov-status-item{grid-template-columns:42px minmax(0,1fr);padding:10px;min-height:88px}
      .ov-domain-statusbar .ov-status-icon{width:40px;height:40px}
    }
    @media(max-width:760px){
      .rhi-page-hero-overview{min-height:164px;border-radius:15px}
      .rhi-page-hero-overview .rhi-page-hero-copy{width:62%;padding:20px 12px 18px 13px}
      .rhi-page-hero-overview .rhi-page-hero-copy h1{font-size:27px}
      .rhi-page-hero-overview .rhi-page-hero-copy p{font-size:10.5px;max-width:360px}
      .rhi-page-hero-overview .rhi-page-hero-art{inset:0 0 0 38%}
      .rhi-page-hero-overview .rhi-page-hero-art:before{background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.92) 18%,rgba(255,255,255,.25) 47%,transparent 70%)}
      .ov-domain-statusbar{grid-template-columns:repeat(2,minmax(0,1fr))}
      .ov-domain-statusbar .ov-status-item{min-height:82px}
      .ov-quickbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
      .ov-quick-title{grid-column:1/-1}
    }
    @media(max-width:430px){
      .rhi-page-hero-overview{min-height:150px}
      .rhi-page-hero-overview .rhi-page-hero-copy{width:70%;padding:17px 10px 14px}
      .rhi-page-hero-overview .rhi-page-hero-copy h1{font-size:24px}
      .rhi-page-hero-overview .rhi-page-hero-copy p{font-size:9.5px;-webkit-line-clamp:3}
      .rhi-page-hero-overview .rhi-page-hero-art{inset:0 0 0 43%}
      .ov-domain-statusbar{grid-template-columns:1fr}
      .ov-domain-statusbar .ov-status-item{grid-template-columns:40px minmax(0,1fr);min-height:72px}
      .ov-overview-vehicles{padding:11px 9px}
    }
  `; }

  styles() { return `
    :host{--hb-blue:#1467F5;--hb-ink:#061226;--hb-muted:#63718A;--hb-line:#E4ECF7;--hb-soft:#F6FAFF;--hb-shadow:0 22px 60px rgba(15,35,80,.08);color:var(--hb-ink);user-select:text;-webkit-user-select:text}
    *{user-select:text;-webkit-user-select:text} button,select,input,img,ha-icon{user-select:none;-webkit-user-select:none}
    ha-card{background:transparent;border:0;box-shadow:none}.page{position:relative;width:min(100%,1680px);margin:0 auto;padding:18px 34px 38px;display:grid;gap:12px;box-sizing:border-box}.release-badge{position:absolute;top:10px;right:34px;border:1px solid rgba(14,35,72,.10);background:#fff;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:650;color:#33415C;box-shadow:0 8px 20px rgba(15,35,80,.055)}.eyebrow{margin:0 0 6px;color:#1467F5;font-size:12px;font-weight:650;letter-spacing:.12em}.title h1{font-size:38px;letter-spacing:-.055em;margin:0 0 6px;font-weight:650}.title p{margin:0;color:#34405A;font-weight:600}.top-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.summary{border:1px solid var(--hb-line);border-radius:22px;background:#fff;box-shadow:var(--hb-shadow);min-height:108px;padding:20px;display:grid;grid-template-columns:56px 1fr;gap:16px;align-items:center}.summary.attention{border-color:rgba(245,143,32,.30);background:linear-gradient(135deg,#FFFAF2,#fff)}.summary.recommendation{border-color:rgba(20,103,245,.22);background:linear-gradient(135deg,#F5FAFF,#fff)}.summary-icon{width:52px;height:52px;border-radius:16px;background:rgba(255,145,0,.12);display:flex;align-items:center;justify-content:center;color:#F28C00}.summary-icon.blue{background:#1467F5;color:#fff}.summary-icon ha-icon{--mdc-icon-size:30px}.summary h3,.info h3{margin:0 0 8px;font-size:16px;font-weight:650}.summary ul,.info ul{list-style:none;margin:0;padding:0}.summary li{display:flex;flex-direction:column;gap:3px;border-top:1px solid rgba(14,35,72,.06);padding:7px 0;font-size:13px;color:#34405A;font-weight:600}.summary li.clear b{color:#087A35}.section-title{display:flex;align-items:end;justify-content:space-between;margin:0 2px -8px}.section-title h2{font-size:20px;letter-spacing:-.035em;margin:0;font-weight:650}.section-title span{font-size:12px;font-weight:650;color:#6A768D;background:#F4F7FB;border:1px solid var(--hb-line);border-radius:999px;padding:5px 9px}.vehicles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.vehicle-card{background:#fff;border:1px solid var(--hb-line);border-radius:24px;box-shadow:var(--hb-shadow);overflow:hidden}.premium-vehicle-card{display:grid;gap:0}.status-top-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:16px 18px 8px}.status-row{display:flex;align-items:center;justify-content:center;gap:7px;min-height:40px;border:1px solid var(--hb-line);border-radius:14px;background:#fff;min-width:0}.status-row span{display:none}.status-row ha-icon{--mdc-icon-size:18px;color:#17233B;flex:0 0 auto}.vehicle-intelligence-strip .intelligence-status-row{display:grid;grid-template-columns:20px minmax(0,1fr);grid-template-rows:auto auto;justify-content:stretch;align-content:center;column-gap:7px;row-gap:1px;padding:5px 8px;min-height:40px}.vehicle-intelligence-strip .intelligence-status-row ha-icon{grid-row:1 / span 2;align-self:center}.vehicle-intelligence-strip .intelligence-status-row span{display:block;grid-column:2;font-size:9px;line-height:1;color:#6A768D;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vehicle-intelligence-strip .intelligence-status-row .pill{grid-column:2;justify-content:flex-start;min-width:0;padding:3px 7px;font-size:10px}.pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:6px 10px;min-width:72px;max-width:100%;font-size:10px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pill.ok{background:#E7F6EA;color:#087A35}.pill.warn{background:#FFF1D9;color:#B76500}.pill.bad{background:#FDE4E4;color:#C21E1E}.pill.muted{background:#EEF1F6;color:#64708A}.hero-split-row{display:grid;grid-template-columns:2fr 1fr;gap:12px;padding:8px 18px 12px;align-items:stretch}.vehicle-hero-panel{display:grid;grid-template-columns:minmax(0,.86fr) minmax(220px,1.14fr);gap:12px;min-height:170px;border:1px solid rgba(14,35,72,.06);border-radius:18px;background:linear-gradient(135deg,#fff,#F8FBFF);padding:18px;overflow:hidden}.vehicle-copy h2{font-size:25px;margin:0 0 4px;font-weight:650;letter-spacing:-.045em}.vehicle-copy p{margin:0;color:#34405A;font-weight:600}.vehicle-image{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at center,rgba(20,103,245,.09),transparent 62%);min-width:0}.vehicle-image img{max-width:100%;max-height:176px;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(15,35,80,.16))}.vehicle-image ha-icon{--mdc-icon-size:76px;color:#B8C3D6}.charger-hero-panel{border:1px solid var(--hb-line);border-radius:18px;background:linear-gradient(135deg,#F8FBFF,#fff);padding:14px;display:grid;grid-template-rows:auto 1fr;gap:8px;align-items:center;min-width:0}.charger-mini-image{height:118px;border-radius:16px;background:radial-gradient(circle at center,rgba(20,103,245,.10),transparent 65%);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}.charger-mini-image img{max-width:100%;max-height:112px;object-fit:contain;filter:drop-shadow(0 14px 24px rgba(15,35,80,.13))}.charger-mini-image ha-icon{display:none;--mdc-icon-size:46px;color:#8EA1BE}.charger-mini-image.image-missing ha-icon{display:block}.charger-mini-copy{display:flex;flex-direction:column;gap:2px;min-width:0}.charger-mini-copy b{font-size:15px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.charger-mini-copy span{display:none}.relationship-lines{display:flex;flex-direction:column;gap:2px;margin-top:6px;font-size:10.5px;color:#64708A;font-weight:500;line-height:1.25}.relationship-lines span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vehicle-control-row{display:grid;grid-template-columns:minmax(320px,1fr) minmax(420px,.95fr);gap:12px;padding:0 18px 12px;align-items:stretch}.vehicle-metrics-strip,.charge-mini-strip{display:grid;gap:8px}.vehicle-metrics-strip{grid-template-columns:repeat(3,minmax(92px,1fr))}.charge-mini-strip{grid-template-columns:minmax(170px,1.2fr) minmax(190px,1fr) minmax(110px,.7fr)}.metric-chip,.mini-control{min-height:42px;border:1px solid var(--hb-line);border-radius:13px;background:#fff;display:flex;align-items:center;gap:8px;padding:0 12px;min-width:0}.metric-chip{flex-direction:column;align-items:flex-start;justify-content:center;gap:2px}.metric-chip span{color:var(--hb-muted);font-size:10px;text-transform:uppercase;font-weight:650}.metric-chip b,.mini-control strong{font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mini-control ha-icon{--mdc-icon-size:18px;color:var(--hb-blue);flex:0 0 auto}.charger-select select{width:100%;border:0;background:transparent;font-weight:650;color:#17233B;min-width:0;outline:0}.charger-select.readonly{opacity:.72}.current-edit input{width:54px;min-width:0;border:0;background:transparent;font-weight:650;color:#061226;outline:0;text-align:right}.current-edit span{font-weight:650;color:#63718A}.inline-apply{border:1px solid rgba(14,35,72,.10);background:#fff;border-radius:10px;padding:6px 8px;font-size:11px;font-weight:650;color:#1467F5;cursor:pointer}.inline-apply:disabled{opacity:.38;cursor:not-allowed}.power-read{justify-content:flex-start}.vehicle-actions{border-top:1px solid rgba(14,35,72,.07);display:grid;grid-template-columns:1.05fr 1fr 1fr 1fr;gap:8px;padding:11px 18px}.clean-actions .details-action{margin-left:auto;width:100%}.action{min-height:42px;border:1px solid rgba(14,35,72,.11);border-radius:13px;background:#fff;color:var(--hb-ink);font-weight:650;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;box-shadow:0 10px 24px rgba(15,35,80,.035)}.action ha-icon{--mdc-icon-size:18px;color:var(--hb-blue)}.action.primary-charge{background:linear-gradient(135deg,#1467F5,#3B82F6);border-color:#1467F5;color:#fff}.action.primary-charge ha-icon{color:#fff}.action.sent{background:#EEF5FF;border-color:#CFE0FF;color:#0B4BC1}.action.busy{background:#FFF8E8}.action.failed{background:#FEF3F2;color:#B42318}.action:disabled{opacity:.55;cursor:not-allowed}.action.activate-soft{opacity:1;cursor:pointer}.inactive-list{display:grid;gap:10px}.inactive-row{background:#fff;border:1px solid var(--hb-line);border-radius:18px;box-shadow:0 12px 36px rgba(15,35,80,.055);padding:10px 12px;display:grid;grid-template-columns:78px 1fr auto;gap:14px;align-items:center}.inactive-image{width:78px;height:52px;border-radius:14px;background:#F4F8FF;display:flex;align-items:center;justify-content:center;overflow:hidden}.inactive-image img{max-width:100%;max-height:64px;object-fit:contain;filter:grayscale(.25) opacity(.82)}.inactive-image ha-icon{--mdc-icon-size:34px;color:#9AABC5}.inactive-copy h3{margin:0 0 2px;font-size:16px;font-weight:650}.inactive-copy p{margin:0;color:#64708A;font-weight:600}.inactive-actions{display:flex;gap:8px}.bottom-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.info{background:#fff;border:1px solid var(--hb-line);border-radius:18px;box-shadow:var(--hb-shadow);padding:18px;min-height:100px}.info h3{display:flex;align-items:center;gap:10px}.info h3 ha-icon{--mdc-icon-size:22px;color:var(--hb-blue)}.info p,.info li{color:#34405A;font-weight:600}.empty{grid-column:1/-1;border:1px dashed #CBD5E1;border-radius:18px;background:#fff;padding:28px;color:var(--hb-muted);font-weight:600;text-align:center}.domain-tabs-wrap{margin:8px 0 8px}.dashboard-status-strip.outcome-header{margin:8px 0 6px}.section-title{margin:0 2px -4px}.title h1{margin-bottom:3px}.title p{margin-bottom:0}@media(max-width:1500px){.vehicles{grid-template-columns:1fr}.vehicle-hero-panel{grid-template-columns:1fr 1.25fr}}@media(max-width:900px){.top-grid,.bottom-grid{grid-template-columns:1fr}.hero-split-row,.vehicle-control-row{grid-template-columns:1fr}.vehicle-hero-panel{grid-template-columns:1fr}.vehicle-actions{grid-template-columns:repeat(2,1fr)}.inactive-row{grid-template-columns:70px 1fr}.inactive-actions{grid-column:1/-1}.charge-mini-strip{grid-template-columns:1fr 1fr 1fr}.vehicle-image{min-height:150px}.status-top-row{grid-template-columns:repeat(5,minmax(54px,1fr));overflow:auto;padding-bottom:8px}}@media(max-width:640px){.page{padding:16px}.summary{grid-template-columns:1fr}.vehicle-metrics-strip,.charge-mini-strip,.vehicle-actions{grid-template-columns:1fr}.inactive-actions{flex-direction:column}.hero-split-row,.vehicle-control-row,.status-top-row{padding-left:12px;padding-right:12px}.pill{min-width:58px;font-size:9px}.vehicle-copy h2{font-size:22px}}
    /* 2.3.9 mock-aligned dashboard overrides */
    .hi-contract-warning{border:1px solid rgba(245,158,11,.32);background:#FFFBEB;color:#6B3F00;border-radius:16px;padding:10px 14px;font-size:12px;font-weight:600;display:grid;gap:6px;box-shadow:0 12px 28px rgba(80,55,0,.05)}.hi-contract-warning strong{font-weight:650}.hi-contract-warning-list{display:flex;flex-wrap:wrap;gap:6px}.hi-contract-warning-list span{border:1px solid rgba(245,158,11,.25);background:#fff;border-radius:999px;padding:4px 8px;font-weight:600;color:#7A4B00}
    .release-badge{display:grid;gap:2px;place-items:center;padding:8px 13px;border-radius:16px;font-size:13px}.release-badge b{font-size:16px;color:#1467F5}.release-badge span{font-size:12px;color:#33415C;font-weight:650}.vehicles{grid-template-columns:repeat(2,minmax(560px,1fr));gap:12px}.vehicle-card{border-radius:22px}.status-top-row{padding:12px 14px 8px;gap:8px}.status-row{min-height:36px;border-radius:999px;justify-content:flex-start;padding:0 12px}.status-row span{display:none}.pill{min-width:86px;font-size:11px;padding:7px 12px}.hero-split-row{grid-template-columns:2.35fr 1fr;padding:6px 14px 8px;gap:12px}.vehicle-hero-panel{grid-template-columns:.62fr 1.38fr;min-height:205px;padding:22px;border-radius:18px}.vehicle-copy h2{font-size:27px}.vehicle-image img{max-height:230px;transform:scale(1.15);transform-origin:center;max-width:105%}.charger-hero-panel{min-height:205px;border-radius:18px;padding:16px}.charger-mini-image{height:128px}.charger-mini-image img{max-width:142px;max-height:126px}.vehicle-control-row.mock-row{grid-template-columns:minmax(330px,1.35fr) minmax(250px,.9fr);padding:0 14px 10px;gap:10px}.vehicle-metrics-strip.mock-metrics{grid-template-columns:repeat(3,minmax(100px,1fr));gap:0;border:1px solid var(--hb-line);border-radius:16px;overflow:hidden;background:#fff}.vehicle-metrics-strip.mock-metrics .metric-chip{border:0;border-right:1px solid var(--hb-line);border-radius:0;min-height:62px;padding:10px 14px}.vehicle-metrics-strip.mock-metrics .metric-chip:last-child{border-right:0}.metric-chip span{font-size:11px}.metric-chip b{font-size:21px}.battery-chip{position:relative}.battery-chip i{position:absolute;right:16px;bottom:16px;width:26px;height:8px;border-radius:999px;background:linear-gradient(90deg,#2CBF61 60%,#DCEBE2 60%)}.charge-mini-strip.mock-controls{grid-template-columns:minmax(148px,1fr) minmax(164px,1fr);gap:10px}.mini-control,.mini-current-stepper{min-height:62px;border:1px solid var(--hb-line);border-radius:16px;background:#fff;display:flex;align-items:center;gap:10px;padding:0 12px;min-width:0}.charger-select select{font-size:14px}.mini-current-stepper ha-icon,.mini-control ha-icon{--mdc-icon-size:22px;color:#1467F5}.mini-current-stepper strong{font-size:18px;min-width:48px;text-align:center}.mini-current-stepper small{font-size:11px;color:#63718A;font-weight:600}.round-step{width:34px;height:34px;border-radius:999px;border:1px solid var(--hb-line);background:#F6FAFF;color:#1467F5;font-size:22px;font-weight:650;line-height:1;cursor:pointer}.mini-current-stepper.readonly{opacity:.55;justify-content:center}.mini-current-stepper.readonly .round-step{display:none}.power-read{display:none}.vehicle-actions{grid-template-columns:1.05fr 1fr 1fr .9fr .95fr;padding:10px 14px 14px;gap:10px}.action{min-height:43px;border-radius:14px;font-size:14px}.danger-action{border-color:rgba(230,57,70,.35);color:#D11A2A;background:#FFF3F3}.danger-action ha-icon{color:#D11A2A}.inactive-row{grid-template-columns:auto 1fr auto;border-radius:16px}.inactive-image{display:none}.debt-strip{display:flex;align-items:center;gap:14px;background:#F8FBFF;border:1px solid #DDEAFF;border-radius:18px;padding:12px 18px;color:#45536C;font-size:13px;font-weight:600}.debt-strip ha-icon{color:#1467F5}.debt-strip span:before{content:"•";margin-right:12px;color:#8EA1BE}@media(max-width:1300px){.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:240px}}@media(max-width:760px){.hero-split-row,.vehicle-control-row.mock-row{grid-template-columns:1fr}.vehicle-hero-panel{grid-template-columns:1fr}.vehicle-actions{grid-template-columns:1fr 1fr}.debt-strip{flex-wrap:wrap}.charge-mini-strip.mock-controls{grid-template-columns:1fr}}

    /* 2.3.9 compact mock implementation and technical-debt burn-down */

    .hi-version-block{
      position:absolute;
      top:26px;
      right:28px;
      text-align:right;
      font-size:10.5px;
      line-height:1.25;
      font-weight:400;
      color:var(--secondary-text-color,#6B7280);
      opacity:.82;
      background:none;
      border:0;
      box-shadow:none;
      padding:0;
      margin:0;
      z-index:2;
      pointer-events:none;
    }
    .release-badge{display:none;}.hi-version-block{display:none;}

    .page{width:min(100%,1640px);padding:24px 28px 38px;gap:16px}.title{margin-bottom:0}.title h1{font-size:38px}.top-grid{gap:16px}.summary{min-height:116px;padding:20px 24px;align-items:center}.summary h3{margin:0 0 8px}.summary-icon{width:58px;height:58px}.section-title{margin-top:0}.vehicles{gap:16px}.vehicle-card{border-radius:20px;overflow:hidden}.status-top-row{padding:10px 12px 6px;gap:7px;grid-template-columns:repeat(5,minmax(0,1fr))}.status-row{min-height:34px;padding:0 10px}.status-row ha-icon{--mdc-icon-size:18px}.pill{min-width:0;width:100%;font-size:10.5px;padding:7px 9px}.hero-split-row{grid-template-columns:minmax(0,2.45fr) minmax(180px,.85fr);padding:6px 12px 6px;gap:10px}.vehicle-hero-panel{min-height:215px;padding:20px;border-radius:16px;grid-template-columns:.54fr 1.46fr}.vehicle-copy h2{font-size:28px;line-height:1.02}.vehicle-copy p{font-size:14px}.vehicle-image{min-height:170px}.vehicle-image img{max-height:270px;transform:scale(1.28);max-width:118%}.charger-hero-panel{min-height:215px;padding:14px;border-radius:16px}.charger-mini-image{height:135px}.charger-mini-image img{max-width:154px;max-height:132px}.vehicle-control-row.mock-row{grid-template-columns:minmax(240px,.92fr) minmax(330px,1.08fr);padding:0 12px 8px;gap:8px;align-items:stretch}.vehicle-metrics-strip.mock-metrics{grid-template-columns:repeat(3,minmax(70px,1fr));height:56px}.vehicle-metrics-strip.mock-metrics .metric-chip{min-height:54px;padding:7px 10px}.metric-chip span{font-size:9.5px}.metric-chip b{font-size:18px}.battery-chip i{right:10px;bottom:12px;width:22px;height:7px}.charge-mini-strip.mock-controls{grid-template-columns:minmax(160px,1.15fr) minmax(190px,1fr);gap:8px;height:56px}.mini-control,.mini-current-stepper{min-height:54px;height:56px;border-radius:14px;padding:0 10px}.charger-select select{font-size:13.5px}.mini-current-stepper strong{font-size:16px}.mini-current-stepper small{font-size:10px}.round-step{width:30px;height:30px;font-size:20px}.vehicle-actions{grid-template-columns:1.05fr 1fr .85fr .82fr .9fr;padding:9px 12px 12px;gap:8px}.action{min-height:40px;border-radius:13px;font-size:13.5px}.inactive-row{min-height:62px;padding:10px 16px;grid-template-columns:82px 1fr auto}.inactive-state{background:#EEF2F7;color:#53627A;border-radius:999px;font-weight:650;font-size:12px;padding:7px 10px;text-align:center}.compact-present-row .action{min-width:118px}.debt-strip{font-size:12px;padding:10px 14px}.bottom-grid{display:none}.domain-tabs-wrap{margin:8px 0 8px}.dashboard-status-strip.outcome-header{margin:8px 0 6px}.section-title{margin:0 2px -4px}.title h1{margin-bottom:3px}.title p{margin-bottom:0}@media(max-width:1500px){.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:290px}.hero-split-row{grid-template-columns:minmax(0,2.3fr) minmax(190px,.9fr)}}@media(max-width:760px){.vehicle-control-row.mock-row{grid-template-columns:1fr}.charge-mini-strip.mock-controls{grid-template-columns:1fr 1fr}.vehicle-actions{grid-template-columns:1fr 1fr}.vehicle-image img{transform:scale(1.12)}}


    /* 2.3.9 contract-catalog aligned compact dashboard */
    .page{width:min(100%,1560px);padding:18px 26px 30px;gap:14px}.top-grid{gap:14px}.summary{min-height:104px;padding:18px 22px;display:grid;grid-template-columns:64px 1fr;align-items:center}.summary h3{margin:0 0 6px}.summary ul{margin:0;padding:0;list-style:none}.summary li{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:baseline}.summary li span{font-size:13px}.summary-icon{width:54px;height:54px}.vehicles{gap:14px}.vehicle-card{border-radius:20px}.status-top-row{padding:10px 12px 6px;gap:7px}.status-row{min-height:32px;padding:0 9px}.pill{font-size:10.5px;padding:6px 9px}.hero-split-row{grid-template-columns:minmax(0,2.7fr) minmax(160px,.85fr);gap:10px;padding:5px 12px 8px}.vehicle-hero-panel{min-height:188px;padding:18px;grid-template-columns:.50fr 1.50fr}.vehicle-copy h2{font-size:27px}.vehicle-image img{max-height:258px;transform:scale(1.24);max-width:116%}.charger-hero-panel{min-height:188px;padding:13px}.charger-mini-image{height:112px}.charger-mini-image img{max-width:138px;max-height:110px}.vehicle-control-row.mock-row{grid-template-columns:minmax(250px,.86fr) minmax(360px,1.14fr);padding:0 12px 8px;gap:8px;align-items:stretch}.vehicle-metrics-strip.mock-metrics{grid-template-columns:.9fr .8fr .75fr;height:48px}.vehicle-metrics-strip.mock-metrics .metric-chip{min-height:48px;padding:6px 10px}.metric-chip span{font-size:9px}.metric-chip b{font-size:17px}.charge-mini-strip.mock-controls{grid-template-columns:minmax(170px,1.25fr) minmax(150px,.95fr) minmax(86px,.65fr);gap:8px;height:48px}.charge-mini-strip.mock-controls.no-speed{grid-template-columns:minmax(190px,1fr) minmax(86px,.46fr)}.mini-control,.mini-current-stepper,.mini-power-read{min-height:48px;height:48px;border:1px solid var(--hb-line);border-radius:13px;background:#fff;display:flex;align-items:center;gap:8px;padding:0 10px;min-width:0}.mini-power-read ha-icon,.mini-current-stepper ha-icon,.mini-control ha-icon{--mdc-icon-size:20px;color:#1467F5}.mini-power-read strong,.mini-current-stepper strong{font-size:15px;font-weight:650;white-space:nowrap}.charger-select select{font-size:13px;max-width:100%}.charger-select .relationship-copy{min-width:0;display:grid;gap:2px;flex:1}.charger-select .relationship-copy small{font-size:8.5px;line-height:1;color:#64708A;font-weight:650;white-space:nowrap}.charger-select .relationship-copy strong{font-size:12px;line-height:1.15;white-space:normal;overflow-wrap:anywhere}.charger-select.writable select{width:100%;min-width:0}.round-step{width:28px;height:28px;font-size:19px}.mini-current-stepper small{display:none}.vehicle-actions{grid-template-columns:1.05fr 1fr .95fr .85fr .95fr;padding:8px 12px 12px;gap:8px}.action{min-height:38px;border-radius:13px;font-size:13px}.section-title{margin-top:0}.inactive-row{min-height:56px;padding:8px 14px}.debt-strip{margin-top:0;font-size:12px;padding:9px 14px}@media(max-width:1380px){.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:270px}.hero-split-row{grid-template-columns:minmax(0,2.45fr) minmax(170px,.9fr)}}@media(max-width:820px){.vehicle-control-row.mock-row,.hero-split-row{grid-template-columns:1fr}.charge-mini-strip.mock-controls,.charge-mini-strip.mock-controls.no-speed{grid-template-columns:1fr}.vehicle-actions{grid-template-columns:1fr 1fr}.vehicle-image img{transform:scale(1.10)}}


    /* 2.4.0 dashboard stabilization: compact cockpit, restored footer and icon navigation */
    .page{width:min(100%,1560px);padding:16px 24px 30px;gap:10px}.top-grid{gap:14px}.summary{min-height:96px;padding:16px 20px;align-items:center}.summary h3{margin:0 0 6px}.summary li{padding:5px 0}.vehicles{gap:14px}.vehicle-card{border-radius:20px}.hero-split-row{grid-template-columns:minmax(0,2.55fr) minmax(155px,.75fr);gap:9px;padding:5px 12px 8px}.vehicle-hero-panel{min-height:190px;padding:17px;grid-template-columns:.47fr 1.53fr}.vehicle-copy h2{font-size:27px}.vehicle-copy p{font-size:13px}.vehicle-image img{max-height:278px;transform:scale(1.33);max-width:122%}.charger-hero-panel{min-height:190px;padding:12px}.charger-mini-image{height:112px}.charger-mini-image img{max-width:142px;max-height:112px}.vehicle-control-row.mock-row{grid-template-columns:minmax(210px,.70fr) minmax(430px,1.30fr);padding:0 12px 8px;gap:8px}.vehicle-metrics-strip.mock-metrics{grid-template-columns:.85fr .75fr .70fr;height:44px}.vehicle-metrics-strip.mock-metrics .metric-chip{min-height:44px;padding:5px 9px}.metric-chip span{font-size:8.5px}.metric-chip b{font-size:16px}.battery-chip i{right:9px;bottom:10px;width:20px;height:7px}.charge-mini-strip.mock-controls{grid-template-columns:minmax(150px,1.25fr) minmax(118px,.82fr) minmax(126px,.95fr) minmax(78px,.48fr);height:44px;gap:7px}.charge-mini-strip.no-mode{grid-template-columns:minmax(170px,1.35fr) minmax(126px,.95fr) minmax(78px,.48fr)}.charge-mini-strip.no-speed{grid-template-columns:minmax(180px,1fr) minmax(118px,.75fr) minmax(78px,.40fr)}.charge-mini-strip.no-speed.no-mode{grid-template-columns:minmax(190px,1fr) minmax(78px,.35fr)}.mini-control,.mini-current-stepper,.mini-power-read{height:44px;min-height:44px;border-radius:13px;padding:0 9px}.charger-select select,.mode-select select{font-size:12.5px}.mini-current-stepper strong,.mini-power-read strong{font-size:14px}.round-step{width:27px;height:27px;font-size:18px}.vehicle-actions{grid-template-columns:minmax(138px,1.05fr) minmax(130px,1fr) minmax(110px,.85fr) 1fr minmax(54px,.32fr) 42px;padding:8px 12px 12px;gap:8px}.action{min-height:38px;border-radius:13px;font-size:13px}.action-spacer{display:block}.icon-only{width:42px;min-width:42px;max-width:42px;padding:0}.icon-only span{display:none}.icon-only ha-icon{margin:0}.presence-toggle{background:#fff;color:#1467F5;border-color:var(--hb-line)}.presence-toggle ha-icon{color:#1467F5}.details-action{background:#fff;color:#1467F5}.details-action ha-icon{color:#1467F5}.inactive-actions .icon-only{width:42px}.bottom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.info{background:#fff;border:1px solid var(--hb-line);border-radius:18px;box-shadow:0 14px 34px rgba(15,35,80,.055);padding:14px 16px;min-height:82px}.info h3{display:flex;align-items:center;gap:8px;font-size:15px;margin:0 0 8px}.info h3 ha-icon{color:#1467F5}.info p,.info li{font-size:12px;font-weight:600;color:#34405A}.debt-strip{display:none}@media(max-width:1380px){.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:285px}.hero-split-row{grid-template-columns:minmax(0,2.45fr) minmax(170px,.9fr)}}@media(max-width:860px){.top-grid,.vehicles,.hero-split-row,.vehicle-control-row.mock-row,.bottom-grid{grid-template-columns:1fr}.charge-mini-strip.mock-controls,.charge-mini-strip.no-mode,.charge-mini-strip.no-speed,.charge-mini-strip.no-speed.no-mode{grid-template-columns:1fr 1fr}.vehicle-actions{grid-template-columns:1fr 1fr 1fr minmax(54px,.35fr) 42px}.action-spacer{display:none}.vehicle-image img{transform:scale(1.12)}}


    /* 2.4.0 dashboard stabilization: density, alignment and unified controls */
    .page{width:calc(100% - 96px);max-width:1720px;margin:0 auto 0 48px;padding:18px 22px 30px;gap:12px;}
    .release-badge{top:6px;right:24px;min-width:58px;text-align:center;}
    .title h1{font-size:38px;margin-bottom:6px}.title p{font-size:14px}
    .top-grid{gap:12px;align-items:stretch}.summary{min-height:86px;padding:14px 18px;grid-template-columns:52px 1fr;gap:14px;align-items:center}.summary-icon{width:50px;height:50px;border-radius:16px}.summary h3{margin:0 0 5px;font-size:15px}.summary li{padding:4px 0;font-size:12px;display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:baseline}
    .section-title{margin:0 2px -7px}.section-title h2{font-size:19px}.vehicles{gap:12px}.vehicle-card{border-radius:21px}.status-top-row{padding:8px 10px 5px;gap:6px}.status-row{min-height:30px;border-radius:12px;padding:0 7px}.status-row ha-icon{--mdc-icon-size:16px}.pill{font-size:9.8px;padding:5px 8px;min-width:0;width:100%;}
    .hero-split-row{grid-template-columns:minmax(0,2.72fr) minmax(148px,.72fr);gap:8px;padding:4px 10px 6px;align-items:stretch}.vehicle-hero-panel{min-height:178px;padding:14px;border-radius:16px;grid-template-columns:.36fr 1.64fr;gap:8px}.vehicle-copy h2{font-size:25px;line-height:1.02;margin-bottom:4px}.vehicle-copy p{font-size:12px}.vehicle-image{justify-content:flex-start;align-items:center;overflow:visible;min-height:150px}.vehicle-image img{max-height:294px;max-width:126%;transform:translateX(-10px) scale(1.24);object-fit:contain}.charger-hero-panel{min-height:178px;border-radius:16px;padding:11px}.charger-mini-image{height:105px;border-radius:14px}.charger-mini-image img{max-width:132px;max-height:104px}.charger-mini-copy b{font-size:14px}.charger-mini-copy span{font-size:11px}
    .vehicle-control-row.mock-row{grid-template-columns:minmax(185px,.55fr) minmax(470px,1.45fr);gap:6px;padding:0 10px 7px;align-items:stretch}.vehicle-metrics-strip.mock-metrics{height:40px;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.vehicle-metrics-strip.mock-metrics .metric-chip{min-height:40px;height:40px;padding:4px 8px;border-radius:12px}.metric-chip span{font-size:7.8px;letter-spacing:.01em}.metric-chip b{font-size:14px;line-height:1.1}.battery-chip i{width:18px;height:6px;right:7px;bottom:8px}.charge-mini-strip.mock-controls{height:40px;gap:6px;grid-template-columns:minmax(155px,1.16fr) minmax(112px,.84fr) minmax(112px,.78fr) minmax(70px,.42fr)}.charge-mini-strip.no-mode{grid-template-columns:minmax(175px,1.35fr) minmax(112px,.78fr) minmax(70px,.42fr)}.charge-mini-strip.no-speed{grid-template-columns:minmax(185px,1.28fr) minmax(112px,.82fr) minmax(70px,.42fr)}.charge-mini-strip.no-speed.no-mode{grid-template-columns:minmax(200px,1fr) minmax(70px,.35fr)}.mini-control,.mini-current-stepper,.mini-power-read{height:40px;min-height:40px;border-radius:12px;padding:0 8px;gap:6px}.mini-control ha-icon,.mini-current-stepper ha-icon,.mini-power-read ha-icon{--mdc-icon-size:17px}.charger-select select,.mode-select select{font-size:12px}.mini-current-stepper strong,.mini-power-read strong{font-size:13px}.round-step{width:25px;height:25px;font-size:17px}.mini-current-stepper small{display:none}
    .vehicle-actions{grid-template-columns:minmax(125px,1fr) minmax(122px,.96fr) minmax(105px,.84fr) 1fr 38px 38px;padding:7px 10px 10px;gap:7px}.action{min-height:36px;border-radius:12px;font-size:12.5px}.action ha-icon{--mdc-icon-size:17px}.icon-only{width:38px;min-width:38px;max-width:38px}.inactive-row{min-height:54px;padding:8px 12px;grid-template-columns:74px 1fr auto}.inactive-actions{gap:7px}.inactive-actions .icon-only{width:38px}.bottom-grid{gap:12px}.info{min-height:68px;padding:11px 13px;border-radius:16px}.info h3{font-size:14px;margin-bottom:6px}.info p,.info li{font-size:11.5px}.debt-strip{display:none}
    @media(max-width:1580px){.page{width:calc(100% - 56px);margin-left:28px}.vehicles{gap:12px}.vehicle-hero-panel{grid-template-columns:.32fr 1.68fr}.vehicle-image img{max-height:284px;transform:translateX(-14px) scale(1.22)}}
    @media(max-width:1380px){.page{width:min(100%,1280px);margin:0 auto}.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:284px;transform:translateX(-8px) scale(1.18)}}
    @media(max-width:860px){.page{width:100%;margin:0;padding:14px}.top-grid,.vehicles,.hero-split-row,.vehicle-control-row.mock-row,.bottom-grid{grid-template-columns:1fr}.charge-mini-strip.mock-controls,.charge-mini-strip.no-mode,.charge-mini-strip.no-speed,.charge-mini-strip.no-speed.no-mode{grid-template-columns:1fr 1fr}.vehicle-actions{grid-template-columns:1fr 1fr 1fr 38px 38px}.action-spacer{display:none}.vehicle-image img{transform:scale(1.08);max-width:100%}}

    /* 2.4.0 Consistency pass — single dashboard visual system.
       Keep this override near the end so the refactor remains safe while we
       converge duplicate legacy rules into reusable components in 2.4.x. */
    :host{--hb-font-size:13px;--hb-radius-pill:13px;--hb-control-h:38px;--hb-control-pad:0 9px}
    *{box-sizing:border-box}
    .page{width:calc(100vw - 72px);max-width:1640px;margin-left:28px;margin-right:auto;padding:18px 18px 30px;gap:12px}
    .title h1{font-size:36px;line-height:.98;letter-spacing:-.055em}.title p{font-size:13px;font-weight:600}.eyebrow{font-size:11px;letter-spacing:.10em}
    .release-badge{right:22px;top:14px;font-size:12px;padding:8px 12px;border-radius:17px}
    .top-grid{gap:12px}.summary{min-height:84px;padding:13px 18px;grid-template-columns:50px 1fr;gap:14px;border-radius:20px}.summary-icon{width:48px;height:48px;border-radius:15px}.summary h3{font-size:15px;line-height:1.1;margin:0 0 6px}.summary li,.summary li span{font-size:12px;line-height:1.25;font-weight:600}
    .section-title{margin:0 2px -5px}.section-title h2{font-size:18px;line-height:1}.section-title .count{font-size:11px;padding:6px 10px}
    .vehicles{grid-template-columns:repeat(2,minmax(610px,1fr));gap:12px}.vehicle-card{border-radius:20px;overflow:hidden}.status-top-row{padding:8px 10px 5px;gap:6px}.status-row{height:30px;min-height:30px;border-radius:999px;padding:0 8px;display:grid;grid-template-columns:18px 1fr;align-items:center}.status-row ha-icon{--mdc-icon-size:16px}.pill{height:22px;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:650;padding:0 8px;border-radius:999px;line-height:1;white-space:nowrap}
    .hero-split-row{grid-template-columns:minmax(0,2.65fr) minmax(146px,.78fr);gap:8px;padding:4px 10px 6px}.vehicle-hero-panel,.charger-hero-panel{border-radius:16px;border:1px solid var(--hb-line);background:linear-gradient(135deg,#fff,#F8FBFF)}.vehicle-hero-panel{min-height:178px;padding:13px 14px;grid-template-columns:.36fr 1.64fr;gap:6px}.vehicle-copy h2{font-size:25px;line-height:.96;letter-spacing:-.055em;margin:0 0 7px}.vehicle-copy p{font-size:12px;line-height:1.15;font-weight:600}.vehicle-image{justify-content:flex-start;overflow:visible}.vehicle-image img{max-height:286px;max-width:124%;transform:translateX(-18px) scale(1.19);object-fit:contain}.charger-hero-panel{min-height:178px;padding:11px;display:grid;align-content:space-between}.charger-mini-image{height:106px;border-radius:14px}.charger-mini-image img{max-width:132px;max-height:104px}.charger-mini-copy b{font-size:14px;line-height:1.05}.charger-mini-copy span{font-size:11px;font-weight:600}
    .vehicle-control-row.mock-row{grid-template-columns:minmax(178px,.50fr) minmax(500px,1.50fr);gap:6px;padding:0 10px 7px}.vehicle-metrics-strip.mock-metrics{height:38px;grid-template-columns:.95fr .8fr .72fr;gap:0;border:1px solid var(--hb-line);border-radius:12px;overflow:hidden;background:#fff}.vehicle-metrics-strip.mock-metrics .metric-chip{height:38px;min-height:38px;border:0;border-right:1px solid var(--hb-line);border-radius:0;padding:4px 8px;background:#fff}.vehicle-metrics-strip.mock-metrics .metric-chip:last-child{border-right:0}.metric-chip span{font-size:7.5px;line-height:1;text-transform:uppercase;letter-spacing:.045em;color:#64708A;font-weight:650}.metric-chip b{font-size:14px;line-height:1.05;font-weight:650}.battery-chip i{display:none}
    .charge-mini-strip.mock-controls{height:38px;gap:6px;grid-template-columns:minmax(190px,1.35fr) minmax(120px,.86fr) minmax(126px,.88fr) minmax(74px,.45fr);align-items:stretch}.charge-mini-strip.no-mode{grid-template-columns:minmax(218px,1.55fr) minmax(126px,.88fr) minmax(74px,.45fr)}.charge-mini-strip.no-speed{grid-template-columns:minmax(245px,1.65fr) minmax(128px,.85fr) minmax(74px,.45fr)}.charge-mini-strip.no-speed.no-mode{grid-template-columns:minmax(270px,1fr) minmax(74px,.32fr)}.mini-control,.mini-current-stepper,.mini-power-read{height:38px;min-height:38px;border-radius:12px;padding:var(--hb-control-pad);gap:6px;background:#fff;border:1px solid var(--hb-line);overflow:hidden}.mini-control ha-icon,.mini-current-stepper ha-icon,.mini-power-read ha-icon{--mdc-icon-size:17px;flex:0 0 auto;color:#1467F5}.charger-select select,.mode-select select{appearance:none;-webkit-appearance:none;border:0;background:transparent;outline:0;width:100%;min-width:0;font-size:12px;font-weight:650;color:#12213A;line-height:1.1;padding:0 16px 0 0}.charger-select,.mode-select{position:relative}.charger-select:after,.mode-select:after{content:"⌄";position:absolute;right:8px;top:50%;transform:translateY(-52%);font-size:12px;color:#64708A;pointer-events:none}.charger-select option,.mode-select option{font-size:13px;color:#12213A}.mini-current-stepper{display:grid;grid-template-columns:minmax(54px,1fr) 24px 24px;justify-items:center;align-items:center}.mini-current-stepper .current-copy{justify-self:start;display:grid;gap:0;line-height:1.0}.mini-current-stepper strong{font-size:13px;white-space:nowrap}.round-step{width:24px;height:24px;border-radius:999px;font-size:17px}.mini-current-stepper.readonly{grid-template-columns:minmax(54px,1fr)}.mini-power-read strong{font-size:13px;white-space:nowrap}
    .vehicle-actions{grid-template-columns:minmax(122px,1fr) minmax(120px,.96fr) minmax(100px,.82fr) 1fr 38px 38px;padding:7px 10px 10px;gap:7px}.action{height:36px;min-height:36px;border-radius:12px;font-size:12.5px;font-weight:650}.action ha-icon{--mdc-icon-size:17px}.icon-only{width:38px;min-width:38px;max-width:38px}.inactive-row{border-radius:18px;min-height:54px;padding:8px 12px;grid-template-columns:74px 1fr auto}.inactive-actions{gap:7px}.inactive-actions .icon-only{width:38px}.bottom-grid{gap:12px}.info{min-height:66px;padding:11px 13px;border-radius:16px}.info h3{font-size:14px;line-height:1.1;margin-bottom:5px}.info p,.info li{font-size:11.5px;line-height:1.25}.debt-strip{display:none}
    @media(max-width:1500px){.page{width:calc(100vw - 56px);margin-left:20px}.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:286px;transform:translateX(-12px) scale(1.13)}}


    /* 2.4.0 Beta Consolidation — Product-wide visual system
       This block intentionally normalizes dashboard, cards, controls and footer
       using reusable visual primitives. No backend contract changes. */
    :host{
      
      --hb-ink:#06142D; --hb-muted:#66728B; --hb-blue:#1467F5;
      --hb-line:#E4EBF6; --hb-soft-blue:#EEF5FF;
      --hb-card-radius:22px; --hb-pill-radius:14px;
      --hb-control-h:36px; --hb-action-h:38px;
    }
    *{box-sizing:border-box;user-select:text;-webkit-user-select:text}
    ha-card{background:transparent;border:0;box-shadow:none}
    .page{width:calc(100vw - 50px);max-width:1680px;margin:0 0 0 24px;padding:16px 18px 28px;gap:12px}
    .title{display:grid;gap:4px}.title h1{font-size:35px;line-height:.98;margin:0;letter-spacing:-.055em;font-weight:650}.title p{font-size:13px;line-height:1.35;font-weight:600;color:#1D2B45}.eyebrow{font-size:10.5px;line-height:1;letter-spacing:.11em;margin:0 0 3px;color:var(--hb-blue);font-weight:650}.release-badge{top:12px;right:22px;border-radius:17px;padding:8px 12px;background:rgba(255,255,255,.94)}.release-badge b{font-size:13px;color:#1467F5}.release-badge span{font-size:10.5px;color:#33415C}
    .top-grid{gap:12px;align-items:stretch}.summary{min-height:80px;border-radius:20px;padding:13px 18px;grid-template-columns:50px 1fr;gap:14px}.summary-icon{width:48px;height:48px;border-radius:15px}.summary h3{font-size:15px;line-height:1.05;margin:0 0 7px;font-weight:650}.summary ul{margin:0;padding:0;display:grid;gap:4px}.summary li{grid-template-columns:max-content 1fr;gap:12px;align-items:center}.summary li b,.summary li span{font-size:12px;line-height:1.25;font-weight:600}.summary.recommendation,.summary.attention{display:grid;align-content:center}.summary.recommendation h3,.summary.attention h3{transform:none}
    .section-title{margin:1px 2px -5px;align-items:center}.section-title h2{font-size:18px;line-height:1;margin:0;font-weight:650}.section-title span{font-size:11px;font-weight:650;padding:6px 10px;border-radius:999px;background:#F6F9FD;border:1px solid var(--hb-line);color:#64708A}
    .vehicles{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}.vehicle-card{border-radius:20px;overflow:hidden;border:1px solid var(--hb-line);box-shadow:0 18px 44px rgba(15,35,80,.065)}
    .status-top-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:8px 10px 5px}.status-row{height:30px;min-height:30px;border-radius:999px;padding:0 8px;display:grid;grid-template-columns:18px minmax(0,1fr);gap:5px;align-items:center;border:1px solid var(--hb-line);background:#fff;min-width:0}.status-row ha-icon{--mdc-icon-size:15.5px}.status-row span{display:none}.status-row .pill{height:22px;padding:0 8px;border-radius:999px;font-size:9.5px;line-height:1;font-weight:650;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .hero-split-row{grid-template-columns:minmax(0,2.62fr) minmax(142px,.78fr);gap:8px;padding:4px 10px 6px}.vehicle-hero-panel,.charger-hero-panel{border-radius:16px;border:1px solid var(--hb-line);background:linear-gradient(135deg,#fff 0%,#F9FCFF 58%,#F1F6FF 100%)}.vehicle-hero-panel{min-height:174px;padding:13px 14px;grid-template-columns:.35fr 1.65fr;gap:6px}.vehicle-copy h2{font-size:25px;line-height:.95;letter-spacing:-.055em;margin:0 0 7px;font-weight:650}.vehicle-copy p{font-size:11.5px;line-height:1.15;font-weight:600;color:#1D2B45}.vehicle-image{justify-content:flex-start;overflow:hidden}.vehicle-image img{max-height:278px;max-width:125%;object-fit:contain;transform:translateX(-16px) scale(1.17);filter:drop-shadow(0 20px 28px rgba(15,35,80,.16))}.charger-hero-panel{min-height:174px;padding:11px;display:grid;align-content:space-between}.charger-mini-image{height:102px;border-radius:14px;background:rgba(255,255,255,.75)}.charger-mini-image img{max-width:126px;max-height:100px;object-fit:contain}.charger-mini-copy b{font-size:14px;line-height:1.05;font-weight:650}.charger-mini-copy span{font-size:11px;font-weight:600;color:#66728B}
    .vehicle-control-row.mock-row{grid-template-columns:minmax(150px,.42fr) minmax(560px,1.58fr);gap:6px;padding:0 10px 7px;align-items:stretch}.vehicle-metrics-strip.mock-metrics{height:36px;grid-template-columns:.9fr .78fr .72fr;border:1px solid var(--hb-line);border-radius:12px;overflow:hidden;background:#fff;min-width:0}.vehicle-metrics-strip.mock-metrics .metric-chip{height:36px;min-height:36px;border:0;border-right:1px solid var(--hb-line);border-radius:0;padding:4px 8px;background:#fff;min-width:0}.vehicle-metrics-strip.mock-metrics .metric-chip:last-child{border-right:0}.metric-chip span{font-size:7.3px;line-height:1;text-transform:uppercase;letter-spacing:.045em;color:#64708A;font-weight:650}.metric-chip b{font-size:13.5px;line-height:1.05;font-weight:650;white-space:nowrap}.battery-chip i{display:none}
    .charge-mini-strip.mock-controls{height:36px;gap:6px;grid-template-columns:minmax(210px,1.35fr) minmax(126px,.78fr) minmax(116px,.72fr) minmax(80px,.42fr);align-items:stretch;min-width:0}.charge-mini-strip.no-mode{grid-template-columns:minmax(250px,1.5fr) minmax(116px,.72fr) minmax(80px,.42fr)}.charge-mini-strip.no-speed{grid-template-columns:minmax(290px,1.7fr) minmax(126px,.78fr) minmax(80px,.42fr)}.charge-mini-strip.no-speed.no-mode{grid-template-columns:minmax(310px,1fr) minmax(80px,.32fr)}.mini-control,.mini-current-stepper,.mini-power-read{height:36px;min-height:36px;border-radius:12px;padding:0 9px;gap:6px;background:#fff;border:1px solid var(--hb-line);overflow:hidden;min-width:0;box-shadow:none}.mini-control ha-icon,.mini-current-stepper ha-icon,.mini-power-read ha-icon{--mdc-icon-size:16px;flex:0 0 auto;color:#1467F5}.charger-select select,.mode-select select{appearance:none;-webkit-appearance:none;border:0;background:transparent;outline:0;width:100%;min-width:0;font-size:12px;font-weight:650;color:#12213A;line-height:1.1;padding:0 16px 0 0}.charger-select,.mode-select{position:relative}.charger-select:after,.mode-select:after{content:"⌄";position:absolute;right:8px;top:50%;transform:translateY(-52%);font-size:12px;color:#64708A;pointer-events:none}.charger-select option,.mode-select option{font-size:13px;font-weight:600;color:#12213A;background:#fff}.mini-current-stepper{display:grid;grid-template-columns:22px 16px minmax(34px,1fr) 22px;justify-items:center}.mini-current-stepper strong{font-size:13px;white-space:nowrap}.round-step{width:22px;height:22px;border-radius:999px;font-size:16px;border:1px solid var(--hb-line);background:#F7FAFF;color:#1467F5}.mini-power-read strong{font-size:13px;white-space:nowrap}.mini-power-read{justify-content:center}
    .vehicle-actions{grid-template-columns:minmax(132px,1.05fr) minmax(126px,.95fr) minmax(104px,.82fr) 1fr 36px 36px;padding:7px 10px 10px;gap:7px;align-items:stretch}.action{height:36px;min-height:36px;border-radius:12px;font-size:12.3px;font-weight:650;padding:0 10px;border:1px solid var(--hb-line);box-shadow:none}.action ha-icon{--mdc-icon-size:16.5px}.action.primary{background:#1467F5;border-color:#1467F5;color:white}.icon-only{width:36px;min-width:36px;max-width:36px;padding:0}.icon-only span{display:none}.action-spacer{display:block}.presence-toggle{background:#fff;color:#1467F5}.details-action{background:#fff;color:#1467F5}
    .inactive-row{border-radius:18px;min-height:52px;padding:8px 12px;grid-template-columns:74px 1fr auto;border:1px solid var(--hb-line);box-shadow:0 14px 32px rgba(15,35,80,.05)}.inactive-row .inactive-actions{gap:7px}.inactive-row .inactive-actions .action{width:36px;min-width:36px}.inactive-row .inactive-actions .action span{display:none}.inactive-row h3{font-size:14px;margin:0 0 3px}.inactive-row p{font-size:12px;margin:0;color:#66728B;font-weight:600}
    .bottom-grid{gap:12px;grid-template-columns:repeat(3,minmax(0,1fr))}.info{min-height:62px;padding:10px 13px;border-radius:16px}.info h3{font-size:13.5px;line-height:1.1;margin:0 0 5px;font-weight:650}.info h3 ha-icon{--mdc-icon-size:17px}.info p,.info li{font-size:11px;line-height:1.25;font-weight:600;color:#1D2B45}.debt-strip{display:none}
    @media(max-width:1520px){.page{width:calc(100vw - 42px);margin-left:18px}.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:282px;transform:translateX(-8px) scale(1.12)}}

    /* R22.10.3 cross-screen consistency overrides */
    .vehicle-actions.clean-actions{display:flex;align-items:center;gap:7px;flex-wrap:nowrap;padding:7px 10px 10px}
    .vehicle-actions.clean-actions .action:not(.icon-only){flex:0 1 150px;min-width:92px;max-width:170px}
    .vehicle-actions.clean-actions .action-spacer{display:block;flex:1 1 auto;min-width:8px}
    .vehicle-actions.clean-actions .icon-only{flex:0 0 36px;width:36px;min-width:36px;max-width:36px}
    .charge-mini-strip.mock-controls{align-items:center}
    .mini-current-stepper.compact-current{justify-content:flex-end;min-width:128px}
    .hero-split-row{margin-bottom:0}
    .quick-actions,.quick-action-row{margin-top:-18px}

    /* R22.10.3 cross-screen state isolation and stable compact actions */
    .vehicle-actions.clean-actions{display:grid;grid-template-columns:minmax(138px,1.1fr) minmax(120px,.95fr) minmax(104px,.85fr) minmax(92px,.75fr) minmax(0,1fr) 38px 38px;align-items:center;gap:7px;flex-wrap:nowrap;overflow:hidden;}
    .vehicle-actions.clean-actions .action:not(.icon-only){min-width:0;max-width:none;width:100%;overflow:hidden;}
    .vehicle-actions.clean-actions .action:not(.icon-only) span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .vehicle-actions.clean-actions .action-spacer{display:block;min-width:0;visibility:hidden;}
    .vehicle-actions.clean-actions .presence-toggle.icon-only,.vehicle-actions.clean-actions .details-action.icon-only{justify-self:end;grid-row:1;width:38px;min-width:38px;max-width:38px;height:38px;}
    .vehicle-actions.clean-actions .details-action.icon-only{grid-column:7;}
    .vehicle-actions.clean-actions .presence-toggle.icon-only{grid-column:6;}
    .charger-mini-image img{object-fit:contain;}
    .charger-mini-image img{opacity:1;filter:drop-shadow(0 10px 18px rgba(15,35,80,.16)) contrast(1.06)}
    .charger-mini-image{background:#fff}
    .hero-split-row,.vehicle-control-row.mock-row,.vehicle-actions.clean-actions{min-width:0;}
    @media(max-width:900px){.vehicle-actions.clean-actions{grid-template-columns:repeat(2,minmax(0,1fr)) 38px 38px;overflow:visible}.vehicle-actions.clean-actions .action:not(.icon-only){display:inline-flex}.vehicle-actions.clean-actions .presence-toggle.icon-only{grid-column:3}.vehicle-actions.clean-actions .details-action.icon-only{grid-column:4}}
    .asset-detail .hero,.asset-hero{margin-bottom:8px}

    @media(max-width:850px){.page{width:100%;margin:0;padding:12px}.top-grid,.vehicles,.bottom-grid{grid-template-columns:1fr}.hero-split-row{grid-template-columns:1fr}.vehicle-control-row.mock-row{grid-template-columns:1fr}.charge-mini-strip.mock-controls,.charge-mini-strip.no-mode,.charge-mini-strip.no-speed,.charge-mini-strip.no-speed.no-mode{grid-template-columns:1fr 1fr}.status-top-row{grid-template-columns:1fr 1fr}.vehicle-actions{grid-template-columns:1fr 1fr 1fr 36px 36px}.action-spacer{display:none}}


    /* R22.0 Design System Foundation — final cross-screen beta consistency pass.
       Purpose: remove clipping, unify typography, and make dashboard controls behave
       as one component family. This is CSS-only and contract-safe. */
    :host{
      
      --hi-ink:#06142D; --hi-muted:#66728B; --hi-blue:#1467F5;
      --hi-line:#E4EBF6; --hi-panel:#FFFFFF; --hi-soft:#F7FAFF;
      --hi-radius:18px; --hi-radius-lg:24px;
      --hi-control-h:38px; --hi-gap:8px;
    }
    .page{width:calc(100vw - 56px);max-width:1660px;margin:0 0 0 24px;padding:18px 16px 30px;gap:12px;}
    .release-badge{top:12px;right:18px;border-radius:18px;padding:8px 12px;box-shadow:0 10px 24px rgba(15,35,80,.075)}
    .title{margin:0 0 2px}.title h1{font-size:34px;line-height:1;letter-spacing:-.055em}.title p{font-size:13px;line-height:1.35;color:#1d2b45}.eyebrow{font-size:11px;margin-bottom:7px}
    .top-grid{gap:12px}.summary{min-height:80px;padding:12px 18px;border-radius:20px;align-items:center}.summary h3{font-size:15px;line-height:1.1}.summary li,.summary li span{font-size:12px;line-height:1.25}.summary-icon{width:46px;height:46px;border-radius:15px}.summary-icon ha-icon{--mdc-icon-size:25px}
    .section-title{margin:2px 2px -4px}.section-title h2{font-size:18px}.section-title span,.section-title .count{font-size:11px;height:26px;display:inline-flex;align-items:center}
    .vehicles{grid-template-columns:repeat(2,minmax(640px,1fr));gap:12px;align-items:start}.vehicle-card{border-radius:20px;overflow:hidden;min-width:0}.status-top-row{padding:8px 10px 5px;gap:7px}.status-row{height:29px;min-height:29px;border-radius:999px;grid-template-columns:18px minmax(0,1fr);padding:0 8px;min-width:0}.status-row ha-icon{--mdc-icon-size:16px}.pill{height:21px;min-width:0;font-size:9.3px;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hero-split-row{grid-template-columns:minmax(0,2.55fr) minmax(150px,.72fr);gap:8px;padding:4px 10px 6px;min-width:0}.vehicle-hero-panel,.charger-hero-panel{border-radius:16px;border:1px solid var(--hi-line);background:linear-gradient(135deg,#fff,#F8FBFF);min-width:0}.vehicle-hero-panel{min-height:168px;padding:12px;grid-template-columns:.34fr 1.66fr}.vehicle-copy h2{font-size:24px;line-height:.95;margin-bottom:6px}.vehicle-copy p{font-size:11.5px;line-height:1.15}.vehicle-image{overflow:hidden;justify-content:center;align-items:center}.vehicle-image img{max-width:105%;max-height:230px;transform:translateX(-4px) scale(1.03);object-fit:contain;filter:drop-shadow(0 18px 26px rgba(15,35,80,.16))}.charger-hero-panel{min-height:168px;padding:10px}.charger-mini-image{height:98px;border-radius:14px}.charger-mini-image img{max-width:122px;max-height:96px}.charger-mini-copy b{font-size:13px}.charger-mini-copy span{font-size:10.5px}
    .vehicle-control-row.mock-row{grid-template-columns:minmax(170px,.42fr) minmax(600px,1.58fr);gap:6px;padding:0 10px 7px;min-width:0}.vehicle-metrics-strip.mock-metrics{height:38px;min-width:0}.metric-chip{min-width:0}.metric-chip span{font-size:7.2px}.metric-chip b{font-size:13px}.charge-mini-strip.mock-controls{height:38px;gap:6px;grid-template-columns:minmax(220px,1.35fr) minmax(128px,.76fr) minmax(112px,.65fr) minmax(78px,.42fr);min-width:0}.charge-mini-strip.no-speed{grid-template-columns:minmax(300px,1.65fr) minmax(128px,.78fr) minmax(78px,.42fr)}.charge-mini-strip.no-mode{grid-template-columns:minmax(260px,1.48fr) minmax(112px,.65fr) minmax(78px,.42fr)}.charge-mini-strip.no-speed.no-mode{grid-template-columns:minmax(330px,1fr) minmax(78px,.28fr)}
    .mini-control,.mini-current-stepper,.mini-power-read{height:38px;min-height:38px;border-radius:12px;padding:0 9px;box-shadow:none;min-width:0}.charger-select select,.mode-select select{font-size:12px;font-weight:650;line-height:1;min-width:0;text-overflow:ellipsis}.mini-current-stepper{grid-template-columns:24px 16px minmax(32px,1fr) 24px}.mini-current-stepper strong,.mini-power-read strong{font-size:12.5px;white-space:nowrap}.round-step{width:24px;height:24px}.mini-power-read{justify-content:center;min-width:68px}
    .vehicle-actions{grid-template-columns:minmax(124px,1fr) minmax(116px,.92fr) minmax(98px,.78fr) minmax(0,1fr) 38px 38px;gap:7px;padding:7px 10px 10px}.action{height:38px;min-height:38px;border-radius:12px;font-size:12.2px}.icon-only{width:38px;min-width:38px;max-width:38px}.action-spacer{min-width:0}.inactive-row{min-height:52px;border-radius:18px;padding:8px 12px}.bottom-grid{gap:12px}.info{min-height:58px;padding:10px 13px}.info h3{font-size:13px}.info p,.info li{font-size:11px}
    /* R22.1 working beta cockpit alignment: one density system, no clipping. */
    .page{width:min(100%,1460px);max-width:1460px;gap:12px;padding:16px 22px 28px;margin:0 auto;overflow:visible}
    .title{padding-left:0}.title h1{font-size:34px;line-height:.94}.title p{font-size:13px}.eyebrow{font-size:11px}
    .top-grid{grid-template-columns:1fr 1fr;gap:12px}.summary{height:76px;min-height:76px;padding:10px 16px;box-sizing:border-box}.summary h3{font-size:15px}.summary li,.summary li span{font-size:12px}.summary-icon{width:44px;height:44px}.summary-icon ha-icon{--mdc-icon-size:24px}
    .section-title{margin:1px 0 -2px}.section-title h2{font-size:18px;line-height:1}.section-title span{height:24px;font-size:11px}
    .vehicles{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.vehicle-card{border-radius:20px;min-width:0;overflow:hidden}.status-top-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:7px 9px 5px}.status-row{height:27px;min-height:27px;border-radius:999px;display:grid;grid-template-columns:16px 1fr;align-items:center;gap:4px;padding:0 7px;min-width:0}.status-row>span{display:none}.status-row ha-icon{--mdc-icon-size:15px}.pill{height:19px;font-size:9px;padding:0 6px;min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hero-split-row{display:grid;grid-template-columns:minmax(0,2.9fr) minmax(132px,.82fr);gap:8px;padding:4px 9px 6px}.vehicle-hero-panel,.charger-hero-panel{border-radius:16px;min-width:0;box-sizing:border-box}.vehicle-hero-panel{position:relative;display:block;min-height:190px;height:190px;padding:14px 14px 10px;overflow:hidden}.vehicle-copy{position:absolute;z-index:2;left:14px;top:14px;max-width:42%;min-width:150px}.vehicle-copy h2{font-size:23px;line-height:.95;margin:0 0 5px;white-space:nowrap;letter-spacing:-.055em}.vehicle-copy p{font-size:11px;line-height:1.15;white-space:normal}.vehicle-image{position:absolute;inset:8px 10px 8px 118px;display:flex;align-items:center;justify-content:center;overflow:hidden}.vehicle-image img{max-width:100%;max-height:174px;object-fit:contain;transform:translateX(-4%) scale(.96);filter:drop-shadow(0 16px 25px rgba(15,35,80,.15))}.charger-hero-panel{min-height:190px;height:190px;padding:10px;display:grid;grid-template-rows:1fr auto;gap:8px}.charger-mini-image{height:auto;min-height:116px;border-radius:14px}.charger-mini-image img{max-width:112px;max-height:104px;object-fit:contain}.charger-mini-copy b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.charger-mini-copy span{font-size:10.5px}
    .vehicle-control-row.mock-row{display:grid;grid-template-columns:minmax(165px,.42fr) minmax(0,1.58fr);gap:6px;padding:0 9px 6px;align-items:stretch;min-width:0}.vehicle-metrics-strip.mock-metrics{height:36px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-radius:12px;overflow:hidden;min-width:0}.metric-chip{height:36px;min-width:0;padding:4px 7px;border-radius:0;box-shadow:none;border-right:1px solid var(--hi-line)}.metric-chip:last-child{border-right:0}.metric-chip span{font-size:7px;line-height:1;text-transform:uppercase;letter-spacing:.04em}.metric-chip b{font-size:12.5px;line-height:1.05;white-space:nowrap}.battery-chip i{display:none}
    .charge-mini-strip.mock-controls{height:36px;display:flex;align-items:stretch;gap:6px;min-width:0;overflow:hidden}.mini-control,.mini-current-stepper,.mini-power-read{height:36px;min-height:36px;border-radius:12px;padding:0 8px;box-sizing:border-box;min-width:0;flex:0 1 auto}.charger-select{flex:1 1 210px;min-width:160px}.mode-select{flex:0 1 126px;min-width:108px}.mini-current-stepper{flex:0 0 112px;display:grid;grid-template-columns:22px 14px minmax(31px,1fr) 22px;gap:4px}.mini-power-read{flex:0 0 72px;justify-content:center}.charge-mini-strip.no-speed .mini-power-read{flex:0 0 82px}.charger-select select,.mode-select select{font-size:12px;font-weight:600;line-height:1;color:var(--hi-ink);height:100%;width:100%;border:0;background:transparent;min-width:0;outline:0}.mini-control ha-icon,.mini-power-read ha-icon{--mdc-icon-size:16px;flex:0 0 16px}.mini-current-stepper strong,.mini-power-read strong{font-size:12px;line-height:1;white-space:nowrap}.round-step{width:22px;height:22px;min-width:22px;border-radius:999px;font-size:15px}
    .vehicle-actions{display:grid;grid-template-columns:minmax(118px,1.05fr) minmax(112px,.95fr) minmax(92px,.78fr) minmax(0,1fr) 36px 36px;gap:7px;padding:7px 9px 9px;align-items:center}.action{height:36px;min-height:36px;border-radius:12px;font-size:12px;font-weight:600;line-height:1;gap:7px;padding:0 11px;box-sizing:border-box;white-space:nowrap;overflow:hidden}.action ha-icon{--mdc-icon-size:16px}.icon-only{width:36px;min-width:36px;max-width:36px;padding:0;display:inline-flex;justify-content:center}.icon-only span{display:none}.action-spacer{min-width:0}
    .inactive-row{min-height:52px;border-radius:18px;padding:8px 12px}.inactive-state{width:62px;height:42px;font-size:10px}.inactive-copy h3{font-size:13px}.inactive-copy p{font-size:11px}.inactive-actions{gap:7px}.inactive-actions .action:not(.icon-only){width:36px;min-width:36px;max-width:36px;padding:0}.inactive-actions .action:not(.icon-only) span{display:none}
    .bottom-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.info{min-height:58px;padding:10px 13px;border-radius:16px}.info h3{font-size:13px}.info p,.info li{font-size:11px}
    @media(max-width:1280px){.page{width:100%;padding:14px}.vehicles{grid-template-columns:1fr}.vehicle-image img{max-height:176px}.top-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:880px){.page{width:100%;margin:0;padding:12px}.top-grid,.vehicles,.hero-split-row,.vehicle-control-row.mock-row,.bottom-grid{grid-template-columns:1fr}.charge-mini-strip.mock-controls{flex-wrap:wrap;height:auto;overflow:visible}.mini-control,.mini-current-stepper,.mini-power-read{height:36px}.vehicle-actions{grid-template-columns:1fr 1fr 1fr 36px 36px}.action-spacer{display:none}.status-top-row{grid-template-columns:1fr 1fr}.vehicle-image{position:relative;inset:auto;height:150px}.vehicle-copy{position:relative;left:auto;top:auto;max-width:100%}.vehicle-hero-panel{height:auto;min-height:0}}

    /* R22.2 font and interaction polish: sharper, less heavy typography and safer command fallback. */
    :host{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
    .title h1,h1{font-weight:600;letter-spacing:-.025em;}
    .vehicle-copy h2,h2{font-weight:600;letter-spacing:-.02em;}
    h3,.summary h3,.section-title h2,.charger-mini-copy b{font-weight:600;}
    .action,.mini-control select,.charger-select select,.mode-select select,.metric-chip b,.mini-current-stepper strong,.mini-power-read strong,.inactive-copy h3{font-weight:500;}
    .status-row .pill{font-weight:500;}
    .metric-chip span,.inactive-copy p,.charger-mini-copy span,.summary li b,.summary li span,.info p,.info li{font-weight:400;}
    .action:disabled{opacity:.45;filter:none;}


    /* R22.12.11.24 Energy look & feel alignment — CSS/token-level polish only. Card layout and contract behavior stay frozen. */
    :host{
      --hi-surface:var(--card-background-color);
      --hi-surface-soft:rgba(14,35,72,.025);
      --hi-surface-chip:rgba(14,35,72,.055);
      --hi-line:rgba(14,35,72,.10);
      --hi-line-soft:rgba(14,35,72,.075);
      --hi-muted:var(--secondary-text-color);
      --hi-ink:var(--primary-text-color);
      --hi-radius-card:18px;
      --hi-radius-inner:14px;
      --hi-radius-control:12px;
      --hi-shadow-soft:none;
      
    }
    .page{background:transparent;}
    .summary,.vehicle-card,.inactive-row,.info,.vehicle-hero-panel,.charger-hero-panel,.metric-chip,.mini-control,.mini-current-stepper,.mini-power-read,.status-row{
      background:var(--hi-surface);
      border-color:var(--hi-line);
      box-shadow:none;
    }
    .summary,.vehicle-card,.info{border-radius:var(--hi-radius-card);}
    .vehicle-hero-panel,.charger-hero-panel,.inactive-row{border-radius:var(--hi-radius-card);}
    .metric-chip,.mini-control,.mini-current-stepper,.mini-power-read,.status-row{border-radius:var(--hi-radius-control);}
    .summary.attention,.summary.recommendation,.vehicle-hero-panel,.charger-hero-panel{background:linear-gradient(135deg,var(--hi-surface),var(--hi-surface-soft));}
    .title h1{font-size:32px;font-weight:600;letter-spacing:-.025em;color:var(--hi-ink);}
    .title p,.vehicle-copy p,.info p,.info li,.summary li,.inactive-copy p,.charger-mini-copy span,.relationship-lines{color:var(--hi-muted);font-weight:400;}
    .eyebrow,.metric-chip span{color:var(--hi-muted);font-weight:500;}
    .section-title h2,.summary h3,.info h3,.vehicle-copy h2,.charger-mini-copy b,.inactive-copy h3{font-weight:600;color:var(--hi-ink);}
    .metric-chip b,.mini-control strong,.mini-current-stepper strong,.mini-power-read strong{font-weight:600;color:var(--hi-ink);}
    .pill{font-weight:500;border:1px solid transparent;}
    .pill.ok{background:rgba(22,163,74,.10);color:#166534;border-color:rgba(22,163,74,.12);}
    .pill.warn{background:rgba(217,119,6,.11);color:#92400E;border-color:rgba(217,119,6,.14);}
    .pill.bad{background:rgba(220,38,38,.10);color:#991B1B;border-color:rgba(220,38,38,.14);}
    .pill.muted{background:var(--hi-surface-chip);color:var(--hi-muted);border-color:var(--hi-line-soft);}
    .action{
      background:var(--hi-surface);
      border-color:var(--hi-line);
      border-radius:var(--hi-radius-control);
      box-shadow:none;
      font-weight:500;
      color:var(--hi-ink);
    }
    .action.primary-charge{background:rgba(20,103,245,.10);border-color:rgba(20,103,245,.18);color:#164AA8;}
    .action.primary-charge ha-icon{color:#1467F5;}
    .action.sent{background:rgba(20,103,245,.08);border-color:rgba(20,103,245,.14);color:#164AA8;}
    .action.busy{background:rgba(217,119,6,.08);border-color:rgba(217,119,6,.14);}
    .action.failed{background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.14);color:#991B1B;}
    .vehicle-image,.charger-mini-image,.inactive-image{background:radial-gradient(circle at center,rgba(14,35,72,.045),transparent 62%);}
    .section-title span{background:var(--hi-surface-chip);border-color:var(--hi-line-soft);color:var(--hi-muted);font-weight:500;}
    .empty{background:var(--hi-surface);border-color:var(--hi-line);color:var(--hi-muted);font-weight:400;}



    /* R22.6.2 tablet + hero stability pass
       - tablet keeps two columns longer
       - image cards stop blinking by preventing layout-driven reload pressure
       - attention cards hide positive/clear rows
       - vehicle hero becomes less boxed on tablet and phone-prep remains controlled */
    .summary.attention li.clear{display:none;}
    .summary.attention ul:empty:after{content:"No urgent mobility attention.";display:block;color:#34405A;font-size:13px;font-weight:400;}
    .vehicle-image img,.charger-mini-image img,.charger-visual img{will-change:auto;backface-visibility:hidden;}
    .vehicle-card{contain:layout paint style;}
    .vehicle-image{overflow:visible;}

    @media (min-width: 900px) and (max-width: 1320px){
      .page{width:100%;margin:0;padding:18px 18px 34px;gap:14px;}
      .top-grid{grid-template-columns:1fr 1fr;gap:12px;}
      .summary{min-height:92px;padding:14px 16px;grid-template-columns:46px 1fr;gap:12px;}
      .summary-icon{width:42px;height:42px;border-radius:14px;}
      .summary-icon ha-icon{--mdc-icon-size:24px;}
      .summary h3{font-size:15px;margin:0 0 5px;}
      .summary li{font-size:12px;padding:5px 0;gap:8px;}
      .vehicles{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
      .vehicle-card{border-radius:20px;min-width:0;}
      .status-top-row{grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:8px 8px 5px;}
      .status-row{min-height:28px;height:28px;padding:0 6px;border-radius:999px;gap:3px;}
      .status-row ha-icon{--mdc-icon-size:14px;}
      .pill{font-size:8.8px;min-width:0;padding:0 5px;height:18px;}
      .hero-split-row{grid-template-columns:minmax(0,2.65fr) minmax(112px,.72fr);gap:7px;padding:4px 8px 6px;}
      .vehicle-hero-panel{position:relative;display:block;height:178px;min-height:178px;padding:12px;overflow:hidden;border-radius:16px;}
      .vehicle-copy{position:absolute;left:12px;top:12px;z-index:2;max-width:45%;min-width:120px;}
      .vehicle-copy h2{font-size:21px;line-height:.95;white-space:nowrap;margin:0 0 4px;}
      .vehicle-copy p{font-size:10.5px;line-height:1.1;}
      .vehicle-image{position:absolute;inset:12px 10px 8px 110px;display:flex;align-items:center;justify-content:center;min-height:0;background:radial-gradient(circle at center,rgba(20,103,245,.08),transparent 60%);}
      .vehicle-image img{max-height:148px;max-width:112%;transform:translateX(-4%) scale(1.02);object-fit:contain;}
      .charger-hero-panel{height:178px;min-height:178px;padding:9px;border-radius:16px;grid-template-rows:auto 1fr;}
      .charger-mini-image{height:108px;min-height:108px;border-radius:14px;}
      .charger-mini-image img{max-width:96px;max-height:94px;}
      .charger-mini-copy b{font-size:12px;}
      .charger-mini-copy span{font-size:10px;}
      .vehicle-control-row.mock-row{grid-template-columns:1fr;gap:6px;padding:0 8px 7px;}
      .vehicle-metrics-strip.mock-metrics{height:34px;grid-template-columns:repeat(3,minmax(0,1fr));}
      .vehicle-metrics-strip.mock-metrics .metric-chip{min-height:34px;padding:4px 8px;}
      .metric-chip span{font-size:7.6px;}
      .metric-chip b{font-size:12px;}
      .charge-mini-strip.mock-controls{height:34px;grid-template-columns:minmax(170px,1.4fr) minmax(96px,.62fr) minmax(74px,.42fr);gap:5px;}
      .charge-mini-strip.mock-controls.no-speed{grid-template-columns:minmax(210px,1.5fr) minmax(108px,.8fr) minmax(74px,.42fr);}
      .mini-control,.mini-current-stepper,.mini-power-read{height:34px;min-height:34px;border-radius:11px;padding:0 7px;gap:5px;}
      .charger-select select,.mode-select select{font-size:11px;font-weight:500;}
      .mini-current-stepper{grid-template-columns:20px 14px minmax(28px,1fr) 20px;}
      .round-step{width:20px;height:20px;font-size:14px;}
      .mini-current-stepper strong,.mini-power-read strong{font-size:11.5px;}
      .vehicle-actions{grid-template-columns:minmax(118px,1fr) minmax(108px,.9fr) minmax(82px,.72fr) 1fr 34px 34px;gap:6px;padding:6px 8px 9px;}
      .action{min-height:34px;height:34px;font-size:11.5px;border-radius:11px;}
      .icon-only{width:34px;min-width:34px;max-width:34px;}
      .bottom-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
      .info{min-height:58px;padding:10px 12px;}
    }

    @media (max-width: 899px){
      .page{width:100%;margin:0;padding:12px 12px 28px;gap:12px;}
      .top-grid{grid-template-columns:1fr;gap:10px;}
      .summary{min-height:auto;padding:14px;grid-template-columns:44px 1fr;gap:12px;}
      .vehicles{grid-template-columns:1fr;gap:12px;}
      .hero-split-row{grid-template-columns:1fr;gap:9px;}
      .vehicle-hero-panel{height:auto;min-height:230px;display:block;position:relative;padding:14px;}
      .vehicle-copy{position:relative;left:auto;top:auto;max-width:100%;z-index:2;}
      .vehicle-copy h2{white-space:nowrap;font-size:25px;}
      .vehicle-image{position:relative;inset:auto;height:160px;margin-top:8px;}
      .vehicle-image img{max-height:150px;transform:none;}
      .charger-hero-panel{height:auto;min-height:150px;}
      .vehicle-control-row.mock-row{grid-template-columns:1fr;}
      .vehicle-metrics-strip.mock-metrics{height:42px;}
      .charge-mini-strip.mock-controls,.charge-mini-strip.mock-controls.no-speed{grid-template-columns:1fr 1fr;height:auto;}
      .mini-control,.mini-current-stepper,.mini-power-read{height:38px;min-height:38px;}
      .vehicle-actions{grid-template-columns:1fr 1fr 1fr 36px 36px;}
      .bottom-grid{grid-template-columns:1fr;}
    }

    @media (max-width: 560px){
      .status-top-row{grid-template-columns:1fr 1fr;}
      .vehicle-metrics-strip.mock-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}
      .charge-mini-strip.mock-controls,.charge-mini-strip.mock-controls.no-speed{grid-template-columns:1fr;}
      .vehicle-actions{grid-template-columns:1fr 1fr 36px 36px;}
      .vehicle-actions .action:nth-child(3){grid-column:1 / 3;}
    }


    /* R22.10.3 hard visible charge-speed + bottom alignment gate
       This block is inside the dashboard styles() return, not in the missing-card branch. */
    .vehicle-control-row.mock-row{
      display:grid;
      grid-template-columns:minmax(176px,.44fr) minmax(220px,1fr) minmax(126px,.48fr) minmax(92px,.34fr);
      gap:6px;
      align-items:stretch;
      padding:0 12px 8px;
      min-width:0;
      overflow:visible;
    }
    .vehicle-control-row.mock-row>.vehicle-metrics-strip.mock-metrics{
      grid-column:1;
      min-width:0;
      height:38px;
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
    }
    .vehicle-control-row.mock-row>.charge-mini-strip.mock-controls{
      display:contents;
    }
    .vehicle-control-row.mock-row .charger-select{
      grid-column:2;
      min-width:0;
      width:100%;
      height:38px;
      min-height:38px;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current{
      grid-column:3;
      display:grid;
      grid-template-columns:minmax(42px,1fr) 24px 24px;
      gap:5px;
      align-items:center;
      min-width:0;
      width:100%;
      height:38px;
      min-height:38px;
      padding:0 7px;
      overflow:hidden;
      background:#fff;
      border:1px solid var(--hb-line);
      border-radius:12px;
      box-sizing:border-box;
      opacity:1;
      visibility:visible;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current.readonly{
      grid-template-columns:minmax(56px,1fr);
    }
    .vehicle-control-row.mock-row .mini-power-read.actual-power-read{
      grid-column:4;
      display:flex;
      align-items:center;
      min-width:0;
      width:100%;
      height:38px;
      min-height:38px;
      padding:0 8px;
      background:#fff;
      border:1px solid var(--hb-line);
      border-radius:12px;
      box-sizing:border-box;
      overflow:hidden;
    }
    .vehicle-control-row.mock-row .mini-power-read.actual-power-read .power-copy{
      min-width:0;
      display:flex;
      flex-direction:column;
      justify-content:center;
      line-height:1.05;
      overflow:hidden;
    }
    .vehicle-control-row.mock-row .mini-power-read.actual-power-read small{
      display:block;
      font-size:8px;
      color:#64708A;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      font-weight:500;
    }
    .vehicle-control-row.mock-row .mini-power-read.actual-power-read strong{
      display:block;
      font-size:13px;
      color:#12213A;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      font-weight:500;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy{
      min-width:0;
      display:flex;
      flex-direction:column;
      justify-content:center;
      overflow:hidden;
      line-height:1.05;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy small{
      display:block;
      font-size:8px;
      color:#64708A;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      font-weight:500;
      letter-spacing:0;
      text-transform:none;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy strong{
      display:block;
      font-size:13px;
      color:#12213A;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      font-weight:500;
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
    .vehicle-control-row.mock-row .current-copy em,.vehicle-control-row.mock-row .power-copy em{display:block;margin-top:2px;font-size:7.5px;line-height:1.05;font-style:normal;font-weight:500;color:#8A5A12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lifecycle-control-wrap{min-width:0;display:grid;gap:2px;align-items:center}.lifecycle-control-wrap>.manage-lifecycle{width:100%;max-width:none}.lifecycle-disabled-reason{display:block;max-width:150px;font-size:8px;line-height:1.1;color:#8A5A12;font-weight:550;white-space:normal}
    .vehicle-actions.clean-actions{
      display:grid;
      grid-template-columns:minmax(132px,1.05fr) minmax(118px,.95fr) minmax(104px,.82fr) minmax(92px,.75fr) minmax(0,1fr) 42px 42px;
      gap:8px;
      align-items:center;
      padding:8px 12px 12px;
    }
    .vehicle-actions.clean-actions .action-spacer{display:block;min-width:0;visibility:hidden;}
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
    .vehicle-actions.clean-actions .details-action.icon-only ha-icon{color:#1467F5;}
    .charger-hero-panel{position:relative;}
    .charger-hero-panel .mini-detail-button.charger-detail-link{
      position:absolute;
      right:10px;
      bottom:10px;
      width:30px;
      height:30px;
      min-width:30px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:0;
      background:#fff;
      border:1px solid var(--hb-line);
      color:#1467F5;
      box-shadow:0 8px 18px rgba(15,35,80,.06);
      z-index:2;
      cursor:pointer;
    }
    .charger-hero-panel .mini-detail-button.charger-detail-link ha-icon{--mdc-icon-size:18px;color:#1467F5;}
    .vehicle-hero-panel{position:relative;}
    .vehicle-hero-panel .mini-detail-button.vehicle-detail-link{
      position:absolute;
      right:10px;
      bottom:10px;
      width:30px;
      height:30px;
      min-width:30px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:0;
      background:#fff;
      border:1px solid var(--hb-line);
      color:#1467F5;
      box-shadow:0 8px 18px rgba(15,35,80,.06);
      z-index:2;
      cursor:pointer;
    }
    .vehicle-hero-panel .mini-detail-button.vehicle-detail-link ha-icon{--mdc-icon-size:18px;color:#1467F5;}
    .vehicle-activity-inline{margin:6px 0 0;color:#34405A;font-size:12px;font-weight:500;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .vehicle-lifecycle-chip{
      align-self:center;
      justify-self:start;
      min-width:0;
      color:#17233B;
      font-size:13px;
      font-weight:500;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      padding:0 4px;
    }
    .vehicle-lifecycle-chip.empty{visibility:hidden;}

    @media (max-width: 1320px){
      .vehicle-control-row.mock-row{grid-template-columns:1fr;}
      .vehicle-control-row.mock-row>.vehicle-metrics-strip.mock-metrics{grid-column:1;}
      .vehicle-control-row.mock-row>.charge-mini-strip.mock-controls{display:grid;grid-template-columns:minmax(180px,1fr) minmax(108px,.50fr) minmax(124px,.52fr);gap:6px;height:38px;}
      .vehicle-control-row.mock-row .charger-select{grid-column:1;}
      .vehicle-control-row.mock-row .mode-select{grid-column:2;}
      .vehicle-control-row.mock-row .mini-current-stepper.compact-current{grid-column:3;}
    }
    @media (max-width: 899px){
      .vehicle-control-row.mock-row>.charge-mini-strip.mock-controls{height:auto;grid-template-columns:1fr 1fr;}
      .vehicle-control-row.mock-row .charger-select{grid-column:1 / -1;}
      .vehicle-control-row.mock-row .mode-select{grid-column:1;}
      .vehicle-control-row.mock-row .mini-current-stepper.compact-current{grid-column:2;}
      .vehicle-actions.clean-actions{grid-template-columns:1fr 1fr 1fr minmax(0,1fr) 36px 36px;}
    }


    /* R22.10.3 stabilization: tighter vehicle charge power alignment */
    .vehicle-control-row.mock-row>.charge-mini-strip.mock-controls{
      align-items:stretch;
    }
    .vehicle-control-row.mock-row .charger-select,
    .vehicle-control-row.mock-row .mode-select,
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current{
      height:40px;
      min-height:40px;
      align-self:stretch;
      box-sizing:border-box;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current{
      grid-template-columns:minmax(66px,1fr) 26px 26px;
      gap:4px;
      padding:0 6px;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current.readonly{
      grid-template-columns:minmax(78px,1fr);
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .current-copy{
      text-align:left;
      padding-top:1px;
    }
    .vehicle-control-row.mock-row .mini-current-stepper.compact-current .round-step{
      width:26px;min-width:26px;height:26px;
    }

    /* R22.12.11.24 Energy typography alignment — no layout or contract changes. */
    :host{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
    *{}
    .title h1{font-size:34px;line-height:1.08;font-weight:650;letter-spacing:-.025em;}
    .title p{font-size:13px;line-height:1.4;font-weight:400;color:var(--hb-muted,#66728B);}
    .eyebrow{font-size:11px;font-weight:650;letter-spacing:.10em;}
    .section-title h2{font-size:18px;line-height:1.25;font-weight:600;letter-spacing:-.01em;}
    .section-title .count{font-size:11px;font-weight:500;}
    .summary h3,.info h3{font-size:14px;font-weight:600;line-height:1.2;}
    .summary li,.summary li span,.info p,.info li{font-size:11.5px;line-height:1.35;font-weight:400;color:var(--hb-muted,#66728B);}
    .vehicle-copy h2{font-size:23px;line-height:1.08;font-weight:650;letter-spacing:-.025em;}
    .vehicle-copy p,.charger-mini-copy span{font-size:12px;font-weight:500;color:var(--hb-muted,#66728B);}
    .charger-mini-copy b{font-size:13px;font-weight:600;line-height:1.15;}
    .metric-chip span{font-size:7.8px;font-weight:600;letter-spacing:.035em;color:var(--hb-muted,#66728B);}
    .metric-chip b{font-size:14px;font-weight:650;line-height:1.1;}
    .pill{font-weight:500;}
    .status-strip .metric span{font-size:11px;font-weight:500;color:var(--hb-muted,#66728B);}
    .status-strip .metric b{font-size:15px;font-weight:650;line-height:1.2;}
    .mini-control small,.mini-current-stepper small,.mini-power-read small{font-size:9.5px;font-weight:500;color:var(--hb-muted,#66728B);}
    .mini-current-stepper strong,.mini-power-read strong{font-size:13px;font-weight:600;}
    .charger-select select,.mode-select select{font-size:12px;font-weight:600;}
    .action{font-size:12.5px;font-weight:600;}
    .hi-release-footer{font-size:11px;font-weight:400;line-height:1.35;color:var(--secondary-text-color,#6B7280);}
    .hi-release-footer .hi-release-health{font-weight:600;}


    /* rc.7 canonical Overview — approved Mobility mock, contract-owned data/actions only */
    .page{width:min(100%,1560px);max-width:1560px;margin:0 auto;padding:18px 26px 30px;gap:12px}
    .ov-hero{position:relative;overflow:hidden;border:1px solid #DFE8F4;border-radius:20px;background:linear-gradient(110deg,#FFFFFF 0%,#FAFCFF 56%,#EEF5FD 100%);min-height:230px;box-shadow:0 14px 34px rgba(15,35,80,.055);display:grid;grid-template-rows:1fr auto}
    .ov-hero-copy{position:relative;z-index:2;display:flex;align-items:center;gap:18px;padding:24px 28px 12px;max-width:58%}
    .ov-hero-icon{width:58px;height:58px;border:1px solid #DDE8F6;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;color:#0B65EA;box-shadow:0 8px 18px rgba(15,35,80,.04)}
    .ov-hero-icon ha-icon{--mdc-icon-size:31px}.ov-kicker{display:block;color:#315A88;font-size:11px;font-weight:700;letter-spacing:.08em}.ov-hero h1{margin:3px 0 2px;font-size:38px;line-height:1;font-weight:720;letter-spacing:-.035em;color:#0B1830}.ov-hero h2{margin:0 0 5px;font-size:20px;font-weight:590;color:#183C6D}.ov-hero p{margin:0;color:#6B7B93;font-size:12.5px;font-weight:450}
    .ov-hero-time{position:absolute;z-index:3;right:24px;top:18px;display:grid;text-align:right;color:#294A73;font-size:12px}.ov-hero-time b{font-weight:600}.ov-hero-time span{margin-top:2px;font-weight:500}
    .ov-hero-vehicle{position:absolute;right:56px;top:20px;width:42%;height:150px;display:flex;align-items:center;justify-content:flex-end;overflow:visible;pointer-events:none}.ov-hero-vehicle:before{content:"";position:absolute;inset:10px 0 -10px 20%;background:radial-gradient(circle at center,rgba(76,139,213,.16),transparent 63%)}.ov-hero-vehicle img{position:relative;z-index:1;max-width:100%;max-height:170px;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(15,35,80,.18))}
    .ov-kpis{position:relative;z-index:3;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:0 12px 12px}.ov-kpi{min-height:72px;border:1px solid #E1E9F3;border-radius:14px;background:rgba(255,255,255,.96);display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;padding:10px 14px}.ov-kpi>ha-icon{--mdc-icon-size:24px;color:#0B65EA}.ov-kpi>div{display:grid;grid-template-columns:1fr auto;column-gap:8px;align-items:baseline;min-width:0}.ov-kpi span{font-size:11px;color:#48617F;font-weight:550}.ov-kpi b{font-size:22px;color:#0B1830;font-weight:700;white-space:nowrap}.ov-kpi small{grid-column:1/-1;margin-top:2px;color:#718199;font-size:10px;font-weight:500}
    .ov-quickbar{border:1px solid #DFE8F3;border-radius:17px;background:#fff;min-height:62px;display:flex;align-items:center;gap:10px;padding:9px 14px;box-shadow:0 10px 26px rgba(15,35,80,.035)}.ov-quick-title{text-transform:uppercase;color:#536B89;font-size:10px;font-weight:700;letter-spacing:.06em;margin-right:6px}.ov-nav-action{height:40px;border:1px solid #DDE7F3;border-radius:12px;background:#fff;color:#173251;padding:0 14px;display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;cursor:pointer}.ov-nav-action ha-icon{--mdc-icon-size:17px;color:#0B65EA}.ov-nav-action.primary{background:#0B65EA;color:#fff;border-color:#0B65EA}.ov-nav-action.primary ha-icon{color:#fff}.ov-nav-action.ov-more{margin-left:auto}
    .ov-two-col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.ov-panel{border:1px solid #E0E8F2;border-radius:18px;background:#fff;box-shadow:0 12px 30px rgba(15,35,80,.045);padding:12px;min-width:0}.ov-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 2px 9px}.ov-panel-head h2{margin:0;font-size:18px;line-height:1.15;font-weight:650;color:#0E1C33}.ov-panel-head p{margin:2px 0 0;font-size:10.5px;color:#718199}.ov-panel-head button{height:32px;border:1px solid #DDE7F2;background:#fff;border-radius:10px;color:#244B79;font-size:10.5px;font-weight:600;display:flex;align-items:center;gap:3px;padding:0 9px;cursor:pointer}.ov-panel-head button ha-icon{--mdc-icon-size:15px}
    .ov-vehicle-list,.ov-charger-list,.ov-activity-list{display:grid;gap:7px}.ov-vehicle-row{display:grid;grid-template-columns:minmax(170px,1.4fr) minmax(88px,.7fr) minmax(82px,.62fr) minmax(100px,.72fr) minmax(105px,.8fr);grid-template-areas:"main security comfort maintenance charging" "assign assign assign actions actions";gap:7px;align-items:stretch;border:1px solid #E7EDF5;border-radius:13px;padding:7px;background:#FCFDFF}.ov-vehicle-main{grid-area:main;border:0;background:transparent;display:grid;grid-template-columns:64px minmax(0,1fr);gap:9px;align-items:center;text-align:left;padding:0;cursor:pointer;min-width:0}.ov-vehicle-image{height:48px;display:flex;align-items:center;justify-content:center}.ov-vehicle-image img{max-width:72px;max-height:48px;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(15,35,80,.14))}.ov-vehicle-image ha-icon{--mdc-icon-size:34px;color:#8799B4}.ov-vehicle-copy{min-width:0}.ov-vehicle-copy b{display:block;color:#12213A;font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-vehicle-copy small{display:block;margin-top:2px;color:#60728C;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ov-signal{border-left:1px solid #E8EEF6;display:grid;grid-template-columns:17px minmax(0,1fr);grid-template-rows:auto auto;column-gap:5px;align-content:center;min-width:0;padding-left:8px}.ov-signal ha-icon{grid-row:1/3;align-self:center;--mdc-icon-size:15px;color:#476383}.ov-signal span{font-size:8.5px;color:#708098}.ov-signal b{font-size:10.5px;color:#203651;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-signal.warn b{color:#A85B00}.ov-signal.bad b{color:#B42318}
    .ov-charging-state{grid-area:charging;border-left:1px solid #E8EEF6;display:flex;align-items:center;gap:5px;padding-left:8px;color:#294767;min-width:0}.ov-charging-state ha-icon{--mdc-icon-size:15px;color:#0B65EA}.ov-charging-state span{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-assignment{grid-area:assign;min-width:0}.ov-assignment .mini-control{height:36px;min-height:36px;border-radius:10px}.ov-row-actions{grid-area:actions;display:flex;gap:6px;justify-content:flex-end;align-items:center}.ov-row-actions .action{height:36px;min-height:36px;font-size:10.5px;padding:0 9px;white-space:nowrap}.ov-row-actions .ov-detail{width:36px;min-width:36px;max-width:36px}
    .ov-charger-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto 34px;gap:9px;align-items:center;border:1px solid #E7EDF5;border-radius:12px;padding:6px 7px}.ov-charger-image{height:44px;display:flex;align-items:center;justify-content:center}.ov-charger-image img{max-height:43px;max-width:38px;object-fit:contain}.ov-charger-image ha-icon{display:none;--mdc-icon-size:26px;color:#8799B4}.ov-charger-copy{min-width:0}.ov-charger-copy b{display:block;font-size:11.5px;color:#172B47;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-charger-copy small{display:flex;align-items:center;gap:5px;margin-top:2px;font-size:9.5px;color:#5F728D}.ov-dot{width:7px;height:7px;border-radius:99px;background:#16B86B}.ov-charger-power{text-align:right;display:grid}.ov-charger-power b{font-size:11px;color:#172B47}.ov-charger-power small{font-size:8.5px;color:#78879B}.ov-charger-row .ov-detail{width:32px;min-width:32px;max-width:32px;height:32px;min-height:32px;padding:0}
    .ov-small-panel{min-height:118px}.ov-activity-row,.ov-next-row{border:1px solid #E7EDF5;border-radius:12px;min-height:52px;display:flex;align-items:center;gap:9px;padding:7px 10px}.ov-activity-row>ha-icon,.ov-next-row>ha-icon{--mdc-icon-size:20px;color:#0B65EA}.ov-activity-row span,.ov-next-row span{display:grid;min-width:0}.ov-activity-row b,.ov-next-row b{font-size:11px;color:#172B47;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-activity-row small,.ov-next-row small{font-size:9.5px;color:#708098;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-next-row button{margin-left:auto;height:30px;border:1px solid #DDE7F2;background:#EAF3FF;color:#0B65EA;border-radius:9px;padding:0 10px;font-size:10px;font-weight:600;cursor:pointer}.ov-empty{border:1px dashed #DCE5F0;border-radius:11px;padding:14px;color:#718199;font-size:10.5px;text-align:center;background:#FAFCFF}
    @media(max-width:1280px){.ov-hero-copy{max-width:62%}.ov-vehicle-row{grid-template-columns:minmax(180px,1.5fr) repeat(3,minmax(80px,.7fr));grid-template-areas:"main security comfort maintenance" "charging charging charging charging" "assign assign actions actions"}.ov-two-col{grid-template-columns:1fr}.ov-hero-vehicle{width:38%}}
    @media(max-width:760px){.ov-hero{min-height:auto}.ov-hero-copy{max-width:100%;padding:18px}.ov-hero-vehicle,.ov-hero-time{display:none}.ov-kpis{grid-template-columns:1fr 1fr}.ov-quickbar{overflow-x:auto}.ov-quick-title{display:none}.ov-nav-action{flex:0 0 auto}.ov-nav-action.ov-more{margin-left:0}.ov-vehicle-row{grid-template-columns:1fr 1fr;grid-template-areas:"main main" "security comfort" "maintenance charging" "assign assign" "actions actions"}.ov-vehicle-main{grid-template-columns:58px 1fr}.ov-row-actions{justify-content:flex-start;overflow-x:auto}.ov-kpi b{font-size:18px}}

    /* Vehicle management workspace */
    .vehicles-hero{position:relative;overflow:hidden;min-height:150px;border:1px solid #dfe7f1;border-radius:18px;background:linear-gradient(135deg,#f8fbff 0%,#fff 58%,#edf5ff 100%);box-shadow:0 12px 30px rgba(15,35,80,.045);padding:18px 22px;display:flex;align-items:center}.vehicles-hero-copy{position:relative;z-index:2;max-width:760px}.vehicles-hero-copy>small{display:block;font-size:9px;letter-spacing:.14em;font-weight:750;color:#64748b}.vehicles-hero-copy h1{margin:4px 0 5px;font-size:30px;line-height:1.05;font-weight:650;letter-spacing:-.03em}.vehicles-hero-copy>p{margin:0 0 12px;max-width:700px;color:#64748b;font-size:11.5px;line-height:1.4}.vehicles-live-line{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.vehicles-live-line strong{font-size:11px;color:#334155}.vehicles-live-line span{font-size:10px;color:#64748b}.vehicles-hero-art{position:absolute;right:20px;top:3px;width:min(36%,420px);height:145px;display:flex;align-items:center;justify-content:flex-end;pointer-events:none}.vehicles-hero-art:before{content:"";position:absolute;inset:18px 0 0 18%;background:radial-gradient(circle at center,rgba(37,99,235,.12),transparent 66%)}.vehicles-hero-art img{position:relative;z-index:1;max-width:100%;max-height:140px;object-fit:contain;filter:drop-shadow(0 14px 24px rgba(15,35,80,.16))}
    .vehicles-top-status{margin-top:0}.rhi-top-actions{margin-top:0}.vehicle-filter-bar{margin-top:0;box-shadow:none}\n    .vehicle-management-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:7px 8px;box-shadow:0 8px 24px rgba(15,35,80,.035)}.vehicle-filter-group{display:flex;gap:5px;min-width:0;overflow-x:auto}.vehicle-filter-group button{height:34px;border:1px solid #dde7f2;border-radius:9px;background:#fff;color:#334155;padding:0 9px;display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;white-space:nowrap;cursor:pointer}.vehicle-filter-group button b{min-width:20px;border-radius:999px;background:#f1f5f9;padding:2px 6px;font-size:9px;color:#64748b}.vehicle-filter-group button.active{background:#eaf3ff;border-color:#bfd6ff;color:#0b65ea}.vehicle-filter-group button.active b{background:#fff;color:#0b65ea}.vehicle-sort-control{height:34px;border:1px solid #dde7f2;border-radius:9px;display:flex;align-items:center;gap:6px;padding:0 8px;color:#64748b;font-size:9.5px;font-weight:600}.vehicle-sort-control select{border:0;background:transparent;color:#1e293b;font-size:10.5px;font-weight:600;outline:0}.vehicle-manage-button{height:34px;border:1px solid #bfd6ff;border-radius:9px;background:#eaf3ff;color:#0b65ea;padding:0 11px;display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:650;cursor:pointer}.vehicle-manage-button ha-icon{--mdc-icon-size:16px}
    .vehicle-page-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.vehicle-page-summary-item{min-height:50px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;padding:7px 9px;display:grid;grid-template-columns:28px minmax(0,1fr);gap:7px;align-items:center}.vehicle-page-summary-item>ha-icon{--mdc-icon-size:16px;width:28px;height:28px;border-radius:8px;background:#eff6ff;color:#2563eb;padding:6px;box-sizing:border-box}.vehicle-page-summary-item>span{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:6px;min-width:0}.vehicle-page-summary-item small{font-size:9px;color:#64748b}.vehicle-page-summary-item b{font-size:14px;color:#0f172a}.vehicle-page-summary-item em{grid-column:1/-1;margin-top:1px;font-size:8.5px;font-style:normal;color:#94a3b8}.vehicle-page-summary-item.warn>ha-icon{background:#fff7ed;color:#c2410c}
    .vehicle-workspace-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:3px 2px -2px}.vehicle-workspace-head h2{margin:0;font-size:18px;font-weight:650;color:#0f172a}.vehicle-workspace-head p{margin:2px 0 0;font-size:10px;color:#64748b}.vehicle-count-pill{border:1px solid #dbe5f0;border-radius:999px;background:#fff;color:#475569;padding:5px 9px;font-size:9.5px;font-weight:650;white-space:nowrap}.vehicle-count-pill.muted{background:#f8fafc}.vehicle-filter-empty{border:1px dashed #d9e3ef;border-radius:14px;background:#fbfdff;color:#64748b;padding:18px;text-align:center;font-size:11px;font-weight:600}
    .vehicle-workspace-list.vehicles{grid-template-columns:1fr}.vehicle-workspace-list .vehicle-card{box-shadow:0 10px 28px rgba(15,35,80,.05)}.vehicle-workspace-list .hero-split-row{grid-template-columns:minmax(0,2.7fr) minmax(155px,.72fr)}.vehicle-workspace-list .vehicle-hero-panel{min-height:168px}.vehicle-workspace-list .charger-hero-panel{min-height:168px}.vehicle-workspace-list .vehicle-image img{max-height:220px;transform:scale(1.18)}.manage-lifecycle span{display:inline}.manage-lifecycle{padding-inline:12px}
    .vehicle-appearance-action{min-width:112px}.vehicle-picker-panel{margin:0 12px 10px;border:1px solid #cfe0f6;border-radius:14px;background:linear-gradient(135deg,#fbfdff,#f3f8ff);padding:12px 14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}.vehicle-picker-head{display:flex;justify-content:space-between;gap:14px;align-items:start}.vehicle-picker-head small{font-size:8.5px;letter-spacing:.13em;color:#64748b;font-weight:750}.vehicle-picker-head h3{margin:2px 0 2px;font-size:15px;color:#0f172a}.vehicle-picker-head p{margin:0;font-size:9.5px;color:#64748b}.vehicle-picker-head code{font-size:9px}.vehicle-picker-close{width:30px;height:30px;border:1px solid #dbe5f0;border-radius:8px;background:#fff;color:#64748b;cursor:pointer}.vehicle-picker-close ha-icon{--mdc-icon-size:16px}.vehicle-picker-grid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;align-items:end;margin-top:10px}.vehicle-picker-hierarchy .vehicle-picker-key{grid-column:1/4}.vehicle-picker-hierarchy .vehicle-picker-save{grid-column:4}.vehicle-picker-grid label,.vehicle-picker-key{display:flex;flex-direction:column;gap:4px}.vehicle-picker-grid label>span,.vehicle-picker-key>span{font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.vehicle-picker-grid select{height:34px;border:1px solid #d7e2ef;border-radius:8px;background:#fff;color:#0f172a;padding:0 8px;font-size:10.5px;font-weight:600}.vehicle-picker-key code{height:34px;display:flex;align-items:center;border:1px solid #d7e2ef;border-radius:8px;background:#fff;padding:0 8px;font-size:8.5px;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vehicle-picker-save{height:34px;border:1px solid #0b65ea;border-radius:8px;background:#0b65ea;color:#fff;padding:0 11px;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;cursor:pointer}.vehicle-picker-save:disabled{background:#e2e8f0;border-color:#d5deea;color:#94a3b8;cursor:not-allowed}.vehicle-picker-save ha-icon{--mdc-icon-size:15px}.vehicle-picker-gap{margin-top:8px;display:flex;align-items:center;gap:6px;color:#9a5a16;font-size:9.5px}.vehicle-picker-gap ha-icon{--mdc-icon-size:14px}
    @media(max-width:900px){.vehicle-picker-grid{grid-template-columns:1fr 1fr}.vehicle-picker-save{justify-content:center}.vehicle-picker-key{grid-column:1/-1}}

    @media(max-width:980px){.vehicle-management-bar{grid-template-columns:1fr auto}.vehicle-page-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.vehicles-hero-copy{padding-right:30%}}
    @media(max-width:700px){.vehicles-hero{padding:16px;min-height:auto}.vehicles-hero-art{display:none}.vehicles-hero-copy{padding-right:0}.vehicle-management-bar{grid-template-columns:1fr}.vehicle-sort-control{justify-content:space-between}.vehicle-page-summary{grid-template-columns:1fr 1fr}.vehicle-workspace-head{align-items:start}.vehicle-workspace-list .hero-split-row{grid-template-columns:1fr}}

    /* rc.24 mobile hero art + discoverable visual picker */
    .vehicle-hero-panel{position:relative;isolation:isolate}
    .vehicle-hero-panel:after{
      content:"";position:absolute;inset:0;pointer-events:none;z-index:1;
      background:linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.90) 34%,rgba(255,255,255,.18) 68%,rgba(255,255,255,0) 100%)
    }
    .vehicle-copy{position:relative;z-index:3}
    .vehicle-image{position:absolute;z-index:0;right:-4%;bottom:-14%;width:70%;height:126%;min-height:0;background:transparent;overflow:visible;pointer-events:none}
    .vehicle-image img{width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;object-position:right center;transform:none}
    .vehicle-visual-edit{
      position:absolute;z-index:4;left:12px;bottom:10px;height:34px;border:1px solid rgba(14,35,72,.11);
      border-radius:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      color:var(--hb-ink);display:inline-flex;align-items:center;gap:6px;padding:0 10px;font-size:10px;font-weight:700;cursor:pointer
    }
    .vehicle-visual-edit ha-icon{--mdc-icon-size:15px;color:var(--hb-blue)}
    .charger-hero-panel{position:relative;overflow:hidden;isolation:isolate}
    .charger-hero-panel:after{
      content:"";position:absolute;inset:0;pointer-events:none;z-index:1;
      background:linear-gradient(90deg,rgba(255,255,255,.96) 0%,rgba(255,255,255,.82) 45%,rgba(255,255,255,.10) 100%)
    }
    .charger-mini-copy{position:relative;z-index:3}
    .charger-mini-image{
      position:absolute;z-index:0;right:-12%;bottom:-18%;
      width:58%;height:138%;background:transparent;overflow:hidden;pointer-events:none
    }
    .charger-mini-image img{width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;object-position:right center;transform:scale(1.16)}
    .charger-hero-panel .mini-detail-button{z-index:4}

    @media(max-width:700px){
      .vehicle-workspace-list .vehicle-hero-panel,.vehicle-hero-panel{
        min-height:126px;height:126px;display:block;padding:12px 12px
      }
      .vehicle-copy{max-width:58%;padding-bottom:42px}
      .vehicle-copy h2{font-size:19px;line-height:1.06}
      .vehicle-copy p{font-size:10px}
      .vehicle-image{right:-8%;bottom:-18%;width:76%;height:140%}
      .vehicle-hero-panel:after{background:linear-gradient(90deg,rgba(255,255,255,.99) 0%,rgba(255,255,255,.93) 38%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 100%)}
      .vehicle-visual-edit{left:10px;bottom:8px;height:38px;font-size:10.5px;padding:0 11px}
      .vehicle-visual-edit span{display:inline}

      .charger-hero-panel{
        height:64px;min-height:64px;display:block;padding:8px 10px
      }
      .charger-mini-copy{max-width:62%;display:flex;justify-content:center;height:100%}
      .charger-mini-copy b{font-size:12px;align-self:center}
      .charger-mini-image{right:-12%;bottom:-34%;width:45%;height:166%}
      .charger-mini-image img{transform:scale(1.28);object-position:right center}
      .charger-hero-panel:after{background:linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.88) 48%,rgba(255,255,255,.08) 100%)}
    }

    @media(max-width:390px){
      .vehicle-hero-panel{height:118px;min-height:118px}
      .vehicle-copy{max-width:61%}
      .vehicle-copy h2{font-size:17px}
      .vehicle-image{width:78%;right:-12%}
      .vehicle-visual-edit{height:36px;padding:0 9px}
      .charger-hero-panel{height:60px;min-height:60px}
    }

    /* Energy-style Mobility Overview — calm hierarchy, Mobility-owned semantics */
    .ov-energy-hero{position:relative;overflow:hidden;min-height:172px;border:1px solid #dfe7f1;border-radius:18px;background:linear-gradient(135deg,#f8fbff 0%,#ffffff 58%,#edf5ff 100%);box-shadow:0 12px 30px rgba(15,35,80,.045);display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.48fr);align-items:center;padding:20px 24px}
    .ov-energy-hero-copy{position:relative;z-index:2;max-width:760px}.ov-energy-hero-copy>small{display:block;font-size:9px;letter-spacing:.14em;font-weight:750;color:#64748b}.ov-energy-hero-copy h1{margin:4px 0 5px;font-size:28px;line-height:1.08;font-weight:650;letter-spacing:-.025em;color:#0f172a}.ov-energy-hero-copy>p{max-width:720px;margin:0 0 13px;font-size:11.5px;line-height:1.4;color:#64748b}.ov-energy-live-line{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.ov-energy-live-line strong{font-size:11px;color:#334155}.ov-energy-live-line span{font-size:10px;color:#64748b}
    .ov-energy-hero-art{position:absolute;right:24px;top:8px;width:min(38%,430px);height:160px;display:flex;align-items:center;justify-content:flex-end;pointer-events:none}.ov-energy-hero-art:before{content:"";position:absolute;inset:22px 0 0 16%;background:radial-gradient(circle at center,rgba(37,99,235,.12),transparent 66%)}.ov-energy-hero-art img{position:relative;z-index:1;max-width:100%;max-height:150px;object-fit:contain;filter:drop-shadow(0 16px 24px rgba(15,35,80,.16))}
    .ov-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0}.ov-status-item{min-height:48px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;display:grid;grid-template-columns:26px minmax(0,1fr);gap:7px;align-items:center;padding:7px 9px}.ov-status-icon{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#eff6ff;color:#2563eb}.ov-status-icon ha-icon{--mdc-icon-size:15px}.ov-status-item>div{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:6px;align-items:baseline;min-width:0}.ov-status-item small{font-size:9px;line-height:1.05;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-status-item b{font-size:13px;line-height:1.05;color:#0f172a;white-space:nowrap}.ov-status-item em{grid-column:1/-1;margin-top:2px;font-size:8.5px;line-height:1.05;font-style:normal;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ov-status-item.warn .ov-status-icon{background:#fff7ed;color:#c2410c}.ov-status-item.muted .ov-status-icon{background:#f8fafc;color:#94a3b8}.ov-status-item.ok .ov-status-icon{background:#ecfdf5;color:#047857}
    .ov-quickbar.energy-like{min-height:0;padding:6px 8px;margin:0;border-radius:10px;box-shadow:none}.ov-quickbar.energy-like .ov-nav-action{height:34px;min-height:34px;border-radius:8px;font-size:10.5px;padding:0 10px}.ov-quickbar.energy-like .ov-quick-title{font-size:9px;letter-spacing:.10em}
    .ov-core-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(330px,.72fr);gap:10px;align-items:start}.ov-core-vehicles{padding:14px}.ov-core-aside{display:grid;gap:10px}.ov-core-aside>.ov-panel{padding:12px}.ov-focus-panel{background:linear-gradient(135deg,#fbfdff,#f5f9ff)}.ov-activity-panel{min-height:0}.ov-core-grid .ov-panel-head{padding:0 0 9px}.ov-core-grid .ov-panel-head h2{font-size:16px;font-weight:570}.ov-core-grid .ov-panel-head p{font-size:10px;line-height:1.3}
    .ov-conclusion{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:start;margin:0;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(247,250,252,.96))}.ov-conclusion-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:rgba(3,169,244,.08)}.ov-conclusion small{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:#64748b}.ov-conclusion h2{font-size:13px;line-height:1.2;margin:1px 0 2px;color:#0f172a}.ov-conclusion p{font-size:10px;line-height:1.3;margin:0;color:#64748b}
    @media(max-width:1180px){.ov-core-grid{grid-template-columns:1fr}.ov-core-aside{grid-template-columns:1fr 1fr}.ov-core-aside>.ov-panel:first-child{grid-column:1/-1}.ov-energy-hero{grid-template-columns:1fr}.ov-energy-hero-copy{padding-right:34%}.ov-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:700px){.ov-energy-hero{padding:16px;min-height:auto}.ov-energy-hero-copy{padding-right:0}.ov-energy-hero-art{display:none}.ov-energy-hero-copy h1{font-size:22px}.ov-status-grid{grid-template-columns:1fr 1fr}.ov-core-aside{grid-template-columns:1fr}.ov-core-aside>.ov-panel:first-child{grid-column:auto}.ov-conclusion{grid-template-columns:24px minmax(0,1fr)}.ov-conclusion-icon{width:24px;height:24px}}

    /* rc.23 mobile density rewrite — presentation only, no semantic changes */
    @media(max-width:700px){
      .page{padding:8px 8px 18px;gap:8px}
      .vehicles{gap:8px}
      .vehicle-card{border-radius:16px}
      .status-top-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:8px 8px 4px;overflow:visible}
      .vehicle-intelligence-strip .intelligence-status-row{min-height:34px;padding:4px 7px}
      .vehicle-intelligence-strip .intelligence-status-row span{font-size:8.5px}
      .vehicle-intelligence-strip .intelligence-status-row .pill{font-size:9.5px;padding:3px 6px}

      .vehicle-workspace-list .hero-split-row,.hero-split-row{
        grid-template-columns:1fr;gap:6px;padding:4px 8px 6px
      }
      .vehicle-workspace-list .vehicle-hero-panel,.vehicle-hero-panel{
        min-height:0;height:auto;
        grid-template-columns:minmax(0,1fr) 138px;
        grid-template-rows:auto;
        gap:6px;padding:10px 10px 8px;border-radius:13px;align-items:center
      }
      .vehicle-copy{position:relative;left:auto;top:auto;align-self:center;min-width:0}
      .vehicle-copy h2{font-size:20px;line-height:1.08;margin:0 0 3px;letter-spacing:-.025em}
      .vehicle-copy p{font-size:10.5px;line-height:1.25}
      .vehicle-activity-inline{margin-top:3px}
      .vehicle-image{position:relative;inset:auto;height:108px;min-height:0;background:transparent}
      .vehicle-workspace-list .vehicle-image img,.vehicle-image img{
        max-height:108px;max-width:138px;transform:none;object-fit:contain
      }
      .vehicle-hero-panel .mini-detail-button{width:36px;height:36px;right:6px;bottom:6px}

      .charger-hero-panel{
        min-height:0;height:72px;
        grid-template-columns:minmax(0,1fr) 78px;grid-template-rows:1fr;
        gap:6px;padding:7px 9px;border-radius:13px
      }
      .charger-mini-copy{justify-self:start;align-self:center}
      .charger-mini-copy b{font-size:12.5px}
      .charger-mini-image{height:58px;width:72px;justify-self:end;background:transparent}
      .charger-mini-image img{max-width:66px;max-height:56px}
      .charger-hero-panel .mini-detail-button{width:34px;height:34px;right:4px;bottom:4px}

      .vehicle-control-row.mock-row,.vehicle-control-row{
        display:grid;grid-template-columns:1fr;gap:6px;padding:0 8px 6px
      }
      .vehicle-metrics-strip.mock-metrics,.vehicle-metrics-strip{grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
      .metric-chip{min-height:44px;padding:5px 7px;border-radius:10px}
      .metric-chip span{font-size:8px}
      .metric-chip b{font-size:12.5px}

      .charge-mini-strip.mock-controls,.charge-mini-strip.no-mode,.charge-mini-strip.no-speed,.charge-mini-strip{
        display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;align-items:center
      }
      .charge-mini-strip .charger-select{grid-column:1/-1;min-height:44px}
      .mini-current-stepper.compact-current{min-width:0;min-height:44px;justify-content:space-between}
      .mini-power-read{min-height:44px}
      .mini-control,.mini-current-stepper,.mini-power-read{border-radius:10px}

      .vehicle-actions.clean-actions{
        display:flex;gap:5px;padding:6px 8px 8px;overflow-x:auto;overflow-y:hidden;
        -webkit-overflow-scrolling:touch;scrollbar-width:none
      }
      .vehicle-actions.clean-actions::-webkit-scrollbar{display:none}
      .vehicle-actions.clean-actions .action-spacer{display:none}
      .vehicle-actions.clean-actions .action:not(.icon-only){
        flex:0 0 auto;width:auto;min-width:44px;max-width:none;height:44px;padding:0 11px
      }
      .vehicle-actions.clean-actions .icon-only,.vehicle-actions.clean-actions .presence-toggle.icon-only{
        flex:0 0 44px;width:44px;min-width:44px;max-width:44px;height:44px
      }

      .inactive-list{gap:7px}
      .inactive-row{
        min-height:68px;padding:8px 9px;border-radius:14px;
        grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:1fr;gap:8px;align-items:center
      }
      .inactive-state{align-self:center;font-size:10px;padding:6px 8px;white-space:nowrap}
      .inactive-copy{min-width:0}
      .inactive-copy h3{font-size:14px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .inactive-copy p{font-size:10.5px}
      .inactive-actions{
        grid-column:auto;display:flex;flex-direction:row;gap:4px;align-items:center
      }
      .inactive-actions .action{width:42px;min-width:42px;height:42px;min-height:42px;padding:0}
      .inactive-actions .action span{display:none}

      .vehicle-picker-panel{margin:0 8px 7px;padding:10px;border-radius:12px}
      .vehicle-picker-head h3{font-size:14px}
      .vehicle-picker-head p{font-size:10px;line-height:1.25}
      .vehicle-picker-grid{grid-template-columns:1fr;gap:7px}
      .vehicle-picker-key{grid-column:auto}
      .vehicle-picker-grid select,.vehicle-picker-key code,.vehicle-picker-save{height:44px;min-height:44px}
      .vehicle-picker-grid label>span,.vehicle-picker-key>span{font-size:9px}
      .vehicle-picker-save{width:100%;justify-content:center}
    }

    /* rc.27 premium phone composition: artwork becomes the hero background
       instead of a small image floating in a large empty card. */
    @media(max-width:560px){
      .vehicle-card{border-radius:16px;overflow:hidden}
      .status-top-row.vehicle-intelligence-strip{padding:7px 8px 4px;gap:4px}
      .status-top-row.vehicle-intelligence-strip .pill{min-height:28px;display:flex;align-items:center}
      .vehicle-workspace-list .vehicle-hero-panel,.vehicle-hero-panel{
        position:relative;display:block;min-height:154px;height:154px;
        padding:12px 10px;overflow:hidden;background:linear-gradient(135deg,#fff 0%,#f8fbff 58%,#eef5ff 100%)
      }
      .vehicle-copy{position:relative;z-index:3;width:58%;max-width:220px;padding-right:4px}
      .vehicle-copy h2{font-size:19px;line-height:1.05;margin-bottom:4px}
      .vehicle-copy p{font-size:10px;line-height:1.2}
      .vehicle-image{
        position:absolute;z-index:1;right:-4px;left:auto;top:8px;bottom:2px;
        width:66%;height:auto;display:flex;align-items:flex-end;justify-content:flex-end;
        overflow:visible;pointer-events:none
      }
      .vehicle-workspace-list .vehicle-image img,.vehicle-image img{
        width:100%;max-width:250px;height:142px;max-height:142px;
        object-fit:contain;object-position:right bottom;transform:none;opacity:1;
      }
      .vehicle-appearance-action{
        position:absolute;z-index:4;left:10px;bottom:10px;
        width:auto;height:34px;min-height:34px;border-radius:10px;padding:0 9px;
        background:rgba(255,255,255,.94);backdrop-filter:blur(7px)
      }
      .vehicle-appearance-action span{font-size:10.5px}
      .vehicle-hero-panel .mini-detail-button{z-index:4;right:8px;bottom:8px}
      .charger-hero-panel{
        height:78px;min-height:78px;grid-template-columns:minmax(0,1fr) 86px;
        padding:8px 9px;background:linear-gradient(135deg,#fff,#f7faff)
      }
      .charger-mini-image{width:80px;height:62px}
      .charger-mini-image img{max-width:72px;max-height:60px;filter:drop-shadow(0 8px 12px rgba(15,35,80,.12))}
      .vehicle-picker-panel{margin:0 8px 7px}
      .vehicle-picker-head{align-items:flex-start}
      .vehicle-picker-head p{max-width:270px}
    }

    @media(max-width:390px){
      .vehicle-hero-panel{grid-template-columns:minmax(0,1fr) 116px}
      .vehicle-image{height:92px}
      .vehicle-image img{max-height:92px;max-width:116px}
      .vehicle-copy h2{font-size:18px}
      .inactive-state{font-size:9px;padding:5px 6px}
    }

    /* rc.56 compact Vehicles body — same density and rhythm as Overview.
       Final override intentionally retires the accumulated hero/image breakpoint hacks
       without changing card content, controls, commands, lifecycle or relationships. */
    .vehicle-workspace-list{display:grid;grid-template-columns:1fr;gap:10px}
    .vehicle-workspace-head{margin:2px 2px 0}
    .vehicle-card.premium-vehicle-card{
      border-radius:16px;border:1px solid #e2e8f0;
      box-shadow:0 8px 24px rgba(15,35,80,.045);background:#fff;
      overflow:hidden;
    }
    .vehicle-card .status-top-row.vehicle-intelligence-strip{
      padding:7px 9px 5px;gap:5px;min-height:0;
    }
    .vehicle-card .status-top-row.vehicle-intelligence-strip .intelligence-status-row{
      min-height:32px;border-radius:9px;padding:4px 7px;
    }
    .vehicle-card .hero-split-row{
      display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,240px);
      gap:8px;padding:5px 9px 7px;align-items:stretch;
    }
    .vehicle-card .vehicle-hero-panel{
      position:relative;display:grid;
      grid-template-columns:minmax(180px,.62fr) minmax(220px,1.38fr);
      grid-template-rows:1fr;align-items:center;gap:8px;
      min-height:146px;height:146px;padding:10px 12px;
      border-radius:13px;overflow:hidden;
      background:linear-gradient(135deg,#fff 0%,#f8fbff 62%,#eef5ff 100%);
      isolation:isolate;
    }
    .vehicle-card .vehicle-hero-panel:after{display:none;content:none}
    .vehicle-card .vehicle-copy{
      position:relative;inset:auto;z-index:2;width:auto;
      max-width:none;min-width:0;padding:0 0 28px;align-self:center;
    }
    .vehicle-card .vehicle-copy h2{font-size:20px;line-height:1.08;margin:0 0 3px;letter-spacing:-.025em}
    .vehicle-card .vehicle-copy p{font-size:10.5px;line-height:1.25;margin:0}
    .vehicle-card .vehicle-activity-inline{margin-top:3px}
    .vehicle-card .vehicle-image{
      position:relative;inset:auto;z-index:1;width:100%;height:126px;
      min-height:0;display:grid;place-items:center;overflow:hidden;
      background:transparent;pointer-events:none;
    }
    .vehicle-card .vehicle-image img{
      display:block;width:100%;height:100%;max-width:100%;max-height:126px;
      object-fit:contain;object-position:center;transform:none;opacity:1;
    }
    .vehicle-card .vehicle-appearance-action{
      position:absolute;left:12px;bottom:10px;z-index:4;
      height:32px;min-height:32px;padding:0 9px;border-radius:9px;
      background:rgba(255,255,255,.96);
    }
    .vehicle-card .vehicle-hero-panel .mini-detail-button{
      position:absolute;right:8px;bottom:8px;z-index:4;
      width:34px;height:34px;
    }
    .vehicle-card .charger-hero-panel{
      position:relative;display:grid;
      grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr;
      min-height:146px;height:146px;padding:10px;gap:5px;
      border-radius:13px;overflow:hidden;background:linear-gradient(135deg,#fff,#f7faff);
    }
    .vehicle-card .charger-mini-copy{align-self:start;justify-self:start;min-width:0}
    .vehicle-card .charger-mini-copy b{font-size:11.5px;line-height:1.2}
    .vehicle-card .charger-mini-image{
      position:relative;inset:auto;width:100%;height:96px;
      display:grid;place-items:center;background:transparent;overflow:hidden;
    }
    .vehicle-card .charger-mini-image img{
      width:100%;height:100%;max-width:112px;max-height:94px;
      object-fit:contain;object-position:center;transform:none;
    }
    .vehicle-card .charger-hero-panel .mini-detail-button{right:6px;bottom:6px;width:32px;height:32px}
    .vehicle-card .vehicle-control-row.mock-row{padding:0 9px 6px;gap:6px}
    .vehicle-card .vehicle-actions.clean-actions{padding:6px 9px 9px;gap:6px}
    .vehicle-card .visual-picker-panel{margin:0 9px 7px}

    @media(max-width:1050px){
      .vehicle-card .hero-split-row{grid-template-columns:minmax(0,1fr) minmax(170px,205px)}
      .vehicle-card .vehicle-hero-panel{grid-template-columns:minmax(160px,.66fr) minmax(190px,1.34fr)}
    }
    @media(max-width:760px){
      .vehicle-workspace-head{margin-inline:0}
      .vehicle-card .hero-split-row{grid-template-columns:1fr;gap:6px;padding:5px 7px 6px}
      .vehicle-card .vehicle-hero-panel{
        grid-template-columns:minmax(0,.9fr) minmax(150px,1.1fr);height:132px;min-height:132px;
        padding:9px 10px;
      }
      .vehicle-card .vehicle-image{height:112px}
      .vehicle-card .vehicle-image img{max-height:112px}
      .vehicle-card .charger-hero-panel{
        grid-template-columns:minmax(0,1fr) 104px;grid-template-rows:1fr;
        height:72px;min-height:72px;padding:7px 9px;align-items:center;
      }
      .vehicle-card .charger-mini-copy{align-self:center}
      .vehicle-card .charger-mini-image{width:96px;height:58px;justify-self:end}
      .vehicle-card .charger-mini-image img{max-width:82px;max-height:56px}
      .vehicle-card .vehicle-control-row.mock-row{padding-inline:7px}
      .vehicle-card .vehicle-actions.clean-actions{padding-inline:7px}
      .vehicle-card .visual-picker-panel{margin-inline:7px}
    }
    @media(max-width:480px){
      .vehicle-card .status-top-row.vehicle-intelligence-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
      .vehicle-card .vehicle-hero-panel{
        display:grid;grid-template-columns:minmax(0,.88fr) minmax(132px,1.12fr);
        height:126px;min-height:126px;
      }
      .vehicle-card .vehicle-copy{width:auto;max-width:none;padding-bottom:30px}
      .vehicle-card .vehicle-copy h2{font-size:17px}
      .vehicle-card .vehicle-image{position:relative;inset:auto;width:100%;height:106px}
      .vehicle-card .vehicle-image img{
        width:100%;height:100%;max-width:100%;max-height:106px;
        object-position:center;
      }
      .vehicle-card .vehicle-appearance-action{left:9px;bottom:8px;height:30px}
      .vehicle-card .vehicle-hero-panel .mini-detail-button{right:6px;bottom:6px}
    }

    /* Mobile vehicle cards: a single, readable layout authority.
       Preserve canonical projections, commands and current-state semantics.
       At phone widths content must not be compressed into multi-column fact tiles. */
    @media(max-width:560px){
      .vehicle-card.premium-vehicle-card{display:block;min-width:0;overflow:hidden}
      .vehicle-card .status-top-row.vehicle-intelligence-strip{
        position:relative;display:grid;grid-template-columns:minmax(0,1fr);
        grid-auto-rows:auto;height:auto;min-height:0;
        overflow:visible;padding:8px;gap:6px;
      }
      .vehicle-card .status-top-row.vehicle-intelligence-strip .intelligence-status-row{
        position:relative;display:grid;grid-template-columns:24px minmax(0,1fr);
        grid-template-rows:auto auto;min-width:0;height:auto;min-height:42px;
        max-height:none;align-content:center;overflow:visible;padding:7px 10px;
      }
      .vehicle-card .status-top-row.vehicle-intelligence-strip .intelligence-status-row span,
      .vehicle-card .status-top-row.vehicle-intelligence-strip .intelligence-status-row .pill{
        position:static;min-width:0;max-width:100%;width:auto;
        white-space:normal;overflow-wrap:normal;word-break:normal;
        text-overflow:clip;line-height:1.35;font-size:12px;
      }
      .vehicle-card .hero-split-row{
        display:grid;grid-template-columns:minmax(0,1fr);
        gap:8px;padding:8px;position:relative;clear:both;
      }
      .vehicle-card .vehicle-hero-panel{
        display:grid;grid-template-columns:minmax(0,1fr) minmax(100px,38%);
        gap:8px;min-width:0;height:auto;min-height:124px;max-height:none;
        padding:12px;align-items:center;overflow:hidden;
      }
      .vehicle-card .vehicle-copy{
        position:relative;inset:auto;min-width:0;width:auto;max-width:none;
        padding:0;z-index:2;
      }
      .vehicle-card .vehicle-copy h2{
        font-size:18px;line-height:1.22;white-space:normal;
        overflow-wrap:normal;word-break:normal;
      }
      .vehicle-card .vehicle-copy p{
        white-space:normal;overflow-wrap:normal;line-height:1.35;
      }
      .vehicle-card .vehicle-image{
        position:relative;inset:auto;min-width:0;width:100%;
        height:108px;overflow:hidden;
      }
      .vehicle-card .vehicle-image img{
        width:100%;height:100%;max-width:100%;max-height:108px;
        object-fit:contain;object-position:center;
      }
      .vehicle-card .vehicle-appearance-action{
        position:relative;left:auto;bottom:auto;grid-column:1/-1;
        justify-self:start;z-index:3;
      }
      .vehicle-card .charger-hero-panel{
        display:grid;grid-template-columns:minmax(0,1fr) 96px;
        height:auto;min-height:90px;gap:8px;min-width:0;
      }
      .vehicle-card .vehicle-control-row.mock-row{
        height:auto;min-height:0;grid-template-columns:minmax(0,1fr);
        overflow:visible;
      }
      .vehicle-card .vehicle-metrics-strip.mock-metrics{
        height:auto;min-height:48px;grid-template-columns:minmax(0,1fr);
      }
      .vehicle-card .charge-mini-strip.mock-controls,
      .vehicle-card .charge-mini-strip.mock-controls.no-speed{
        height:auto;grid-template-columns:minmax(0,1fr);
      }
      .vehicle-card .vehicle-actions.clean-actions{
        display:flex;flex-wrap:wrap;overflow:visible;gap:8px;
      }
      .vehicle-card .vehicle-actions.clean-actions .action:not(.icon-only){
        flex:1 1 128px;min-width:0;
      }
    }



  `; }

  getCardSize(){ return 12; }
}

if (!customElements.get("homebrain-mobility-dashboard-card")) {
  customElements.define("homebrain-mobility-dashboard-card", HomeBrainMobilityDashboardCard);
}
window.customCards.push({
  type: "homebrain-mobility-dashboard-card",
  name: "Home Brain Mobility Dashboard Card",
  description: "Premium Mobility dashboard custom card with first-class charging controls and compact inactive vehicle rows."
});
/**
 * The former Mobility Asset Viewer was intentionally removed from the Mobility
 * product navigation in 2.1.16. Contract exploration now belongs to the Setup
 * domain. The product bundle keeps only operational Mobility cards.
 */
