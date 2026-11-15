// 50-asset-shell-components.js
// Reusable asset detail shell rendering components.

class HomeBrainAssetShell {
  constructor(root, rt) {
    this.root = root;
    this.rt = rt;
  }

  pillClass(value) {
    const s = String(value || "").toLowerCase();
    if (s.includes("ready") || s.includes("secure") || s.includes("trusted") || s.includes("complete") || s.includes("fresh") || s.includes("available") || s.includes("healthy") || s.includes("ok") || s.includes("connected") || s.includes("locked")) return "ok";
    if (s.includes("charging") || s.includes("heating") || s.includes("active") || s.includes("forced") || s.includes("paused") || s.includes("limited")) return "warn";
    if (s.includes("degraded") || s.includes("unlocked") || s.includes("attention") || s.includes("failed") || s.includes("stale") || s.includes("unavailable") || s.includes("not present")) return "bad";
    return "muted";
  }

  pill(value) {
    return `<span class="pill ${this.pillClass(value)}">${this.rt.escape(value || "Unknown")}</span>`;
  }

  renderControl(row) {
    // R43.2.54: raw entity controls are not a Mobility product contract. Any
    // legacy control row fails closed; editable product controls are rendered
    // only through backend-published property metadata.
    return this.renderRow({ type:"readonly", icon:row.icon || "mdi:alert-outline", label:row.label || "Control", value:"Unavailable — property contract required" });
  }


  renderEditableProperty(row) {
    const prop = row.property || {};
    const validation = row.validation || {};
    const min = validation.min ?? validation.minimum ?? prop.min ?? 0;
    const max = validation.max ?? validation.maximum ?? prop.max ?? 100;
    const step = validation.step ?? prop.step ?? 1;
    const disabled = row.disabled ? "disabled" : "";
    const title = row.disabled_reason || row.help || "";
    // Editors show the configured/readback value published by the canonical V2 property contract. For an
    // explicitly nullable configuration property (profile/selected charger), use
    // the backend-published none token rather than hiding the control.
    const editorValue = row.editor_value ?? prop.value ?? "";
    const value = this.rt.valueWithoutUnit(editorValue, prop.unit || "");
    const controlKind = this.rt.uxEditorControlKind(prop);
    const unit = String(prop.unit || "").trim();
    const key = String(prop.property_key || "").toLowerCase();
    const assetId = this.rt.canonicalAssetId(prop.asset_id || row.asset_id || "");
    if (key === "vehicle.image_key") {
      const asset = this.rt.vehicleById(assetId) || this.rt.assetById(assetId) || { asset_id:assetId, asset_type:"vehicle", image_key:prop.value };
      return new HomeBrainVehicleVisualPicker(this.rt).render(asset, { showClose:false, context:"detail" });
    }
    if (key === "charger.image_key") {
      const asset = this.rt.chargerById(assetId) || this.rt.assetById(assetId) || { asset_id:assetId, asset_type:"charger", image_key:prop.value };
      return new HomeBrainChargerVisualPicker(this.rt).render(asset, { showClose:false, context:"detail" });
    }
    const unitSuffix = unit && !["%"].includes(unit) ? `<span class="unit-suffix">${this.rt.escape(unit)}</span>` : "";
    let control = "";

    if (controlKind === "text") {
      control = `<input type="text" value="${this.rt.escape(value || "")}" data-write-asset="${this.rt.escape(assetId)}" data-write-key="${this.rt.escape(prop.property_key || "")}" ${disabled}/>${unitSuffix}`;
    } else if (controlKind === "toggle") {
      const on = [true,"true","on","yes","1"].includes(prop.value);
      control = `<button class="toggle ${on ? "on" : ""}" data-write-asset="${this.rt.escape(assetId)}" data-write-key="${this.rt.escape(prop.property_key || "")}" data-write-toggle="1" ${disabled}><span></span></button>`;
    } else if (controlKind === "datetime") {
      const type = "datetime-local";
      const dtValue = this.rt.toDateTimeLocalInputValue(prop.value ?? value ?? "");
      control = `<input class="datetime" type="${type}" value="${this.rt.escape(dtValue)}" data-write-asset="${this.rt.escape(assetId)}" data-write-key="${this.rt.escape(prop.property_key || "")}" data-datetime-editor="1" ${disabled}/>`;
    } else if (controlKind === "slider") {
      const boundsValid = row.slider_bounds_valid !== false && min !== "" && max !== "" && Number(max) > Number(min);
      const rawSliderValue = this.rt.valueWithoutUnit(value || min, prop.unit || "");
      const numericValue = Number(String(rawSliderValue).replace(",", "."));
      const boundedValue = boundsValid && Number.isFinite(numericValue) ? Math.min(Number(max), Math.max(Number(min), numericValue)) : rawSliderValue;
      const sliderDisplay = this.rt.formatValue(boundedValue || value || "—", prop.unit || "", prop.property_key || "");
      if (boundsValid) {
        control = `<div class="range-control" title="${this.rt.escape(`Range ${min}–${max}, step ${step}`)}"><input type="range" min="${this.rt.escape(min)}" max="${this.rt.escape(max)}" step="${this.rt.escape(step)}" value="${this.rt.escape(boundedValue || min)}" data-write-asset="${this.rt.escape(assetId)}" data-write-key="${this.rt.escape(prop.property_key || "")}" data-live-target="1" data-live-unit="${this.rt.escape(prop.unit || "")}" data-live-key="${this.rt.escape(prop.property_key || "")}" ${disabled}/><span class="live-value">${this.rt.escape(sliderDisplay || "—")}</span></div>`;
      } else {
        control = `<input type="number" value="${this.rt.escape(rawSliderValue || "")}" data-write-asset="${this.rt.escape(assetId)}" data-write-key="${this.rt.escape(prop.property_key || "")}" ${disabled}/>${unitSuffix}`;
      }
    } else {
      const options = Array.isArray(row.choices) && row.choices.length ? row.choices : (Array.isArray(validation.options) ? validation.options : []);
      const valueField = row.value_field || prop.value_field || "value";
      const labelField = row.label_field || prop.label_field || "label";
      const secondaryField = row.secondary_label_field || prop.secondary_label_field || "secondary_label";
      const opts = [];
      if (row.allow_none || prop.allow_none) opts.push({ value: row.none_value ?? prop.none_value ?? "", label: this.rt.t("common.none",{},"None") });
      for (const o of options) {
        const v = typeof o === "object" ? (o[valueField] ?? o.value ?? o.asset_id ?? o.id ?? o.key ?? "") : o;
        let l = typeof o === "object" ? (o[labelField] ?? o.label ?? o.display_name ?? o.name ?? v) : o;
        const sec = typeof o === "object" ? (o[secondaryField] ?? o.secondary_label ?? "") : "";
        if (String(v).startsWith("charger_") && (!l || l === v)) l = this.rt.chargerLabel(v);
        if (String(v).startsWith("vehicle_") && (!l || l === v)) l = this.rt.vehicleLabel(v);
        opts.push({ value: v, label: sec ? `${l} — ${sec}` : l });
      }
      const display = String(value).startsWith("charger_") ? this.rt.chargerLabel(value) : String(value).startsWith("vehicle_") ? this.rt.vehicleLabel(value) : value;
      control = `<select data-write-asset="${this.rt.escape(assetId)}" data-write-key="${this.rt.escape(prop.property_key || "")}" ${disabled}>
        ${opts.length ? "" : `<option value="">${this.rt.escape(display || this.rt.t("common.no_choices_published",{},"No choices published"))}</option>`}
        ${opts.map((o)=>`<option value="${this.rt.escape(o.value)}" ${String(o.value) === String(value) ? "selected" : ""}>${this.rt.escape(o.label)}</option>`).join("")}
      </select>`;
    }
    return `<div class="edit-row ${row.disabled ? "is-disabled" : ""}" title="${this.rt.escape(title)}">
      <ha-icon icon="${row.icon}"></ha-icon>
      <div class="edit-copy"><div class="label">${this.rt.escape(row.label)}</div>${row.help ? `<div class="help">${this.rt.escape(row.help)}</div>` : ""}</div>
      <div class="edit-control">${control}</div>
    </div>`;
  }

  renderRows(rows = []) {
    const out = [];
    let cluster = [];
    const flush = () => {
      if (cluster.length) {
        out.push(`<div class="action-cluster">${cluster.map((r) => this.renderAction({ label: r.label, icon: r.icon, command: r.command, asset_id: r.asset_id, primary: r.primary })).join("")}</div>`);
        cluster = [];
      }
    };
    for (const row of rows || []) {
      if (row && row.type === "action-row") cluster.push(row);
      else { flush(); out.push(this.renderRow(row)); }
    }
    flush();
    return out.join("");
  }

  relatedAssetRoute(route) {
    // A related object opens in the same detail shell and carries only its
    // immediate parent asset as return context. Never infer the relationship.
    const from = String(this._activeAssetId || "").trim();
    if (!route || !/^(vehicle_|charger_)/.test(from)) return route;
    const [base, fragment = ""] = String(route).split("#", 2);
    const clean = base.replace(/([?&])from_asset=[^&#]*&?/g, "$1").replace(/[?&]$/, "");
    const sep = clean.includes("?") ? "&" : "?";
    return clean + sep + "from_asset=" + encodeURIComponent(from) + (fragment ? "#" + fragment : "");
  }

  returnContext(model) {
    const listLabel = model.type === "charger" ? "Chargers" : "Vehicles";
    const listRoute = hbMobilityPath(model.type === "charger" ? "/charger-maintenance" : "/dashboard");
    // from_asset is deliberately a public URL parameter, so refresh/bookmarks
    // keep context, including inside the single-card bootstrap.
    let from = "";
    try {
      const search = String(window.location?.search || "");
      from = decodeURIComponent((search.match(/[?&]from_asset=([^&#]+)/) || [])[1] || "");
    } catch (_) { from = ""; }
    const currentId = String(model.registryEntry?.asset_id || model.id || "");
    const asset = /^(vehicle_|charger_)/.test(from) && from !== currentId
      ? (this.rt.assetById?.(from) || null) : null;
    if (!asset) return { path:listRoute, label:"Back to " + listLabel };
    const name = String(asset.display_name || this.rt.assetDisplayName?.(from) || from);
    return { path:this.rt.assetDetailRoute(asset), label:"Back to " + name };
  }

  renderRow(row) {
    if (!row || row.hide) return "";
    if (row.type === "control") return this.renderControl(row);
    if (row.type === "property-editor") return this.renderEditableProperty(row);
    if (row.type === "action-row") return this.renderAction({ label: row.label, icon: row.icon, command: row.command, asset_id: row.asset_id, primary: row.primary });
    if (row.type === "subheader") return `<div class="row-subheader">${this.rt.escape(row.label)}</div>`;
    if (row.type === "subheader-small") return `<div class="row-subheader-small">${this.rt.escape(row.label)}</div>`;
    return `
      <div class="row ${row.detailRoute ? "has-detail-link" : ""}">
        <ha-icon icon="${row.icon}"></ha-icon>
        <div class="label">${this.rt.escape(row.label)}</div>
        <div class="value row-value-with-link">${row.detailRoute
          ? `<button type="button" class="row-related-value" data-nav="${this.rt.escape(this.relatedAssetRoute(row.detailRoute))}" aria-label="${this.rt.escape(row.detailTitle || "Open related asset details")}"><span>${this.rt.escape(row.value ?? "—")}</span><ha-icon icon="mdi:chevron-right"></ha-icon></button>`
          : `<span>${this.rt.escape(row.value ?? "—")}</span>`}</div>
      </div>`;
  }

  renderSection(section) {
    if (!section || section.hide) return "";
    const details = (section.details || []).filter((d) => d && d.value !== undefined && d.value !== null && String(d.value).trim() !== "");
    const productRows=section.rows || [];
    const firstRows=productRows.length>12 ? productRows.slice(0,8) : productRows;
    const deeperRows=productRows.length>12 ? productRows.slice(8) : [];
    return `
      <section class="section-card section-${this.rt.escape(section.key)}">
        <div class="section-head">
          <div class="section-title">
            <ha-icon icon="${section.icon}"></ha-icon>
            <h2>${this.rt.escape(section.title)}</h2>
          </div>
          <div class="section-status">${this.rt.escape(section.header || "")}</div>
        </div>
        <div class="section-body">${this.renderRows(firstRows)}</div>
        ${deeperRows.length ? `<details class="detail-fold detail-more"><summary>More properties (${deeperRows.length})</summary><div class="detail-block">${this.renderRows(deeperRows)}</div></details>` : ""}
        ${details.length ? `<details class="detail-fold">
          <summary>Engineering details</summary>
          <div class="detail-block">
            ${details.map((d) => `<div class="detail-row"><span>${this.rt.escape(d.label)}</span><b>${this.rt.escape(d.value ?? "—")}</b></div>`).join("")}
          </div>
        </details>` : ""}
      </section>`;
  }

  renderAction(action) {
    if (!action || action.hide) return "";
    const command = action.command || null;
    const st = command ? this.rt.commandState(command) : { disabled:true, busy:false, failed:false, status:"unavailable", reason:this.rt.t("common.information_missing",{},"Information is not available yet.") };
    const title = st.reason || st.status || "";
    const enums = command?.enum_options || {};
    const enumName = (command?.required_parameters || []).find((name) => Array.isArray(enums[name]) && enums[name].length) || "";
    if (command && command.interaction_mode === "form" && enumName) {
      return `<label class="action enum-action ${st.disabled ? "is-disabled" : ""}" title="${this.rt.escape(title)}">
        <ha-icon icon="${action.icon}"></ha-icon>
        <select aria-label="${this.rt.escape(action.label)}" data-command-asset="${this.rt.escape(command.asset_id || action.asset_id || "")}" data-command-id="${this.rt.escape(command.command_id || "")}" data-command-key="${this.rt.escape(command.command_key || command.command_id || "")}" data-command-param="${this.rt.escape(enumName)}" ${st.disabled ? "disabled" : ""}>
          <option value="">${this.rt.escape(action.label)}…</option>
          ${enums[enumName].map((o)=>`<option value="${this.rt.escape(o.value)}">${this.rt.escape(o.label || o.value)}</option>`).join("")}
        </select>
      </label>`;
    }
    return `
      <button class="${action.primary ? "action primary" : "action"}" data-asset-id="${this.rt.escape(command?.asset_id || action.asset_id || "")}" data-command-id="${this.rt.escape(command?.command_id || "")}" data-command-key="${this.rt.escape(command?.command_key || command?.command_id || "")}" ${st.disabled ? "disabled" : ""} title="${this.rt.escape(title)}">
        <ha-icon icon="${action.icon}"></ha-icon>
        <span>${this.rt.escape(action.label)}</span>
        ${title && st.disabled ? `<small>${this.rt.escape(title)}</small>` : ""}
      </button>`;
  }

  renderHeroVisual(model) {
    if (model.image) {
      return `<img src="${this.rt.escape(model.image)}" loading="eager" decoding="async" fetchpriority="high"
                   data-vehicle-visual-preview="${model.type === "vehicle" ? "1" : "0"}"
                   data-charger-visual-preview="${model.type === "charger" ? "1" : "0"}"
                   data-image-gray="${this.rt.escape(model.imageGray ?? 0)}"
                   onerror="this.onerror=null;this.src='${this.rt.escape(model.fallbackImage || "")}';this.classList.add('image-fallback');"
                   style="opacity:${model.imageOpacity ?? 1};filter:grayscale(${model.imageGray ?? 0}) ${this.rt.escape(model.imageFilter || "none")} drop-shadow(0 24px 30px rgba(15,35,80,.15));" />`;
    }
    return `<div class="hero-icon" style="opacity:${model.imageOpacity ?? 1};filter:grayscale(${model.imageGray ?? 0});"><ha-icon icon="${model.iconHero || "mdi:cube-outline"}"></ha-icon></div>`;
  }

  renderFooter(model) {
    const activity = (model.sections || []).find((s) => s && s.key === "activity");
    const rows = (activity?.rows || []).slice(0, 3);
    const items = rows.length ? rows.map((r, i) => ({
      icon: r.icon || ["mdi:check-circle", "mdi:alert", "mdi:fan"][i] || "mdi:history",
      title: r.label || "Activity",
      value: r.value || "—",
      sub: i === 0 ? "Latest event" : i === 1 ? "Vehicle action" : "Data update",
      tone: i === 0 ? "ok" : i === 1 ? "warn" : "blue"
    })) : [
      { icon:"mdi:check-circle", title:"Charging", value:"No recent charging event", sub:"Today", tone:"ok" },
      { icon:"mdi:alert", title:"Attention", value:"No issue requiring attention", sub:"Today", tone:"warn" },
      { icon:"mdi:history", title:"Last update", value:"—", sub:"System", tone:"blue" }
    ];
    return `<section class="footer-activity">
      <div class="footer-title">Recent activity</div>
      <div class="footer-items">
        ${items.map((it) => `<div class="footer-item tone-${this.rt.escape(it.tone)}"><div class="footer-icon"><ha-icon icon="${it.icon}"></ha-icon></div><div><b>${this.rt.escape(it.title)}</b><span>${this.rt.escape(it.value)}</span><small>${this.rt.escape(it.sub)}</small></div></div>`).join("")}
        <button class="footer-more">View all activity <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
    </section>`;
  }

  render(model) {
    this._activeAssetId = String(model.registryEntry?.asset_id || model.id || "");
    const backContext = this.returnContext(model);
    const actions = (model.actions || []).map((a) => this.renderAction(a)).join("");
    const statusItems = model.status || [];
    const status = statusItems.map((m) => `
      <div class="metric tone-${this.rt.escape(m.tone || "neutral")} ${m.detailRoute ? "has-detail-link" : ""}">
        <ha-icon icon="${m.icon}"></ha-icon>
        <div class="metric-copy"><span>${this.rt.escape(m.label)}</span>
          ${m.detailRoute
            ? `<button type="button" class="metric-related-value" data-nav="${this.rt.escape(this.relatedAssetRoute(m.detailRoute))}" aria-label="${this.rt.escape(m.detailTitle || "Open related asset details")}"><b>${this.rt.escape(m.value)}</b><ha-icon icon="mdi:chevron-right"></ha-icon></button>`
            : `<b>${this.rt.escape(m.value)}</b>`}
          ${m.subvalue ? `<small class="metric-sub">${m.subIcon ? `<ha-icon class="metric-sub-icon" icon="${this.rt.escape(m.subIcon)}"></ha-icon>` : ""}${this.rt.escape(m.subvalue)}</small>` : ""}</div>
      </div>`).join("");
    const mainSections = (model.sections || []).filter((s) => s && s.key !== "activity");
    const appearanceAsset = model.registryEntry || { asset_id:model.id || "", asset_type:model.type || "", image_key:model.visualKey || "" };
    const appearancePicker = model.type === "vehicle"
      ? new HomeBrainVehicleVisualPicker(this.rt).render(appearanceAsset, { showClose:false, context:"detail" })
      : model.type === "charger"
        ? new HomeBrainChargerVisualPicker(this.rt).render(appearanceAsset, { showClose:false, context:"detail" })
        : "";

    const detailHeroScene = rhiMobilityHeroAsset(model.type === "charger" ? "charging_detail" : "vehicle_detail");

    this.root.innerHTML = `
      <ha-card>
        <div class="page">
          <div class="hi-version-block" style="position:absolute;top:18px;right:22px;text-align:right;font-size:10.5px;line-height:1.25;font-weight:400;color:var(--secondary-text-color,#6B7280);opacity:.82;background:none;border:0;box-shadow:none;padding:0;margin:0;z-index:3;pointer-events:none;"><div>UX ${this.rt.escape(UX_VERSION)}</div><div>Backend ${this.rt.escape(this.rt.backendVersion())}</div></div>
          ${hbMobilityNav(model.type === "charger" ? "chargers" : "vehicles")}
          <nav class="detail-context-nav" aria-label="Return navigation"><button type="button" data-nav="${this.rt.escape(backContext.path)}"><ha-icon icon="mdi:arrow-left"></ha-icon><span>${this.rt.escape(backContext.label)}</span></button></nav>
          <section class="hero detail-scene-hero">
            <img class="detail-hero-scene" src="${this.rt.escape(detailHeroScene)}" alt="" aria-hidden="true" loading="eager" decoding="sync" fetchpriority="high" />
            <div class="hero-left">
              <div class="title-row"><h1>${this.rt.escape(model.display)}</h1></div>
              <div class="detail-purpose">${this.rt.escape(model.type === "charger"
                ? "Inspect charger availability, connection health, power, linked vehicle and direct controls for this charging point."
                : "Inspect readiness, charging relationship, operational status and direct actions for this vehicle.")}</div>
            </div>
            <div class="hero-image">
              ${this.renderHeroVisual(model)}
              ${appearancePicker ? `<button type="button" class="hero-appearance-edit" data-detail-appearance-toggle title="Choose appearance"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Appearance</span></button>` : ""}
            </div>
          </section>

          ${appearancePicker ? `<section class="detail-appearance-panel" data-detail-appearance-panel hidden><div class="detail-appearance-panel-head"><div><small>Appearance</small><b>${this.rt.escape(model.display)}</b></div><button type="button" data-detail-appearance-close title="Close appearance selector"><ha-icon icon="mdi:close"></ha-icon></button></div>${appearancePicker}</section>` : ""}
          <section class="detail-status-grid status-count-${Math.min(5,statusItems.length)}" aria-label="Asset status">${status}</section>
          <section class="actions"><div class="actions-title">${this.rt.escape(this.rt.t("common.quick_actions",{},"Quick actions"))}</div>${actions || `<div class="no-actions">No actions available for this asset.</div>`}</section>
          <section class="grid">${mainSections.map((s) => this.renderSection(s)).join("")}</section>
          ${this.renderFooter(model)}
        </div>
        <style>${this.styles()}${typeof rhiUxVisualPickerStyles === "function" ? rhiUxVisualPickerStyles() : ""}${hbMobilityResponsiveFinishStyles()}
/* R22.12.11.24 unified quick-action sizing */
.action.enum-action,.cmd.enum-command{height:43px;min-height:43px;max-height:43px;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;padding:0 11px;box-sizing:border-box;overflow:hidden}
.action.enum-action ha-icon,.cmd.enum-command ha-icon{flex:0 0 auto;grid-row:auto}
.action.enum-action select,.cmd.enum-command select{appearance:auto;-webkit-appearance:auto;min-width:0;max-width:170px;width:auto;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;font-weight:600;padding:0 2px;line-height:1;box-shadow:none;cursor:pointer;grid-column:auto}
.action.enum-action select:focus,.cmd.enum-command select:focus{outline:2px solid rgba(20,103,245,.20);outline-offset:3px;border-radius:6px}
.command-row>.cmd,.command-row>.enum-command{min-width:0;width:100%}
</style>
        ${hbMobilityReleaseFooter(this.rt)}
      </ha-card>`;
    this.wire();
  }

  wire() {
    this.root.querySelectorAll("button[data-command-id]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const assetId = btn.getAttribute("data-asset-id");
        const commandId = btn.getAttribute("data-command-id");
        const commandKey = btn.getAttribute("data-command-key") || commandId;
        const command = this.rt.commandsFor(assetId).find((c)=>String(c.command_key || c.command_id || "") === String(commandKey) || String(c.command_id || "") === String(commandId));
        if (command) this.rt.callCommand(command);
        btn.classList.add("sent");
      });
    });
    this.root.querySelectorAll("select[data-command-id]").forEach((el) => {
      el.addEventListener("change", () => {
        const assetId = el.getAttribute("data-command-asset");
        const commandId = el.getAttribute("data-command-id");
        const commandKey = el.getAttribute("data-command-key") || commandId;
        const param = el.getAttribute("data-command-param");
        const command = this.rt.commandsFor(assetId).find((c)=>String(c.command_key || c.command_id || "") === String(commandKey) || String(c.command_id || "") === String(commandId));
        if (command && el.value) this.rt.callCommand(command, { [param]: el.value });
      });
    });
    this.root.querySelectorAll("button[data-nav]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.rt.navigate(btn.getAttribute("data-nav"));
      });
    });
    const appearancePanel = this.root.querySelector("[data-detail-appearance-panel]");
    this.root.querySelectorAll("[data-detail-appearance-toggle]").forEach((btn)=>btn.addEventListener("click",(ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      if (!appearancePanel) return;
      appearancePanel.hidden = !appearancePanel.hidden;
      btn.classList.toggle("active", !appearancePanel.hidden);
      if (!appearancePanel.hidden) appearancePanel.scrollIntoView({block:"nearest",behavior:"smooth"});
    }));
    this.root.querySelectorAll("[data-detail-appearance-close]").forEach((btn)=>btn.addEventListener("click",(ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      if (appearancePanel) appearancePanel.hidden = true;
      this.root.querySelectorAll("[data-detail-appearance-toggle]").forEach((toggle)=>toggle.classList.remove("active"));
    }));
    this.root.querySelectorAll('input[type="range"][data-live-target]').forEach((el) => {
      const update = () => {
        const span = el.closest(".range-control")?.querySelector(".live-value");
        if (span) span.textContent = this.rt.formatValue(el.value, el.getAttribute("data-live-unit") || "", el.getAttribute("data-live-key") || "");
      };
      el.addEventListener("input", update);
      update();
    });


    this.root.querySelectorAll(".detail-vehicle-picker").forEach((panel) => {
      const brandSelect = panel.querySelector("[data-vehicle-picker-brand]");
      const modelSelect = panel.querySelector("[data-vehicle-picker-model]");
      const variantSelect = panel.querySelector("[data-vehicle-picker-variant]");
      const colorSelect = panel.querySelector("[data-vehicle-picker-color]");
      const saveButton = panel.querySelector("[data-vehicle-picker-save]");
      const keyNode = panel.querySelector(".vehicle-picker-key code");
      const assetId = brandSelect?.getAttribute("data-vehicle-picker-brand") || "";
      const picker = new HomeBrainVehicleVisualPicker(this.rt);
      const placeholder = (label)=>`<option value="" selected disabled>${this.rt.escape(label)}</option>`;

      panel.querySelectorAll("[data-vehicle-visual-choice]").forEach((choice)=>choice.addEventListener("click",()=>{
        const brand=choice.getAttribute("data-choice-brand") || "";
        const model=choice.getAttribute("data-choice-model") || "";
        const variant=choice.getAttribute("data-vehicle-visual-choice") || "";
        const color=choice.getAttribute("data-choice-color") || "";
        if(brandSelect){ brandSelect.value=brand; }
        refreshHierarchy("brand");
        if(modelSelect){ modelSelect.value=model; }
        refreshHierarchy("model");
        if(variantSelect){ variantSelect.value=variant; }
        refreshHierarchy("variant");
        if(colorSelect){ colorSelect.value=color; }
        updatePreview();
      }));

      const refreshHierarchy = (level) => {
        const catalog = picker.catalog();
        const brand = String(brandSelect?.value || "");
        if (level === "brand") {
          const models = picker.modelsForBrand(brand, catalog);
          if (modelSelect) {
            modelSelect.disabled = !brand;
            modelSelect.innerHTML = placeholder("Choose model…") + models.map((model)=>`<option value="${this.rt.escape(model)}">${this.rt.escape(model)}</option>`).join("");
          }
          if (variantSelect) { variantSelect.disabled = true; variantSelect.innerHTML = placeholder("Choose variant…"); }
          if (colorSelect) { colorSelect.disabled = true; colorSelect.innerHTML = placeholder("Choose colour…"); }
        }
        if (level === "model") {
          const model = String(modelSelect?.value || "");
          const variants = picker.variantsFor(brand, model, catalog);
          if (variantSelect) {
            variantSelect.disabled = !model;
            variantSelect.innerHTML = placeholder("Choose variant…") + variants.map((row)=>`<option value="${this.rt.escape(row.id)}">${this.rt.escape(row.variant)} · ${this.rt.escape(row.years)}</option>`).join("");
          }
          if (colorSelect) { colorSelect.disabled = true; colorSelect.innerHTML = placeholder("Choose colour…"); }
        }
        if (level === "variant") {
          const vehicle = catalog.find((row)=>row.id === String(variantSelect?.value || "")) || null;
          if (colorSelect) {
            colorSelect.disabled = !vehicle;
            colorSelect.innerHTML = placeholder("Choose colour…") + (vehicle?.colors || []).map((color)=>`<option value="${this.rt.escape(color.id)}">${this.rt.escape(color.label)}</option>`).join("");
          }
        }
        updatePreview();
      };

      const updatePreview = () => {
        const asset = this.rt.vehicleById(assetId) || this.rt.assetById(assetId) || {asset_id:assetId,asset_type:"vehicle"};
        const draft = {
          brand:String(brandSelect?.value || ""),
          model:String(modelSelect?.value || ""),
          variant_id:String(variantSelect?.value || ""),
          color_id:String(colorSelect?.value || "")
        };
        const visual = picker.selection(asset,draft);
        if (keyNode) keyNode.textContent = visual.key || "Unavailable";
        if (saveButton) {
          saveButton.setAttribute("data-vehicle-key", visual.key || "");
          saveButton.setAttribute("data-vehicle-profile-id", visual.profile_id || "");
          saveButton.disabled = !visual.writable;
        }
        const pickerPreview = panel.querySelector('[data-picker-visual-preview="vehicle"]');
        if (pickerPreview && visual.vehicle?.package_file) {
          pickerPreview.src = this.rt.cache(visual.vehicle.package_file);
          pickerPreview.style.filter = visual.color?.filter || "none";
          const copy = pickerPreview.closest(".visual-picker-preview")?.querySelector("div");
          if (copy) copy.innerHTML = `<small>Selected appearance</small><b>${this.rt.escape(visual.vehicle.label || visual.vehicle.model || "Vehicle")}</b><span>${this.rt.escape(visual.color?.label || "")}</span>`;
        }
        const hero = this.root.querySelector('[data-vehicle-visual-preview="1"]');
        if (hero && visual.vehicle) {
          if (visual.vehicle.package_file) hero.src = this.rt.cache(visual.vehicle.package_file);
          const gray = hero.getAttribute("data-image-gray") || "0";
          hero.style.filter = `grayscale(${gray}) ${visual.color?.filter || "none"} drop-shadow(0 24px 30px rgba(15,35,80,.15))`;
        }
      };

      brandSelect?.addEventListener("change", ()=>refreshHierarchy("brand"));
      modelSelect?.addEventListener("change", ()=>refreshHierarchy("model"));
      variantSelect?.addEventListener("change", ()=>refreshHierarchy("variant"));
      colorSelect?.addEventListener("change", updatePreview);
      saveButton?.addEventListener("click", async ()=>{
        if (saveButton.disabled) return;
        const profileId = saveButton.getAttribute("data-vehicle-profile-id") || "";
        const key = saveButton.getAttribute("data-vehicle-key") || "";
        if (!assetId || !key) return;
        const revert = (message) => {
          const asset = this.rt.vehicleById(assetId) || this.rt.assetById(assetId) || {asset_id:assetId,asset_type:"vehicle"};
          const canonical = picker.selection(asset,{});
          const pickerPreview = panel.querySelector('[data-picker-visual-preview="vehicle"]');
          if (pickerPreview && canonical.vehicle?.package_file) {
            pickerPreview.src = this.rt.cache(canonical.vehicle.package_file);
            pickerPreview.style.filter = canonical.color?.filter || "none";
          }
          const hero = this.root.querySelector('[data-vehicle-visual-preview="1"]');
          if (hero && canonical.vehicle?.package_file) {
            hero.src = this.rt.cache(canonical.vehicle.package_file);
            const gray = hero.getAttribute("data-image-gray") || "0";
            hero.style.filter = `grayscale(${gray}) ${canonical.color?.filter || "none"} drop-shadow(0 24px 30px rgba(15,35,80,.15))`;
          }
          saveButton.disabled = false;
          saveButton.classList.add("failed");
          saveButton.title = message;
        };
        saveButton.disabled = true;
        saveButton.classList.remove("failed");
        const profileProp = this.rt.semanticProperty(assetId, "asset.profile_id");
        const currentProfile = String(profileProp?.value || "");
        const profileOk = !profileId || profileId === currentProfile || await this.rt.writePublishedPropertyAsync(assetId, "asset.profile_id", profileId);
        if (!profileOk) { revert("Profile update was rejected. Appearance was not changed."); return; }
        const imageOk = await this.rt.writePublishedPropertyAsync(assetId, "vehicle.image_key", key);
        if (!imageOk) { revert("Appearance update was rejected or canonical readback did not confirm it."); return; }
        saveButton.classList.add("sent");
      });
    });

    this.root.querySelectorAll(".detail-charger-picker").forEach((panel) => {
      const brandSelect = panel.querySelector("[data-charger-picker-brand]");
      const modelSelect = panel.querySelector("[data-charger-picker-model]");
      const variantSelect = panel.querySelector("[data-charger-picker-variant]");
      const appearanceSelect = panel.querySelector("[data-charger-picker-appearance]");
      const saveButton = panel.querySelector("[data-charger-picker-save]");
      const keyNode = panel.querySelector(".vehicle-picker-key code");
      const assetId = brandSelect?.getAttribute("data-charger-picker-brand") || "";
      const picker = new HomeBrainChargerVisualPicker(this.rt);
      const placeholder = (label)=>`<option value="" selected disabled>${this.rt.escape(label)}</option>`;

      panel.querySelectorAll("[data-charger-visual-choice]").forEach((choice)=>choice.addEventListener("click",()=>{
        const brand=choice.getAttribute("data-choice-brand") || "";
        const model=choice.getAttribute("data-choice-model") || "";
        const variant=choice.getAttribute("data-charger-visual-choice") || "";
        const appearance=choice.getAttribute("data-choice-appearance") || "";
        if(brandSelect){ brandSelect.value=brand; }
        refreshHierarchy("brand");
        if(modelSelect){ modelSelect.value=model; }
        refreshHierarchy("model");
        if(variantSelect){ variantSelect.value=variant; }
        refreshHierarchy("variant");
        if(appearanceSelect){ appearanceSelect.value=appearance; }
        updatePreview();
      }));

      const updatePreview = () => {
        const asset = this.rt.chargerById(assetId) || this.rt.assetById(assetId) || {asset_id:assetId,asset_type:"charger"};
        const draft = {
          brand:String(brandSelect?.value || ""),
          model:String(modelSelect?.value || ""),
          variant_id:String(variantSelect?.value || ""),
          appearance_id:String(appearanceSelect?.value || "")
        };
        const visual = picker.selection(asset,draft);
        if (keyNode) keyNode.textContent = visual.key || "Unavailable";
        if (saveButton) {
          saveButton.setAttribute("data-charger-key", visual.key || "");
          saveButton.setAttribute("data-charger-profile-id", visual.profile_id || "");
          saveButton.disabled = !visual.writable;
        }
        const pickerPreview = panel.querySelector('[data-picker-visual-preview="charger"]');
        if (pickerPreview && visual.appearance?.package_file) {
          pickerPreview.src = this.rt.cache(visual.appearance.package_file);
          const copy = pickerPreview.closest(".visual-picker-preview")?.querySelector("div");
          if (copy) copy.innerHTML = `<small>Selected appearance</small><b>${this.rt.escape(visual.charger?.label || visual.charger?.model || "Charger")}</b><span>${this.rt.escape(visual.appearance?.label || "")}</span>`;
        }
        const hero = this.root.querySelector('[data-charger-visual-preview="1"]');
        if (hero && visual.appearance?.package_file) hero.src = this.rt.cache(visual.appearance.package_file);
      };

      const refreshHierarchy = (level) => {
        const catalog = picker.catalog();
        const brand = String(brandSelect?.value || "");
        if (level === "brand") {
          const models = picker.modelsForBrand(brand, catalog);
          if (modelSelect) {
            modelSelect.disabled = !brand;
            modelSelect.innerHTML = placeholder("Choose model…") + models.map((model)=>`<option value="${this.rt.escape(model)}">${this.rt.escape(model)}</option>`).join("");
          }
          if (variantSelect) { variantSelect.disabled = true; variantSelect.innerHTML = placeholder("Choose variant…"); }
          if (appearanceSelect) { appearanceSelect.disabled = true; appearanceSelect.innerHTML = placeholder("Choose colour…"); }
        }
        if (level === "model") {
          const model = String(modelSelect?.value || "");
          const variants = picker.variantsFor(brand, model, catalog);
          if (variantSelect) {
            variantSelect.disabled = !model;
            variantSelect.innerHTML = placeholder("Choose variant…") + variants.map((row)=>`<option value="${this.rt.escape(row.id)}">${this.rt.escape(row.variant || "Standard")} · ${this.rt.escape(row.years)}</option>`).join("");
          }
          if (appearanceSelect) { appearanceSelect.disabled = true; appearanceSelect.innerHTML = placeholder("Choose colour…"); }
        }
        if (level === "variant") {
          const charger = catalog.find((row)=>row.id === String(variantSelect?.value || "")) || null;
          if (appearanceSelect) {
            appearanceSelect.disabled = !charger;
            appearanceSelect.innerHTML = placeholder("Choose colour…") + (charger?.appearances || []).map((row)=>`<option value="${this.rt.escape(row.id)}">${this.rt.escape(row.label)}</option>`).join("");
          }
        }
        updatePreview();
      };

      brandSelect?.addEventListener("change", ()=>refreshHierarchy("brand"));
      modelSelect?.addEventListener("change", ()=>refreshHierarchy("model"));
      variantSelect?.addEventListener("change", ()=>refreshHierarchy("variant"));
      appearanceSelect?.addEventListener("change", updatePreview);
      saveButton?.addEventListener("click", async ()=>{
        if (saveButton.disabled) return;
        const profileId = saveButton.getAttribute("data-charger-profile-id") || "";
        const key = saveButton.getAttribute("data-charger-key") || "";
        if (!assetId || !key) return;
        const revert = (message) => {
          const asset = this.rt.chargerById(assetId) || this.rt.assetById(assetId) || {asset_id:assetId,asset_type:"charger"};
          const canonical = picker.selection(asset,{});
          const pickerPreview = panel.querySelector('[data-picker-visual-preview="charger"]');
          if (pickerPreview && canonical.appearance?.package_file) pickerPreview.src = this.rt.cache(canonical.appearance.package_file);
          const hero = this.root.querySelector('[data-charger-visual-preview="1"]');
          if (hero && canonical.appearance?.package_file) hero.src = this.rt.cache(canonical.appearance.package_file);
          saveButton.disabled = false;
          saveButton.classList.add("failed");
          saveButton.title = message;
        };
        saveButton.disabled = true;
        saveButton.classList.remove("failed");
        const profileProp = this.rt.semanticProperty(assetId, "asset.profile_id");
        const currentProfile = String(profileProp?.value || "");
        const profileOk = !profileId || profileId === currentProfile || await this.rt.writePublishedPropertyAsync(assetId, "asset.profile_id", profileId);
        if (!profileOk) { revert("Profile update was rejected. Appearance was not changed."); return; }
        const imageOk = await this.rt.writePublishedPropertyAsync(assetId, "charger.image_key", key);
        if (!imageOk) { revert("Appearance update was rejected or canonical readback did not confirm it."); return; }
        saveButton.classList.add("sent");
      });
    });

    this.root.querySelectorAll("[data-write-asset][data-write-key]").forEach((el) => {
      const send = async () => {
        const assetId = el.getAttribute("data-write-asset");
        const propertyKey = el.getAttribute("data-write-key");
        if (!assetId || !propertyKey || el.disabled) return;
        let value = el.type === "checkbox" ? el.checked : el.value;
        if (el.getAttribute("data-write-toggle") === "1") value = !el.classList.contains("on");
        // Canonical backend readback is the only durable truth. The control stays
        // pending until the requested semantic value is observed on the published
        // property; rejected/time-out writes fail visibly and are never committed locally.
        el.disabled = true;
        el.classList.remove("sent","failed");
        const ok = await this.rt.writePublishedPropertyAsync(assetId, propertyKey, value);
        if (ok) {
          el.classList.add("sent");
        } else {
          el.classList.add("failed");
          el.title = "Write rejected or canonical readback did not confirm the requested value.";
          el.disabled = false;
        }
      };
      el.addEventListener(el.tagName === "BUTTON" ? "click" : "change", send);
    });
  }

  styles() {
    return `
      :host { display:block;width:100%;box-sizing:border-box;--hb-blue:#1467F5;--hb-ink:#06142D;--hb-muted:#66728B;--hb-line:#E8EEF7;--hb-card-shadow:0 16px 38px rgba(15,35,80,.070);user-select:text;-webkit-user-select:text; }
      ha-card { background:transparent;box-shadow:none;border:none; }
      .page { position:relative;width:min(100%,1560px);max-width:1560px;margin:0 auto;box-sizing:border-box;display:grid;gap:12px;padding:18px 26px 30px; }
      .release-badge { position:absolute;top:6px;right:26px;z-index:3;border:1px solid rgba(14,35,72,.10);background:rgba(255,255,255,.92);color:#33415C;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:650;line-height:1;box-shadow:0 8px 20px rgba(15,35,80,.055); }
      .hero { position:relative;min-height:300px;display:grid;grid-template-columns:minmax(520px,1fr) minmax(420px,43%);gap:28px;align-items:center;padding:26px 42px 22px;border-radius:24px;border:1px solid rgba(14,35,72,.10);background:linear-gradient(135deg,#FFFFFF 0%,#F7FAFF 48%,#EDF4FF 100%);box-shadow:0 18px 42px rgba(15,35,80,.075);overflow:hidden; }
      .hero-topline { display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px; }
      .back-inline { border:0;background:transparent;color:var(--hb-ink);font-weight:650;cursor:pointer;padding:0;font-size:13px;white-space:nowrap; }
      .back-inline:hover { color:var(--hb-blue); }
      .breadcrumb { font-size:13px;font-weight:600;color:#596783;display:flex;gap:8px;align-items:center; }
      .crumb-light { color:#596783; }
      .title-row { display:flex;align-items:center;gap:16px;flex-wrap:wrap; }
      h1 { margin:0;font-size:54px;line-height:.98;letter-spacing:-.06em;font-weight:650;color:var(--hb-ink); }
      .subtitle { margin-top:12px;color:#34405A;font-size:18px;font-weight:650; }
      .pill { display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:8px 15px;font-size:13px;font-weight:650;border:1px solid rgba(14,35,72,.09);white-space:nowrap;line-height:1; }
      .pill.ok { background:#E7F6EA;color:#087A35; }.pill.warn { background:#FFF1D9;color:#B76500; }.pill.bad { background:#FDE4E4;color:#C21E1E; }.pill.muted { background:#EEF1F6;color:#64708A; }
      .status-strip { margin-top:18px;max-width:none;width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid rgba(14,35,72,.11);border-radius:16px;background:rgba(255,255,255,.95);box-shadow:0 14px 34px rgba(15,35,80,.07);overflow:hidden; }
      .metric { display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:center;padding:12px 16px;border-right:1px solid #E6ECF5;min-width:0; }
      .metric:last-child { border-right:0; }.metric ha-icon { --mdc-icon-size:23px;color:var(--hb-blue); }.metric ha-icon.green { color:#10A74C; }
      .metric b { display:block;font-size:15px;font-weight:650;color:var(--hb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }.metric span { display:block;font-size:11px;font-weight:600;color:var(--hb-muted);margin-top:4px; }

      .metric-copy{min-width:0;}
      .metric-sub{display:block;font-size:10.5px;font-weight:500;color:var(--hb-muted,#66728B);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
      .metric.has-detail-link{grid-template-columns:34px minmax(0,1fr) 30px;}
      .metric-detail-link,.row-detail-link{width:28px;height:28px;border-radius:999px;border:1px solid rgba(14,35,72,.10);background:rgba(255,255,255,.92);color:#1467F5;box-shadow:0 6px 14px rgba(15,35,80,.08);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:0 0 auto;}
      .metric-detail-link ha-icon,.row-detail-link ha-icon{--mdc-icon-size:16px;}
      .row-value-with-link{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0;}
      .row-value-with-link span{min-width:0;overflow:hidden;text-overflow:ellipsis;}
      .hero-image { min-height:260px;display:flex;align-items:center;justify-content:center; }
      .hero-image img { width:100%;height:285px;object-fit:contain;object-position:center;transition:none;animation:none; }
      .hero-image img.image-fallback { opacity:.42; }
      .hero-appearance-edit{position:absolute;right:10px;bottom:10px;z-index:5;height:36px;border:1px solid rgba(14,35,72,.12);border-radius:11px;background:rgba(255,255,255,.94);color:#1467F5;padding:0 11px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:650;cursor:pointer;box-shadow:0 8px 20px rgba(15,35,80,.08);pointer-events:auto}.hero-appearance-edit ha-icon{--mdc-icon-size:17px}.hero-appearance-edit.active{background:#1467F5;color:#fff;border-color:#1467F5}
      .detail-appearance-panel[hidden]{display:none}.detail-appearance-panel{position:relative;z-index:8;width:min(100%,980px);margin:-2px auto 0;padding:12px;border:1px solid var(--hb-line);border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,35,80,.09);box-sizing:border-box}.detail-appearance-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 2px 10px}.detail-appearance-panel-head div{display:grid;gap:2px}.detail-appearance-panel-head small{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--hb-muted);font-weight:650}.detail-appearance-panel-head b{font-size:14px;color:var(--hb-ink)}.detail-appearance-panel-head button{width:32px;height:32px;border:1px solid var(--hb-line);border-radius:10px;background:#fff;color:var(--hb-muted);display:grid;place-items:center;cursor:pointer}.detail-appearance-panel .detail-vehicle-picker,.detail-appearance-panel .detail-charger-picker{margin:0;padding:0;border:0;background:transparent}.detail-appearance-panel .visual-picker-panel{margin:0}
      .hero-icon { width:220px;height:220px;border-radius:48px;background:linear-gradient(135deg,#EAF2FF,#FFFFFF);display:flex;align-items:center;justify-content:center;box-shadow:0 24px 55px rgba(15,35,80,.10); }
      .hero-icon ha-icon { --mdc-icon-size:120px;color:var(--hb-blue); }

            .actions { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px; }.action { height:58px;border-radius:14px;border:1px solid rgba(14,35,72,.11);background:#fff;color:var(--hb-ink);font-weight:650;font-size:14px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 12px 28px rgba(15,35,80,.06);cursor:pointer; }.action ha-icon { --mdc-icon-size:22px;color:var(--hb-blue); }.action.primary { background:linear-gradient(135deg,#1467F5,#3C7BFF);color:#fff;border-color:#1467F5; }.action.primary ha-icon { color:#fff; }
      .action small { display:block;font-size:9.5px;font-weight:650;line-height:1.05;opacity:.72;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; } .enum-action { flex-direction:column;height:auto;min-height:58px;padding:8px 10px; } .enum-action select { max-width:160px;border:1px solid rgba(14,35,72,.15);border-radius:10px;background:#fff;padding:4px 6px;font-size:11px;font-weight:600; } .enum-action.is-disabled { opacity:.55; } .no-actions { grid-column:1/-1;border:1px solid rgba(14,35,72,.10);border-radius:18px;background:#fff;padding:24px;color:var(--hb-muted);font-weight:600; }
      .grid { display:grid;grid-template-columns:repeat(4,minmax(260px,1fr));gap:12px; }
      .section-card { min-height:245px;border-radius:18px;border:1px solid rgba(14,35,72,.10);background:#fff;box-shadow:var(--hb-card-shadow);overflow:hidden; }
      .section-head { display:flex;align-items:center;justify-content:space-between;gap:14px;padding:22px 24px 16px; }.section-title { display:flex;align-items:center;gap:12px;min-width:0; }.section-title ha-icon { --mdc-icon-size:23px;color:var(--hb-blue);flex:none; }.section-title h2 { margin:0;color:var(--hb-ink);font-size:21px;font-weight:650;letter-spacing:-.035em;line-height:1.1; }.section-status { font-size:12px;font-weight:650;color:#50607B;max-width:135px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
      .section-body { border-top:1px solid var(--hb-line);margin:0 24px;padding-top:4px; }
      .action-cluster{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0 6px}.action-cluster .action{height:38px;min-width:116px;width:auto;padding:0 12px;border-radius:12px;font-size:13px;box-shadow:none}.action-cluster .action small{display:none}
      .unit-suffix{display:inline-flex;align-items:center;margin-left:6px;color:#66728B;font-size:12px;font-weight:600;white-space:nowrap}.row-subheader{margin:12px 0 4px;padding:7px 0 5px;border-bottom:1px solid #EDF2F8;color:#1467F5;font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.08em}.row-subheader:first-child{margin-top:4px}.row-subheader-small{margin:7px 0 2px;color:#66728B;font-size:11px;font-weight:600}
      .row,.edit-row { display:grid;grid-template-columns:26px minmax(0,1fr) minmax(140px,auto);gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #EDF2F8; }
      .detail-vehicle-picker{margin:8px 0 12px;border:1px solid #cfe0f6;border-radius:14px;background:linear-gradient(135deg,#fbfdff,#f3f8ff);padding:12px 14px}.vehicle-picker-head{display:flex;justify-content:space-between;gap:14px;align-items:start}.vehicle-picker-head small{font-size:8.5px;letter-spacing:.13em;color:#64748b;font-weight:750}.vehicle-picker-head h3{margin:2px 0;font-size:15px;color:#0f172a}.vehicle-picker-head p{margin:0;font-size:9.5px;color:#64748b}.vehicle-picker-grid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;align-items:end;margin-top:10px}.vehicle-picker-hierarchy .vehicle-picker-key{grid-column:1/4}.vehicle-picker-hierarchy .vehicle-picker-save{grid-column:4}.vehicle-picker-grid label,.vehicle-picker-key{display:flex;flex-direction:column;gap:4px}.vehicle-picker-grid label>span,.vehicle-picker-key>span{font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.vehicle-picker-grid select{height:34px;border:1px solid #d7e2ef;border-radius:8px;background:#fff;color:#0f172a;padding:0 8px;font-size:10.5px;font-weight:600}.vehicle-picker-key code{height:34px;display:flex;align-items:center;border:1px solid #d7e2ef;border-radius:8px;background:#fff;padding:0 8px;font-size:8.5px;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vehicle-picker-save{height:34px;border:1px solid #0b65ea;border-radius:8px;background:#0b65ea;color:#fff;padding:0 11px;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;cursor:pointer}.vehicle-picker-save:disabled{background:#e2e8f0;border-color:#d5deea;color:#94a3b8;cursor:not-allowed}.vehicle-picker-gap{margin-top:8px;display:flex;align-items:center;gap:6px;color:#9a5a16;font-size:9.5px}.vehicle-picker-gap ha-icon{--mdc-icon-size:14px}
      @media(max-width:900px){.visual-picker-preview{grid-template-columns:86px minmax(0,1fr)}.visual-picker-preview img{width:80px;height:54px}.detail-vehicle-picker .vehicle-picker-grid{grid-template-columns:1fr 1fr}.detail-vehicle-picker .vehicle-picker-key{grid-column:1/-1}.detail-vehicle-picker .vehicle-picker-save{justify-content:center}}
      .row:last-child,.edit-row:last-child { border-bottom:0; }.row ha-icon,.edit-row ha-icon { --mdc-icon-size:19px;color:var(--hb-blue); }
      .label { font-size:13px;font-weight:600;color:#26334F; }.help { color:var(--hb-muted);font-size:11px;font-weight:600;margin-top:2px; }.help.warn{color:#A15C00}.edit-row.is-disabled{opacity:.74}.value { font-size:13px;font-weight:650;color:var(--hb-ink);text-align:right;max-width:155px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
      .edit-control { display:flex;justify-content:flex-end;align-items:center;min-width:0; }
      select,.datetime { height:36px;border:1px solid #DDE6F2;border-radius:10px;background:#fff;color:var(--hb-ink);font-weight:600;padding:0 12px;max-width:190px; }
      select:disabled,.datetime:disabled,input:disabled { opacity:.55;cursor:not-allowed; }
      .range-control { display:flex;align-items:center;gap:10px;min-width:190px; }.range-control input { width:130px;accent-color:var(--hb-blue); }.range-control span { font-size:13px;font-weight:650;color:var(--hb-ink);min-width:42px;text-align:right; }
      .toggle { width:48px;height:28px;border-radius:999px;border:0;background:#CBD5E1;padding:3px;display:flex;justify-content:flex-start;cursor:pointer; }.toggle span { width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18); }.toggle.on { background:var(--hb-blue);justify-content:flex-end; }
      .section-contract-consumption .detail-fold summary,.section-diagnostics .detail-fold summary{color:#66728B}.detail-fold summary { list-style:none;cursor:pointer;color:var(--hb-blue);font-size:13px;font-weight:650;padding:12px 24px 14px;display:flex;gap:6px;align-items:center; }.detail-fold summary::-webkit-details-marker { display:none; }
      .detail-block { border-top:1px solid #EDF2F8;margin:0 24px 18px;padding-top:12px; }.detail-row { display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #EDF2F8;padding:8px 0;font-size:12px;color:var(--hb-muted);font-weight:600; }.detail-row b { color:var(--hb-ink);font-weight:650;text-align:right; }

      /* R22.10.3 premium hero layout: large profile-driven vehicle hero with compact intelligence strip and floating charger image. */
      .page { max-width:1540px; gap:16px; padding-top:14px; }
      .release-badge { top:10px; right:34px; font-weight:600; }
      .hero { min-height:390px; display:block; padding:28px 34px 26px; border:0; border-radius:0; background:linear-gradient(180deg,#fff 0%,#f7fbff 78%,#fff 100%); box-shadow:none; overflow:hidden; }
      .detail-hero-scene { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; opacity:.11; pointer-events:none; z-index:0; }
      .detail-scene-hero .hero-left,.detail-scene-hero .hero-image,.detail-scene-hero .hero-charger-image { position:relative; z-index:2; }
      .hero:after { content:""; position:absolute; left:44%; right:4%; bottom:22px; height:24px; border-radius:50%; background:rgba(15,35,80,.075); filter:blur(18px); z-index:0; }
      .hero-left { position:relative; z-index:2; width:58%; min-width:520px; }
      .hero-topline { margin-bottom:22px; max-width:720px; }
      .back-inline { font-weight:600; font-size:13px; }
      .breadcrumb { font-size:12px; font-weight:500; color:#536078; }
      h1 { font-size:52px; line-height:.96; letter-spacing:-.055em; font-weight:600; color:#071327; max-width:720px; }
      .subtitle { margin-top:14px; font-size:18px; font-weight:500; color:#536078; }
      .title-row { align-items:center; }
      .pill { padding:7px 13px; font-size:12px; font-weight:600; }
      .hero-image { position:absolute; z-index:1; right:122px; top:26px; width:54%; height:330px; min-height:0; display:flex; align-items:flex-start; justify-content:center; pointer-events:none; }
      .hero-image img { width:100%; height:330px; object-fit:contain; object-position:center top; filter:drop-shadow(0 28px 34px rgba(15,35,80,.18)); }
      .hero-charger-image { position:absolute; z-index:2; right:34px; top:82px; width:120px; height:218px; display:flex; align-items:center; justify-content:center; pointer-events:none; }
      .hero-charger-image img { max-width:112px; max-height:210px; object-fit:contain; filter:drop-shadow(0 18px 22px rgba(15,35,80,.14)); }
      .status-strip { position:relative; z-index:3; margin-top:46px; max-width:none;width:100%; grid-template-columns:repeat(5,minmax(0,1fr)); border-radius:17px; background:rgba(255,255,255,.94); backdrop-filter:blur(10px); box-shadow:0 16px 32px rgba(15,35,80,.08); }
      .metric { min-height:72px; grid-template-columns:30px minmax(0,1fr); gap:9px; padding:10px 13px; }
      .metric ha-icon { --mdc-icon-size:22px; color:#1467F5; }
      .metric.tone-green ha-icon { color:#18A957; }.metric.tone-orange ha-icon { color:#F59E0B; }.metric.tone-blue ha-icon { color:#1467F5; }
      .metric span { font-size:10px; font-weight:500; color:#536078; margin:0 0 4px; text-transform:none; }
      .metric b { font-size:14px; font-weight:650; color:#071327; }
      .actions { min-height:64px; border:1px solid rgba(14,35,72,.08); border-radius:18px; background:rgba(255,255,255,.94); box-shadow:0 10px 24px rgba(15,35,80,.045); padding:10px 18px; grid-template-columns:130px repeat(6,minmax(120px,170px)); align-items:center; justify-content:start; }
      .actions-title { font-size:14px; font-weight:650; color:#071327; }
      .action { height:42px; min-height:42px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:none; }
      .action.primary { background:#1467F5; }
      .grid { grid-template-columns:repeat(4,minmax(250px,1fr)); gap:16px; }
      .section-card { border-radius:18px; min-height:310px; box-shadow:0 14px 32px rgba(15,35,80,.055); }
      .section-title h2 { font-size:19px; font-weight:650; letter-spacing:-.025em; }
      .section-status { font-weight:600; }
      .label { font-weight:500; color:#14213b; }
      .value, .range-control span, .detail-row b { font-weight:650; }
      select,.datetime { font-weight:500; }
      @media (max-width:1100px) { .grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.actions { grid-template-columns:repeat(2,minmax(0,1fr)); }.hero { grid-template-columns:1fr; }.hero-image { min-height:220px; } }
      @media (max-width:760px) { .page { padding:14px; }.hero { padding:24px 20px 20px;grid-template-columns:1fr;min-height:0; } h1 { font-size:38px; }.status-strip { grid-template-columns:1fr 1fr; }.metric:nth-child(2){border-right:0}.metric:nth-child(1),.metric:nth-child(2){border-bottom:1px solid #E6ECF5}.grid { grid-template-columns:1fr; }.actions { grid-template-columns:1fr; }.hero-topline { align-items:flex-start; }.row,.edit-row { grid-template-columns:26px minmax(0,1fr); }.edit-control,.value { grid-column:2;justify-content:flex-start;text-align:left; } }

      @media (max-width:1100px) {
        .hero { min-height:560px; padding:24px 24px 22px; }
        .hero-left { width:100%; min-width:0; }
        .hero-image { position:relative; right:auto; top:auto; width:100%; height:260px; margin-top:12px; }
        .hero-image img { height:260px; }
        .hero-charger-image { right:24px; top:270px; width:96px; height:170px; }
        .hero-charger-image img { max-width:90px; max-height:165px; }
        .status-strip { margin-top:16px; max-width:100%; }
        .actions { grid-template-columns:1fr 1fr 1fr; }
        .actions-title { grid-column:1/-1; }
      }
      @media (max-width:760px) {
        .hero { min-height:0; padding:22px 16px 18px; }
        h1 { font-size:38px; }
        .subtitle { font-size:15px; }
        .hero-image { height:210px; }
        .hero-image img { height:210px; }
        .hero-charger-image { position:absolute; right:18px; top:220px; width:72px; height:120px; }
        .hero-charger-image img { max-width:70px; max-height:118px; }
        .status-strip { grid-template-columns:1fr; border-radius:16px; }
        .metric { border-right:0; border-bottom:1px solid #E6ECF5; min-height:58px; }
        .metric:last-child { border-bottom:0; }
        .actions { grid-template-columns:1fr; }
      }


      /* R22.10.3 implementation of approved premium mock: calm white hero, vehicle behind compact status strip, charger image only, footer activity bar. */
      .page { max-width:1560px; gap:14px; padding:18px 24px 32px; }
      .release-badge { top:10px; right:30px; font-weight:600; }
      .hero { min-height:350px; position:relative; padding:28px 34px 20px; background:#fff; border:0; border-radius:0; box-shadow:none; overflow:hidden; }
      .hero:before { content:""; position:absolute; inset:22px 0 auto 44%; height:330px; background:radial-gradient(circle at 54% 56%, rgba(20,103,245,.075), transparent 56%); z-index:0; pointer-events:none; }
      .hero:after { content:""; position:absolute; left:55%; right:9%; bottom:54px; height:22px; border-radius:50%; background:rgba(15,35,80,.10); filter:blur(18px); z-index:0; }
      .hero-left { position:relative; z-index:3; width:57%; min-width:540px; }
      .hero-topline { margin-bottom:24px; max-width:760px; }
      .breadcrumb { font-size:12px; font-weight:500; color:#536078; }
      .back-inline { font-size:13px; font-weight:650; color:#071327; }
      h1 { font-size:64px; line-height:.90; letter-spacing:-.06em; font-weight:600; color:#071327; max-width:760px; margin:0; }
      .subtitle { margin-top:14px; font-size:17px; font-weight:500; color:#536078; }
      .title-row { gap:16px; align-items:center; }
      .pill { padding:7px 14px; font-size:12px; font-weight:650; }
      .hero-image { position:absolute; z-index:1; right:110px; top:56px; width:56%; height:290px; min-height:0; display:flex; align-items:flex-start; justify-content:center; pointer-events:none; }
      .hero-image img { width:100%; height:300px; object-fit:contain; object-position:center top; filter:drop-shadow(0 26px 30px rgba(15,35,80,.17)); }
      .hero-charger-image { position:absolute; z-index:2; right:32px; top:92px; width:105px; height:178px; display:flex; align-items:center; justify-content:center; background:transparent; pointer-events:none; }
      .hero-charger-image img { max-width:102px; max-height:170px; object-fit:contain; filter:drop-shadow(0 16px 20px rgba(15,35,80,.13)); }
      .hero-charger-name{position:absolute;left:50%;top:-10px;transform:translateX(-50%);max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:600;color:var(--hb-ink,#0F172A);text-align:center;}
      .hero-charger-detail-link{position:absolute;right:2px;bottom:12px;width:30px;height:30px;border-radius:999px;border:1px solid rgba(14,35,72,.10);background:rgba(255,255,255,.92);color:#1467F5;box-shadow:0 8px 20px rgba(15,35,80,.10);display:flex;align-items:center;justify-content:center;pointer-events:auto;}
      .hero-charger-detail-link ha-icon{--mdc-icon-size:17px;}

      .status-strip { position:relative; z-index:4; margin-top:50px; max-width:none;width:100%; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); border-radius:16px; border:1px solid rgba(14,35,72,.10); background:rgba(255,255,255,.96); backdrop-filter:blur(10px); box-shadow:0 14px 28px rgba(15,35,80,.075); overflow:hidden; }
      .metric { min-height:58px; grid-template-columns:26px minmax(0,1fr); gap:8px; padding:8px 12px; }
      .metric ha-icon { --mdc-icon-size:21px; }
      .metric span { font-size:10px; font-weight:500; color:#536078; margin:0 0 3px; text-transform:none; }
      .metric b { font-size:13px; font-weight:650; color:#071327; }
      .actions { min-height:56px; border:1px solid rgba(14,35,72,.08); border-radius:17px; background:rgba(255,255,255,.96); box-shadow:0 10px 22px rgba(15,35,80,.045); padding:9px 16px; grid-template-columns:130px repeat(6,minmax(118px,165px)); align-items:center; justify-content:start; gap:12px; }
      .actions-title { font-size:14px; font-weight:650; color:#071327; }
      .action { height:40px; min-height:40px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:none; }
      .grid { grid-template-columns:repeat(4,minmax(250px,1fr)); gap:16px; }
      .section-card { min-height:300px; border-radius:18px; box-shadow:0 14px 32px rgba(15,35,80,.055); }
      .section-title h2 { font-size:19px; font-weight:650; letter-spacing:-.025em; }
      .section-status,.label,select,.datetime { font-weight:500; }
      .value,.range-control span,.detail-row b { font-weight:650; }
      .footer-activity { border:1px solid rgba(14,35,72,.08); border-radius:18px; background:#fff; box-shadow:0 14px 32px rgba(15,35,80,.055); padding:14px 18px; }
      .footer-title { font-size:16px; font-weight:650; color:#071327; margin-bottom:10px; }
      .footer-items { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)) auto; gap:14px; align-items:center; }
      .footer-item { display:grid; grid-template-columns:44px minmax(0,1fr); gap:12px; align-items:center; min-height:58px; border-right:1px solid #EDF2F8; padding-right:14px; }
      .footer-icon { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#F3F7FE; }
      .footer-icon ha-icon { --mdc-icon-size:22px; color:#1467F5; }
      .footer-item.tone-ok .footer-icon { background:#E9F8EF; }.footer-item.tone-ok .footer-icon ha-icon { color:#18A957; }
      .footer-item.tone-warn .footer-icon { background:#FFF3D8; }.footer-item.tone-warn .footer-icon ha-icon { color:#F59E0B; }
      .footer-item b { display:block; font-size:13px; font-weight:650; color:#071327; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .footer-item span { display:block; font-size:12px; font-weight:500; color:#34405A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
      .footer-item small { display:block; font-size:11px; color:#66728B; margin-top:2px; }
      .footer-more { height:42px; border-radius:12px; border:1px solid rgba(14,35,72,.11); background:#fff; color:#071327; font-weight:650; display:flex; align-items:center; gap:8px; padding:0 16px; cursor:pointer; }
      .footer-more ha-icon { --mdc-icon-size:18px; color:#071327; }
      @media (max-width:1200px) { .hero-left{width:100%;min-width:0}.hero{min-height:520px}.hero-image{position:relative;right:auto;top:auto;width:100%;height:240px;margin-top:12px}.hero-image img{height:240px}.hero-charger-image{right:30px;top:280px}.status-strip{margin-top:12px;max-width:100%}.footer-items{grid-template-columns:1fr 1fr}.footer-more{justify-content:center}.grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
      @media (max-width:760px) { .page{padding:14px}.hero{min-height:0;padding:22px 16px 18px} h1{font-size:40px}.subtitle{font-size:15px}.hero-image{height:190px}.hero-image img{height:190px}.hero-charger-image{top:225px;right:18px;width:72px;height:112px}.hero-charger-image img{max-width:70px;max-height:110px}.status-strip{grid-template-columns:1fr}.metric{border-right:0;border-bottom:1px solid #E6ECF5}.metric:last-child{border-bottom:0}.actions,.grid,.footer-items{grid-template-columns:1fr}.footer-item{border-right:0;border-bottom:1px solid #EDF2F8;padding-bottom:10px}.footer-item:last-of-type{border-bottom:0}.actions-title{grid-column:auto} }

      /* rc.23 mobile detail density + picker hardening */
      @media (max-width:560px) {
        .page{padding:8px;gap:8px}
        .hero{padding:16px 12px 12px;border-radius:16px}
        h1{font-size:30px}
        .hero-image{height:145px;margin-top:6px}
        .hero-image img{height:145px}
        .hero-charger-image{top:170px;right:12px;width:60px;height:86px}
        .hero-charger-image img{max-width:58px;max-height:82px}
        .status-strip{margin-top:8px}
        .metric{padding:9px 10px}
        .actions{gap:6px}
        .action{min-height:44px}
        .section-card{border-radius:14px}
        .section-head{padding:10px 12px}
        .section-body{padding:0 12px 8px}

        .detail-vehicle-picker{margin:6px 0 8px;padding:10px;border-radius:12px}
        .detail-vehicle-picker .vehicle-picker-grid{grid-template-columns:1fr;gap:7px}
        .detail-vehicle-picker .vehicle-picker-key{grid-column:auto}
        .detail-vehicle-picker select,
        .detail-vehicle-picker .vehicle-picker-key code,
        .detail-vehicle-picker .vehicle-picker-save{
          width:100%;height:44px;min-height:44px;box-sizing:border-box
        }
        .detail-vehicle-picker .vehicle-picker-save{justify-content:center}
        .detail-vehicle-picker .vehicle-picker-head h3{font-size:14px}
        .detail-vehicle-picker .vehicle-picker-head p{font-size:10px;line-height:1.25}
        .detail-vehicle-picker .vehicle-picker-grid label>span,
        .detail-vehicle-picker .vehicle-picker-key>span{font-size:9px}
      }


      /* R22.12.11.24 calm detail statusbar polish — icons are semantic hints, color only for active/attention. */
      :host{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
      *{}
      h1{font-size:38px;line-height:1.08;font-weight:650;letter-spacing:-.025em;}
      .subtitle,.breadcrumb{font-size:12.5px;font-weight:400;color:var(--hb-muted,#66728B);}
      .back-inline{font-size:12.5px;font-weight:600;}
      .pill{font-size:11px;font-weight:500;}
      .metric span{font-size:10.5px;font-weight:500;color:var(--hb-muted,#66728B);}
      .metric b{font-size:13.5px;font-weight:650;}
      .metric-sub{font-size:10.5px;font-weight:500;color:var(--hb-muted,#66728B);}
      .metric.has-detail-link{grid-template-columns:26px minmax(0,1fr) 30px;}
      .actions-title{font-size:13px;font-weight:600;}
      .action{font-size:12.5px;font-weight:600;}
      .section-title h2{font-size:18px;font-weight:600;letter-spacing:-.01em;}
      .section-status,.label,.help{font-weight:500;}
      .label{font-size:12px;color:#26334F;}
      .help{font-size:10.5px;color:var(--hb-muted,#66728B);}
      .value,.range-control span,.detail-row b{font-size:12.5px;font-weight:600;}
      .row-subheader{font-size:10.5px;font-weight:650;letter-spacing:.06em;}
      select,.datetime{font-size:12px;font-weight:500;}
      .title-row .pill{display:none;}
      .status-strip{grid-template-columns:repeat(5,minmax(0,1fr));}
      .metric ha-icon{color:var(--secondary-text-color,#66728B);}
      .metric.tone-neutral ha-icon{color:var(--secondary-text-color,#66728B);}
      .metric.tone-active ha-icon{color:var(--primary-color,#1467F5);}
      .metric.tone-attention ha-icon,.metric.tone-orange ha-icon,.metric.tone-warn ha-icon{color:var(--warning-color,#F59E0B);}
      .metric.tone-error ha-icon,.metric.tone-bad ha-icon{color:var(--error-color,#C21E1E);}
      .metric.tone-green ha-icon,.metric.tone-blue ha-icon{color:var(--secondary-text-color,#66728B);}
      .metric.tone-active .metric-sub{color:var(--primary-color,#1467F5);}
      .metric.tone-attention b,.metric.tone-attention .metric-sub,.metric.tone-orange b,.metric.tone-orange .metric-sub,.metric.tone-warn b,.metric.tone-warn .metric-sub{color:var(--warning-color,#A15C00);}
      .metric-sub{display:flex;align-items:center;gap:4px;line-height:1.15;}
      .metric-sub .metric-sub-icon{--mdc-icon-size:13px;flex:0 0 auto;}
      .metric b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

      /* rc.39 canonical detail composition: same visual grammar as top-level Mobility. */
      .detail-scene-hero{position:relative;display:block;min-height:clamp(176px,16vw,218px);height:auto;padding:0;margin:0;border:0;border-radius:18px;overflow:hidden;background:linear-gradient(90deg,#fff 0%,#fff 30%,rgba(255,255,255,.94) 39%,rgba(255,255,255,.18) 60%,rgba(255,255,255,0) 76%);box-shadow:none}
      .detail-scene-hero:before{display:none}
      .detail-scene-hero:after{content:"";display:block;position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.97) 18%,rgba(255,255,255,.76) 35%,rgba(255,255,255,.14) 58%,rgba(255,255,255,0) 78%)}
      .detail-hero-scene{position:absolute;z-index:1;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 52%;opacity:.30;pointer-events:none}
      .detail-scene-hero .hero-left{position:relative;z-index:4;width:min(48%,650px);min-width:0;max-width:none;padding:32px 20px 28px 24px}
      .detail-scene-hero .title-row{display:block;margin:0}
      .detail-scene-hero h1{margin:8px 0 10px;font-size:clamp(31px,3.1vw,48px);line-height:.98;letter-spacing:-.048em;color:#08133A;font-weight:720;max-width:620px}
      .detail-purpose{max-width:510px;margin:0;font-size:clamp(12px,1.15vw,16px);line-height:1.42;color:#536A91;font-weight:500}
      .detail-scene-hero .hero-image{position:absolute;z-index:3;right:3.5%;top:5%;width:49%;height:90%;min-height:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
      .detail-scene-hero .hero-image img{width:100%;height:100%;max-height:none;object-fit:contain;object-position:center;filter:drop-shadow(0 24px 30px rgba(15,35,80,.15))}
      .detail-scene-hero .hero-icon{width:58%;height:75%;border-radius:30px}
      /* Responsive detail depth: readable width and progressive disclosure. */
       .grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,370px),1fr));gap:10px;align-items:start}
       .section-card{min-width:0;box-shadow:0 4px 16px rgba(21,61,115,.035)}
       .row,.edit-row{grid-template-columns:22px minmax(0,1fr) minmax(105px,auto);gap:8px;padding:8px 0}
       .detail-more{margin-top:9px}.detail-more summary{font-size:12px;min-height:34px}
       @media(max-width:760px){.grid{grid-template-columns:1fr}.row,.edit-row{grid-template-columns:20px minmax(0,1fr) minmax(92px,auto)}}
       .detail-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0;padding:0;border:0;background:transparent;box-shadow:none}.detail-status-grid.status-count-1{grid-template-columns:1fr}.detail-status-grid.status-count-2{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-status-grid.status-count-3{grid-template-columns:repeat(3,minmax(0,1fr))}
      .detail-status-grid .metric{min-width:0;min-height:94px;height:auto;display:grid;grid-template-columns:52px minmax(0,1fr);gap:11px;align-items:center;padding:12px 14px;border:1px solid #DBE6F3;border-radius:15px;background:rgba(255,255,255,.97);box-shadow:0 8px 22px rgba(21,61,115,.045)}
      .detail-status-grid .metric ha-icon{width:46px;height:46px;display:flex;align-items:center;justify-content:center;padding:9px;box-sizing:border-box;border-radius:14px;background:#EEF5FF;color:#1467F5;--mdc-icon-size:27px}
      .detail-status-grid .metric span{display:block;margin:0 0 3px;color:#31558E;font-size:10px;font-weight:650}
      .detail-status-grid .metric b{display:block;margin:0 0 3px;color:#0B173D;font-size:clamp(14px,1.2vw,18px);font-weight:720;line-height:1.08}
      .detail-status-grid .metric-sub{display:block;margin-top:2px;color:#55709B;font-size:10px;font-weight:500;line-height:1.2}
      .detail-status-grid .metric.tone-attention ha-icon,.detail-status-grid .metric.tone-orange ha-icon,.detail-status-grid .metric.tone-warn ha-icon{background:#FFF4E8;color:#FF7500}
      .detail-status-grid .metric.tone-green ha-icon,.detail-status-grid .metric.tone-ok ha-icon,.detail-status-grid .metric.tone-active ha-icon{background:#EEF5FF;color:#1467F5}
      .actions{min-height:52px;padding:6px 10px;margin:0;border:1px solid #DBE6F3;border-radius:14px;background:#fff;box-shadow:0 5px 16px rgba(21,61,115,.03);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .actions-title{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:#31558E;font-weight:700;margin-right:2px;flex:0 0 auto}
      .actions .action{width:auto;min-width:0;height:40px;min-height:40px;border:1px solid #D8E4F1;border-radius:10px;background:#fff;color:#075FD8;box-shadow:none;font-size:11px;font-weight:660;padding:0 13px;display:inline-flex;align-items:center;gap:7px}
      .actions .action.primary{background:#0B66F6;border-color:#0B66F6;color:#fff}
      .actions .action ha-icon{--mdc-icon-size:17px;color:currentColor}
      .no-actions{padding:10px 12px;border:0;background:transparent;box-shadow:none}
      .breadcrumb,.back-inline,.hero-topline,.subtitle,.hero-charger-image{display:none}
      @media(max-width:1024px){.detail-scene-hero{min-height:188px}.detail-scene-hero .hero-left{width:50%;padding:26px 16px 22px 18px}.detail-scene-hero .hero-image{right:2%;width:48%}.detail-status-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.detail-status-grid .metric{grid-template-columns:42px minmax(0,1fr);padding:10px;min-height:88px}.detail-status-grid .metric ha-icon{width:40px;height:40px;--mdc-icon-size:22px}}
      @media(max-width:760px){.detail-scene-hero{min-height:168px}.detail-scene-hero .hero-left{width:58%;padding:20px 10px 18px 14px}.detail-scene-hero h1{font-size:29px}.detail-purpose{font-size:12px}.detail-scene-hero .hero-image{right:0;width:44%}.detail-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.actions{overflow-x:auto;flex-wrap:nowrap}.actions-title,.actions .action{flex:0 0 auto}}
      @media(max-width:430px){.detail-scene-hero{min-height:154px}.detail-scene-hero .hero-left{width:64%;padding:17px 8px 15px 12px}.detail-scene-hero h1{font-size:25px}.detail-purpose{font-size:10px;line-height:1.3}.detail-scene-hero .hero-image{width:41%}.detail-status-grid{grid-template-columns:1fr 1fr}.detail-status-grid .metric{grid-template-columns:34px minmax(0,1fr);min-height:76px;padding:8px;gap:7px}.detail-status-grid .metric ha-icon{width:32px;height:32px;border-radius:10px;--mdc-icon-size:18px;padding:6px}}
      /* Canonical object navigation grammar: values are links, not 'add' actions. */
      .detail-context-nav{display:flex;align-items:center;min-width:0;margin:0 0 -2px;padding:2px 1px}
      .detail-context-nav button{display:inline-flex;align-items:center;gap:5px;min-height:36px;
        padding:4px 6px;border:0;border-radius:8px;background:transparent;color:#075fd8;
        font-size:12px;font-weight:650;cursor:pointer;text-align:left;max-width:100%}
      .detail-context-nav button:hover,.detail-context-nav button:focus-visible{background:#eef5ff}
      .detail-context-nav ha-icon{--mdc-icon-size:16px;flex:none}
      .detail-context-nav span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .detail-status-grid.status-count-5{grid-template-columns:repeat(5,minmax(0,1fr))}
      .detail-status-grid .metric.has-detail-link{grid-template-columns:52px minmax(0,1fr);align-items:center}
      .detail-status-grid .metric{overflow:hidden}
      .detail-status-grid .metric-copy{min-width:0}
      .metric-related-value,.row-related-value{border:0;background:transparent;box-shadow:none;color:#075fd8;
        font:inherit;font-weight:650;padding:0;margin:0;min-width:0;max-width:100%;
        display:inline-flex;align-items:center;justify-content:flex-start;gap:4px;cursor:pointer;
        text-align:left;vertical-align:middle}
      .metric-related-value{font-size:clamp(13px,1.15vw,18px);line-height:1.14}
      .metric-related-value b{display:block;min-width:0;font-size:inherit;line-height:inherit;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit}
      .metric-related-value ha-icon,.row-related-value ha-icon{--mdc-icon-size:16px;flex:none;color:inherit}
      .row-related-value{justify-content:flex-end;font-size:12px;min-height:32px}
      .row-related-value span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .metric-related-value:focus-visible,.row-related-value:focus-visible{
        outline:2px solid #1467f5;outline-offset:3px;border-radius:3px}
      .row-value-with-link{overflow:hidden}
      .detail-status-grid .metric-sub{white-space:normal;overflow-wrap:break-word}
      @media(max-width:1024px){
        .detail-status-grid.status-count-5{grid-template-columns:repeat(3,minmax(0,1fr))}
        .detail-status-grid .metric.has-detail-link{grid-template-columns:42px minmax(0,1fr)}
      }
      @media(max-width:760px){
        .detail-status-grid.status-count-5{grid-template-columns:repeat(2,minmax(0,1fr))}
        .metric-related-value{font-size:14px}
      }
      @media(max-width:430px){
        .detail-status-grid.status-count-5{grid-template-columns:repeat(2,minmax(0,1fr))}
        .detail-status-grid .metric.has-detail-link{grid-template-columns:34px minmax(0,1fr)}
        .metric-related-value{font-size:13px}
      }
    `;
  }
}
