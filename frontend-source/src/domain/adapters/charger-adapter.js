// 40-charger-adapter.js
// Charger view-model adapter mapping public contracts to charger card data.

class HomeBrainChargerAdapter {
  constructor(rt, chargerId, config) { this.rt = rt; this.id = chargerId; this.config = config; }
  assetId() { return String(this.id || "").startsWith("charger_") ? String(this.id) : `charger_${this.id}`; }
  registryEntry() { return this.config.registry_entry || this.rt.chargerById(this.assetId()) || this.rt.assetById(this.assetId()) || null; }
  commandExists(commandId) { return this.rt.commandExists(this.assetId(), commandId) !== false; }
  displayName() { const reg = this.registryEntry(); return reg?.display_name || this.config.fallback_name || this.rt.titleize(this.assetId()); }
  chargerVisual() {
    const reg = this.registryEntry() || {};
    const assetId = this.assetId();
    const prop = this.rt.semanticProperty(assetId, "charger.image_key");
    const raw = prop?.value ?? this.rt.visualImageKey(reg, "image") ?? reg?.image_key ?? "";
    const parsed = typeof rhiMobilityResolveChargerVisual === "function"
      ? rhiMobilityResolveChargerVisual(reg.asset_id ? reg : { ...reg, asset_id:assetId }, raw)
      : null;
    const profileId = String(this.rt.semanticProperty(assetId, "asset.profile_id")?.value ?? reg?.profile_id ?? reg?.raw?.profile_id ?? "").trim();
    const profileCharger = typeof rhiMobilityChargerVisualForProfile === "function" ? rhiMobilityChargerVisualForProfile(profileId) : null;
    if (!profileCharger) return parsed;
    if (parsed?.charger?.id === profileCharger.id) return parsed;
    const appearance = profileCharger.appearances?.[0] || null;
    return appearance ? { key:profileCharger.id + "." + appearance.id, charger:profileCharger, appearance } : null;
  }
  chargerImageFromId() {
    const reg = this.registryEntry() || { asset_id:this.assetId() };
    const visual = this.chargerVisual();
    const packageFile = String(visual?.appearance?.package_file || "");
    return packageFile || this.rt.visualImageUrl(reg, "charger", "image", "charger_fallback");
  }
  profile() {
    const reg=this.registryEntry() || {}, id=this.assetId();
    const property=this.rt.semanticProperty(id,"asset.profile_id");
    const profileId=String(property?.value ?? reg.profile_id ?? "").trim();
    const published=profileId ? this.rt.profileRows().find(p=>String(p.profile_id || p.id || "")===profileId) : null;
    return String(published?.display_name || published?.label || reg.profile_display_name || reg.profile ||
      (profileId ? this.rt.titleize(profileId.replace(/_/g," ")) : this.config.fallback_profile || "Profile not assigned"));
  }
  status() { return this.rt.chargerOperationalStatus(this.assetId()); }
  can(capability) { return this.commandExists(capability); }
  overviewAvailability() {
    const assetId = this.assetId();
    const lifecycle = this.rt.lifecycleStatus(this.registryEntry() || assetId);
    if (lifecycle === "disabled") return { bucket:"disabled", resolved:true, label:(this.rt?.t?.("charger.state_disabled",{},"Disabled") || "Disabled") };
    if (lifecycle !== "active") return { bucket:"unknown", resolved:false, label:"N/A" };

    const snapshot = this.rt.chargerProductSnapshot(assetId);
    const operatingResolved = !!snapshot?.operating?.resolved;
    const operating = operatingResolved ? String(snapshot.operating.value || "").trim().toLowerCase() : "";
    if (operating === "fault") return { bucket:"unavailable", resolved:true, label:(this.rt?.t?.("charger.state_unavailable",{},"Unavailable") || "Unavailable") };

    // "Free" is an occupancy statement, not a charging-power statement.
    // An idle/stopped charger may still have a vehicle physically connected.
    const connectionResolved = !!snapshot?.connection?.resolved;
    const connection = connectionResolved ? String(snapshot.connection.value || "").trim().toLowerCase() : "";
    const physicallyConnected = !!snapshot?.connected_vehicle?.resolved
      || ["connected", "asset_connected"].includes(connection);
    const physicallyDisconnected = ["disconnected", "no_asset_connected"].includes(connection);

    // Physical disconnection wins over an inconsistent running flag. A
    // conflict cannot be presented as an occupied charging point.
    if (physicallyDisconnected && ["running", "preparing", "suspended"].includes(operating)) {
      return { bucket:"unknown", resolved:false, label:"Connection / state conflict" };
    }
    if (physicallyConnected && physicallyDisconnected) {
      return { bucket:"unknown", resolved:false, label:"Physical relationship conflict" };
    }
    if (physicallyConnected) return { bucket:"in_use", resolved:true, label:(this.rt?.t?.("charger.state_in_use",{},"In use") || "In use") };
    if (!physicallyDisconnected && ["running", "preparing", "suspended"].includes(operating)) {
      return { bucket:"unknown", resolved:false, label:"Connection unverified" };
    }
    if (physicallyDisconnected && ["idle", "stopped"].includes(operating)) {
      return { bucket:"free", resolved:true, label:(this.rt?.t?.("charger.state_free",{},"Free") || "Free") };
    }

    // Fail closed: without connection/relationship evidence we cannot call a
    // charger free merely because its power/operating state is idle/stopped.
    return { bucket:"unknown", resolved:false, label:"N/A" };
  }

  chargingPowerEvidence() {
    const snapshot = this.rt.chargerProductSnapshot(this.assetId());
    const operating = snapshot?.operating?.resolved === true
      ? String(snapshot.operating.value || "").trim().toLowerCase() : "";
    const power = snapshot?.power;
    if (power?.resolved !== true || power.value === null || power.value === undefined || power.value === "") {
      return { state:"unknown", label:"Actual power unavailable", reason:"No canonical charger.power_kw measurement" };
    }
    const measuredKw = Number(power.value);
    if (!Number.isFinite(measuredKw) || measuredKw < 0) {
      return { state:"unknown", label:"Actual power unavailable", reason:"Invalid canonical charger.power_kw measurement" };
    }
    if (operating === "charging" || operating === "running") {
      if (measuredKw === 0) return {
        state:"no_measured_power", label:"Charging state · 0 kW measured",
        reason:"Charger reports charging, but actual power is zero. Current limit and session energy do not prove live power."
      };
      return { state:"measured", label:"Charging power measured", reason:"Canonical charger.power_kw" };
    }
    return { state:"measured", label:"Actual power measured", reason:"Canonical charger.power_kw" };
  }

  latestActivityRows(assetId) {
    const activities = this.rt.activityRowsFor(assetId).slice(0, 3);
    const valueFor = (a) => String(a.result || a.result_code || a.activity_state || a.status || a.message || a.activity_type || a.command_key || a.command_id || "Unavailable");
    const labels = ["Latest activity", "Previous activity", "Earlier activity"];
    if (!activities.length) return [{ type:"readonly", icon:"mdi:history", label:"Latest activity", value:"Unavailable" }];
    return activities.map((a, index)=>({ type:"readonly", icon:index === 0 ? "mdi:history" : "mdi:history-clock", label:labels[index] || `Activity ${index+1}`, value:valueFor(a) }));
  }
  productProjection() {
    const assetId = this.assetId();
    const reg = this.registryEntry() || { asset_id: assetId };
    const snapshot = this.rt.chargerProductSnapshot(assetId);
    const commands = this.rt.commandActionsFor(assetId, "quick_actions");
    const profileProperty = this.rt.semanticProperty(assetId, "asset.profile_id");
    const imageProperty = this.rt.semanticProperty(assetId, "charger.image_key");
    const profileId = String(profileProperty?.value ?? "").trim();
    const imageKey = String(imageProperty?.value ?? "").trim();
    const field = (row, source = "RHI_MOBILITY_CANONICAL_PROPERTY_V1") => ({
      resolved: !!row?.resolved,
      value: row?.value ?? null,
      display: String(row?.display ?? (row?.resolved ? row?.value ?? "—" : "—")),
      unit: String(row?.unit || ""),
      state: String(row?.state || (row?.resolved ? "ok" : "unknown")),
      reason: String(row?.reason || ""),
      source
    });
    const canonical = (key) => {
      const row = this.rt.canonicalChargerPropertyValue(assetId, key);
      return field({
        ...row,
        display: this.rt.canonicalChargerPropertyDisplay(assetId, key, "—")
      });
    };
    const vehicleAssetId = snapshot.connected_vehicle?.resolved === true
      ? String(snapshot.connected_vehicle.asset_id || snapshot.connected_vehicle.value || "")
      : "";
    const vehicleEntry = vehicleAssetId ? (this.rt.vehicleById(vehicleAssetId) || this.rt.assetById(vehicleAssetId)) : null;
    const relation=this.rt.relationshipFor(assetId);
    // Configured, effective and physically proven identities are separate
    // backend publications. The source of a UI label must remain explicit.
    const identified=(id)=>String(id || "")!=="none" && !!String(id || "").trim() ? String(id) : "";
    const assignedId=identified(relation.assigned_vehicle);
    const effectiveId=identified(relation.effective_vehicle);
    const displayFor=(id)=>{
      if(!id)return "";
      const asset=this.rt.vehicleById(id) || this.rt.assetById(id);
      return String(asset?.display_name || this.rt.assetDisplayName(id) || id);
    };
    return {
      identity: {
        asset_id: assetId,
        display_name: this.displayName(),
        profile: this.profile(),
        profile_id: profileId,
        image_key: imageKey,
        source: "RHI_MOBILITY_CANONICAL_PROPERTY_V1"
      },
      lifecycle: {
        state: this.rt.lifecycleStatus(reg),
        source: "RHI_MOBILITY_CANONICAL_PROPERTY_V1"
      },
      facts: {
        operating: field(snapshot.operating),
        connection: field(snapshot.connection),
        connected_vehicle: field(snapshot.connected_vehicle),
        power: field(snapshot.power),
        requested_power: canonical("charger.requested_charge_power_kw"),
        actual_current: canonical("charger.actual_current_a"),
        current_limit: canonical("charger.current_limit_a"),
        offered_current: canonical("charger.offered_current_a"),
        session_energy: canonical("charger.session_energy_kwh"),
        lifetime_energy: canonical("charger.lifetime_energy_kwh"),
        health: field(snapshot.health)
      },
      relationships: {
        assigned_vehicle_id:assignedId,
        assigned_vehicle_display_name:displayFor(assignedId),
        effective_vehicle_id:effectiveId,
        effective_vehicle_display_name:displayFor(effectiveId),
        connected_vehicle_id: vehicleAssetId,
        connected_vehicle_display_name: String(snapshot.connected_vehicle?.display || vehicleEntry?.display_name || ""),
        vehicle_detail_route: vehicleAssetId ? this.rt.assetDetailRoute(vehicleEntry || vehicleAssetId) :
          assignedId ? this.rt.assetDetailRoute(this.rt.vehicleById(assignedId) || assignedId) : "",
        relationship_resolution:String(relation.relationship_resolution || "UNAVAILABLE"),
        source: "MOBILITY_EXPERIENCE_V2"
      },
      availability: this.overviewAvailability(),
      commands,
      source_contracts: ["RHI_MOBILITY_CANONICAL_PROPERTY_V1", "MOBILITY_COMMAND_V2"]
    };
  }

  build() {
    const id = this.id;
    const assetId = this.assetId();
    const reg = this.registryEntry() || { asset_id: assetId };
    const lifecycleState = this.rt.lifecycleStatus(reg);
    const lifecycle = lifecycleState === "active" ? "Active" : lifecycleState === "disabled" ? "Disabled" : lifecycleState === "retired" ? "Retired" : "Contract gap";
    const available = lifecycleState === "active";
    const name = this.displayName();
    const profile = this.profile();
    const visual = this.chargerVisual();
    const projection = this.productProjection();
    const status = projection.facts.operating.display;
    const connectionState = projection.facts.connection.display;
    const assignedVehicle = projection.facts.connected_vehicle.display;
    const power = projection.facts.power.display;
    const sessionEnergy = projection.facts.session_energy.display;
    const currentLimit = projection.facts.current_limit.display;
    const connector = connectionState;
    const limitSource = "RHI_MOBILITY_CANONICAL_PROPERTY_V1";
    const phases = "—";
    const voltage = "—";
    const current = projection.facts.actual_current.display;
    const dataFreshness = "—";
    const trust = projection.facts.health.display;
    const health = projection.facts.health.display;
    // DETAIL is a canonical-property view, never an Intelligence summary.
    // Preserve raw source evidence in the lower detail sections and surface
    // any inconsistency without claiming the vehicle is charging.
    const op = projection.facts.operating;
    const conn = projection.facts.connection;
    const measured = projection.facts.power;
    const requested = projection.facts.requested_power;
    const operatingRaw = op.resolved ? String(op.value || "").toLowerCase() : "";
    const connectionRaw = conn.resolved ? String(conn.value || "").toLowerCase() : "";
    const disconnected = ["no_asset_connected", "disconnected"].includes(connectionRaw);
    const connected = ["asset_connected", "connected"].includes(connectionRaw);
    const running = ["charging", "running"].includes(operatingRaw);
    const activeFlag = ["charging","running","preparing","suspended"].includes(operatingRaw);
    const powerNumber = measured.resolved && measured.value !== null && measured.value !== "" ? Number(measured.value) : NaN;
    const validPower = Number.isFinite(powerNumber) && powerNumber >= 0;
    const positivePower = validPower && powerNumber > 0.05;
    const inconsistent = disconnected && (activeFlag || positivePower);
    const unverified = !disconnected && !connected && (activeFlag || positivePower);
    const requestedText = requested.resolved ? `Requested ${requested.display} · setpoint` : "No requested power published";
    const stateTile = {
      label:(this.rt?.t?.("charger.fact_state",{},"State") || "State"),
      value:inconsistent ? "State conflict" : disconnected ? "Not connected" :
        unverified ? "Connection unverified" : (op.resolved ? op.display : "Unknown"),
      subvalue:inconsistent ? `Connector disconnected · EVSE ${op.display}` :
        (conn.resolved ? `Connection: ${conn.display}` : "Physical connection not available"),
      icon:"mdi:ev-station",
      tone:inconsistent || unverified || operatingRaw === "fault" ? "attention" : "neutral"
    };
    const powerTile = {
      label:(this.rt?.t?.("charger.fact_power",{},"Power") || "Power"),
      value:inconsistent || (disconnected && positivePower) ? "Power conflict" :
        unverified ? "Power unverified" : (validPower ? measured.display : "Unavailable"),
      subvalue:inconsistent || (disconnected && positivePower)
        ? `Reported ${measured.display} while disconnected · ${requestedText}`
        : !connected && !disconnected ? `Connection unknown · ${requestedText}`
        : validPower && powerNumber === 0 && running
          ? `0 kW reported although EVSE says running · ${requestedText}`
          : requestedText,
      icon:"mdi:flash",
      tone:inconsistent || unverified ? "attention" : "neutral"
    };

    const vehicleAssetId = String(projection.relationships?.connected_vehicle_id || projection.relationships?.assigned_vehicle_id || "");
    const physicallyConnected = !!projection.relationships?.connected_vehicle_id;
    const vehicleDisplay = String((physicallyConnected ? projection.relationships?.connected_vehicle_display_name : projection.relationships?.assigned_vehicle_display_name) || "No vehicle identified");
    const vehicleRoute = String(projection.relationships?.vehicle_detail_route || "");
    const vehicleTile = {
      label:(this.rt?.t?.("charger.fact_vehicle",{},"Vehicle") || "Vehicle"),
      value:vehicleDisplay,
      subvalue:String(physicallyConnected ? "Physical identity proven" : vehicleAssetId ? "Configured assignment · physical identity not confirmed" : "Vehicle relationship unavailable"),
      icon:"mdi:car-electric",
      tone:"neutral",
      detailRoute:vehicleRoute,
      detailTitle:vehicleDisplay ? `Open ${vehicleDisplay} details` : "Open vehicle details"
    };

    const headerStatus = [stateTile, powerTile, vehicleTile];
    if (operatingRaw === "fault") {
      headerStatus.push({
        label:(this.rt?.t?.("charger.fact_issue",{},"Issue") || "Issue"),
        value:"Charger fault", subvalue:"Canonical charger.operating_state = fault",
        icon:"mdi:alert-circle-outline",tone:"attention"
      });
    }
    const iconMap = { driveway_left:"mdi:ev-station", driveway_right:"mdi:ev-station", sideway:"mdi:ev-plug-type2", utility_plug:"mdi:power-socket-eu" };
    const ctlByField = (field, label, icon, opts = {}) => { const entity = this.rt.controlEntity(assetId, field, ""); return entity ? { type:"control", entity, label, icon, ...opts } : { type:"readonly", icon, label, value: opts.fallback || "Not available" }; };
    return {
      type:"charger", id, present:available, display:name, subtitle:profile, readiness:status, iconHero:iconMap[id] || "mdi:ev-station",
      image:this.rt.cache(this.chargerImageFromId()), fallbackImage:this.rt.cache(this.rt.assetUrl("chargers/charger_fallback.png")), imageOpacity:available ? 1 : 0.34, imageGray:available ? 0 : 0.25,
      visualKey:visual?.key || "", visualProduct:visual?.charger || null, visualAppearance:visual?.appearance || null,
      backPath:this.config.dashboard_path || hbMobilityPath("/dashboard"), backLabel:this.config.back_label || "← Back to Dashboard", detailRoute:this.rt.detailRoute(reg), lifecycle, registryEntry:reg, breadcrumb:["Home","Chargers",name],
      status:headerStatus,
      projection,
      actions:projection.commands.map((cmd,index)=>({ label:cmd.label || this.rt.titleize(cmd.command_id || cmd.command_key), icon:this.rt.commandIcon(cmd), entity:cmd.intent_entity, command:cmd, primary:index === 0, hide:cmd.frontend_allowed === false })),
      // R22.12.11.24: charger detail sections come from the charger component contract.
      // UX must not infer charger layout from flat property family/group names.
      sections:[this.rt.lifecycleContractGapSection(assetId)].filter(Boolean).concat(
        this.rt.addRelatedAssetDetailLinks(this.rt.chargerComponentDetailSections(assetId), { vehicleDetailRoute: vehicleRoute, vehicleDisplay })
      ).concat([
        { key:"activity", title:"Recent Activity", icon:"mdi:history", header:"Activity contract", rows:this.latestActivityRows(assetId), details:[] }
      ])
    };
  }
}
