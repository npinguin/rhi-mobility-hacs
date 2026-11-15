// 10-ha-contract-runtime.js
// Home Assistant state reader, contract loaders, property/relationship/command resolvers, and release contract access.

class HomeBrainAssetRuntime {
  assetUrl(path) { return rhiMobilityAssetUrl(path); }
  constructor(hass, config = {}) {
    this.hass = hass;
    this.config = config;
    this._canonicalProperties = mobilityCanonicalPropertyIndex(hass);
    if (typeof rhiMobilitySetLocaleFromHass === "function") rhiMobilitySetLocaleFromHass(hass);
    this._cache = HomeBrainAssetRuntime._cache || (HomeBrainAssetRuntime._cache = new Map());
    this._memo = new Map();
  }

  t(key, params = {}, fallback = "") {
    return typeof rhiMobilityT === "function" ? rhiMobilityT(this.hass, key, params, fallback) : (fallback || key);
  }

  productUnavailable(detail = "") {
    return {
      value:this.t("common.not_available",{},"Not available"),
      detail:detail || this.t("common.information_missing",{},"Information is not available yet.")
    };
  }


  hardBackendGateSpecs() {
    return [
      { entity_id: "sensor.mobility_runtime_deployment_health", label: "Runtime deployment", blocking: true },
      { entity_id: "sensor.mobility_runtime_proof_health", label: "Runtime proof", blocking: true },
      { entity_id: "sensor.mobility_audit_closure_health", label: "Audit closure", blocking: true },
      { entity_id: "sensor.mobility_contract_version_consistency_health", label: "Contract version consistency", blocking: true },
      { entity_id: "sensor.mobility_home_intelligence_contract_standard_health", label: "Home Intelligence standard", blocking: true }
    ];
  }

  diagnosticHealthSpecs() {
    return [
      { entity_id: "sensor.mobility_range_normalization_health", label: "Range normalization", blocking: false },
      { entity_id: "sensor.mobility_wallbox_ocpp_phase_projection_health", label: "Wallbox OCPP phase projection", blocking: false },
      { entity_id: "sensor.mobility_source_authority_health", label: "Source authority", blocking: false },
      { entity_id: "sensor.mobility_source_evidence_health", label: "Source evidence", blocking: false },
      { entity_id: "sensor.mobility_index_integrity_health", label: "Index integrity", blocking: false },
      { entity_id: "sensor.mobility_index_schema_health", label: "Index schema", blocking: false },
      { entity_id: "sensor.mobility_energy_publication_health", label: "Energy publication", blocking: false },
      { entity_id: "sensor.mobility_relationship_integrity_health", label: "Relationship integrity", blocking: false },
      { entity_id: "sensor.mobility_runtime_binding_health", label: "Runtime binding", blocking: false },
      { entity_id: "sensor.mobility_command_integrity_health", label: "Command integrity", blocking: false },
      { entity_id: "sensor.mobility_command_publication_health", label: "Command publication", blocking: false },
      { entity_id: "sensor.mobility_contract_traceability_health", label: "Contract traceability", blocking: false },
      { entity_id: "sensor.mobility_property_editable_metadata_health", label: "Editable metadata", blocking: false },
      { entity_id: "sensor.mobility_property_projection_audit", label: "Property projection", blocking: false },
      { entity_id: "sensor.mobility_command_projection_audit", label: "Command projection", blocking: false }
    ];
  }


  contractAuthorityRegistry() {
    return {
      canonical_property_v2: { contract_id: "RHI_MOBILITY_CANONICAL_PROPERTY_V1", role: "primary_property_authority" },
      product_experience_v2: { contract_id: "MOBILITY_EXPERIENCE_V2", role: "authority" },
      product_policy_v2: { contract_id: "MOBILITY_POLICY_V2", role: "authority" },
      command_v2: { contract_id: "MOBILITY_COMMAND_V2", role: "authority" },
      activity_v2: { contract_id: "MOBILITY_ACTIVITY_V2", role: "authority" },
      profile_catalog_v2: { contract_id: "MOBILITY_PROFILE_CATALOG_V2", role: "authority" },
      supervision_v2: { contract_id: "MOBILITY_SUPERVISION_V2", role: "authority" },
      energy_v2: { contract_id: "MOBILITY_ENERGY_V2", role: "external_consumer_only" }
    };
  }






  allowedContractEntityIds() {
    return new Set([
      "sensor.rhi_mobility_experience_v2",
      "sensor.rhi_mobility_policy_v2",
      "sensor.rhi_mobility_command_v2",
      "sensor.rhi_mobility_activity_v2",
      "sensor.rhi_mobility_profile_catalog_v2",
      "sensor.rhi_mobility_supervision_v2",
      "sensor.rhi_mobility_energy_v2",
      ...this.hardBackendGateSpecs().map((g) => g.entity_id),
      ...this.diagnosticHealthSpecs().map((g) => g.entity_id)
    ]);
  }

  isAllowedContractEntity(entityId = "") {
    const id = String(entityId || "").trim();
    return !!id && this.allowedContractEntityIds().has(id);
  }

  assertAllowedContractEntity(entityId = "") {
    const id = String(entityId || "").trim();
    if (this.isAllowedContractEntity(id)) return true;
    return false;
  }

  attr(entityId, attr, fallback = undefined) {
    const entity = this.entity(entityId);
    return entity?.attributes?.[attr] ?? fallback;
  }

  contractEntity(contractId = "", preferredEntityIds = []) {
    const wanted = String(contractId || "").trim();
    if (!wanted) return undefined;
    for (const entityId of preferredEntityIds) {
      const state = this.hass?.states?.[entityId];
      if (String(state?.attributes?.contract_id || "") === wanted) return state;
    }
    return undefined;
  }

  propertyPublicationEvidence(assetId = "") {
    // The canonical property index proves which properties were published.
    // It does not publish an expected-property catalog; never fabricate one.
    return null;
  }

  propertyPublicationGap(assetId = "") {
    const canonical=this.canonicalAssetId(assetId);
    const rows=this._canonicalProperties.rows(canonical);
    const gaps=(this._canonicalProperties.contractGaps?.() || [])
      .filter(gap=>String(gap.key||'').startsWith(`${canonical}::`));
    if (!canonical || (!rows.length && !gaps.length)) return {status:"unavailable",missing:[],unexpected:[]};
    const keys=rows.map(row=>String(row.property_key||'')).filter(Boolean);
    const unique=new Set(keys);
    // rows() deliberately excludes duplicate publishers. Query the gap
    // authority, not the filtered rows, or diagnostics would hide conflicts.
    const duplicates=gaps.map(gap=>String(gap.key).slice(canonical.length+2));
    return {
      status:duplicates.length ? "ambiguous" : "published",
      missing:[], unexpected:[],
      actual_count:unique.size,
      ambiguous_property_keys:duplicates.sort(),
      authority:"RHI_MOBILITY_CANONICAL_PROPERTY_V1"
    };
  }

  mobilityExperienceV2() {
    const state = this.contractEntity("MOBILITY_EXPERIENCE_V2", [
      "sensor.rhi_mobility_experience_v2"
    ]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_EXPERIENCE_V2") return null;
    return {
      ...attrs,
      fleet: attrs.fleet && typeof attrs.fleet === "object" ? attrs.fleet : {},
      vehicles: Array.isArray(attrs.vehicles) ? attrs.vehicles : [],
      chargers: Array.isArray(attrs.chargers) ? attrs.chargers : []
    };
  }

  mobilityPolicyV2() {
    const state = this.contractEntity("MOBILITY_POLICY_V2", [
      "sensor.rhi_mobility_policy_v2"
    ]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_POLICY_V2") return null;
    return {
      contract_id: attrs.contract_id,
      publisher: attrs.publisher || "",
      revision: Number(attrs.revision ?? state?.state ?? 0) || 0,
      policy: attrs.policy && typeof attrs.policy === "object" ? attrs.policy : {}
    };
  }

  mobilityCommandV2() {
    const state = this.contractEntity("MOBILITY_COMMAND_V2", [
      "sensor.rhi_mobility_command_v2"
    ]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_COMMAND_V2") return null;
    return {
      contract_id: attrs.contract_id,
      publisher: attrs.publisher || "",
      commands: Array.isArray(attrs.commands) ? attrs.commands : [],
      raw_service_bindings_exposed: attrs.raw_service_bindings_exposed === true
    };
  }

  mobilityActivityV2() {
    const state = this.contractEntity("MOBILITY_ACTIVITY_V2", [
      "sensor.rhi_mobility_activity_v2"
    ]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_ACTIVITY_V2") return null;
    return {
      ...attrs,
      activities: Array.isArray(attrs.activities) ? attrs.activities : []
    };
  }

  mobilityProfileCatalogV2() {
    const state = this.contractEntity("MOBILITY_PROFILE_CATALOG_V2", [
      "sensor.rhi_mobility_profile_catalog_v2"
    ]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_PROFILE_CATALOG_V2") return null;
    return {
      ...attrs,
      profiles: Array.isArray(attrs.profiles) ? attrs.profiles : []
    };
  }

  mobilitySupervisionV2() {
    const state = this.contractEntity("MOBILITY_SUPERVISION_V2", [
      "sensor.rhi_mobility_supervision_v2"
    ]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_SUPERVISION_V2") return null;
    return attrs;
  }

  commandV2Rows(assetId = "") {
    const contract = this.mobilityCommandV2();
    if (!contract) return null;
    const canonical = this.canonicalAssetId(assetId);
    return contract.commands
      .filter((row) => row && (!canonical || this.canonicalAssetId(row.asset_id || "") === canonical))
      .filter((row) => !!String(row.command_key || "").trim())
      .filter((row) => !!String(row.placement || "").trim())
      // Presentation label is optional in the producer contract.
      .map((row) => this.normalizeCommandEntry({
        ...row,
        command_id:String(row.command_id || "").trim(),
        command_key:String(row.command_key || "").trim(),
        label:String(row.label || this.titleize(String(row.command_key).split(".").pop().replace(/_/g," "))).trim(),
        command_family:String(row.command_family || "").trim(),
        category:String(row.category || "").trim(),
        frontend_allowed:row.supported === true,
        exists:row.supported === true,
        enabled:row.supported === true,
        execution_allowed:row.execution_allowed === true,
        blocked_reason:row.blocked_reason || "",
        sort_order:row.sort_order ?? 999,
        // Preserve the published literal invoke and fail closed if absent.
        invoke:row.invoke || {},
        _authority:"MOBILITY_COMMAND_V2"
      }, row.asset_id || canonical))
      .filter(Boolean);
  }

  commandV2RowsForSurface(assetId = "", surface = "operational") {
    const rows = this.commandV2Rows(assetId);
    if (rows === null) return null;
    const canonical = this.canonicalAssetId(assetId);
    const wanted = this.norm(surface);
    const isQuick = ["quick_actions","operational","vehicle_actions","charger_actions"].includes(String(surface || ""));
    return rows.filter((row) => {
      const placement = String(row.raw?.placement || row.placement || "").trim();
      const normalizedPlacement = this.norm(placement);
      const placementTail = this.norm(placement.split(".").pop() || "");
      if (isQuick) {
        if (canonical.startsWith("vehicle_")) return placementTail !== "engineering";
        return canonical.startsWith("charger_");
      }
      return wanted === normalizedPlacement || wanted === placementTail || normalizedPlacement.endsWith(wanted);
    });
  }

  // Canonical product projections. Raw V2 readers above remain transport-only;
  // adapters/screens consume these projection owners so one semantic family has
  // one authority and missing truth fails closed.
  mobilityFleetProjection() {
    // Fleet membership is published by canonical asset properties, not by a
    // second, independently evolving runtime aggregate.
    const vehicles=this.assetIndexRows("vehicle");
    const chargers=this.assetIndexRows("charger");
    return {
      vehicles,
      chargers,
      vehicle_count:vehicles.length,
      charger_count:chargers.length,
      source:"RHI_MOBILITY_CANONICAL_PROPERTY_V1"
    };
  }

  rangePolicyProjection() {
    const policy=this.mobilityPolicyV2()?.policy;
    return policy && typeof policy === "object" ? { ...policy, source:"MOBILITY_POLICY_V2" } : {};
  }

  vehicleExperienceProjection(assetId = "") {
    const canonical=this.canonicalAssetId(assetId);
    const row=this.mobilityExperienceV2()?.vehicles?.find((item)=>String(item?.asset_id || "") === canonical) || null;
    return row ? { ...row, source:"MOBILITY_EXPERIENCE_V2" } : {};
  }

  chargerExperienceProjection(assetId = "") {
    const canonical=this.canonicalAssetId(assetId);
    const row=this.mobilityExperienceV2()?.chargers?.find((item)=>String(item?.asset_id || "") === canonical) || null;
    return row ? { ...row, source:"MOBILITY_EXPERIENCE_V2" } : {};
  }

  vehicleRelationshipProjection(assetId = "") {
    const canonical=this.canonicalAssetId(assetId);
    const matches=(this.mobilityExperienceV2()?.vehicles || []).filter(
      (item)=>String(item?.asset_id || "") === canonical
    );
    if (matches.length !== 1) return {};
    const relationship=matches[0]?.charging_relationship;
    if (!relationship || typeof relationship !== "object") return {};
    // The vehicle row is the identity authority. A nested mismatched ID
    // must not be allowed to reassign the observed connection to another car.
    const publishedId=String(relationship.vehicle_id || "");
    if (publishedId && publishedId !== canonical) return {};
    return { ...relationship, vehicle_id:canonical, source:"MOBILITY_EXPERIENCE_V2" };
  }

  // Compatibility names are runtime-internal aliases only. They must never be
  // consumed by UI/adapters as independent semantic paths.
  mobilityFleetV2() { return this.mobilityFleetProjection(); }
  vehicleExperienceV2(assetId = "") { return this.vehicleExperienceProjection(assetId); }
  chargerExperienceV2(assetId = "") { return this.chargerExperienceProjection(assetId); }
  vehicleRelationshipV2(assetId = "") { return this.vehicleRelationshipProjection(assetId); }

  parseListValue(value) {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") {
      if (Array.isArray(value.items)) return value.items;
      if (Array.isArray(value.assets)) return value.assets;
      if (Array.isArray(value.vehicles)) return value.vehicles;
      if (Array.isArray(value.chargers)) return value.chargers;
      return Object.values(value);
    }
    const raw = String(value).trim();
    if (!raw || ["unknown", "unavailable", "none", "null"].includes(raw.toLowerCase())) return [];
    const parsed = this.parseJsonValue(raw, null);
    if (parsed && parsed !== raw) return this.parseListValue(parsed);
    return raw.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  }



  runtimeHealthGateRows() {
    return this._healthRows(this.hardBackendGateSpecs(), { diagnosticsOnly: false });
  }

  runtimeDiagnosticRows() {
    return this._healthRows(this.diagnosticHealthSpecs(), { diagnosticsOnly: true });
  }

  _healthRows(rows = [], options = {}) {
    const diagnosticsOnly = Boolean(options.diagnosticsOnly);
    return rows.map((gate) => {
      const entity = this.entity(gate.entity_id);
      const state = String(entity?.state || "unavailable").trim();
      const normalized = state.toUpperCase();
      const ok = ["OK", "PASS", "PASSED", "READY"].includes(normalized);
      const absent = ["UNKNOWN", "UNAVAILABLE", "NONE", "", "RESTORED"].includes(normalized);
      // Hard gates are closed and explicit: unavailable or unknown is not trusted.
      // Diagnostics-only sensors are non-blocking context and may not create main backend runtime status.
      const bad = diagnosticsOnly ? (!ok && !absent) : !ok;
      const attrs = entity?.attributes || {};
      const rootCause = attrs.rule || attrs.release_gate || attrs.release_gate_rule || attrs.ux_rule || attrs.validation_rule || attrs.reason || "";
      return { ...gate, state, bad, ok, diagnostics_only: diagnosticsOnly, root_cause: rootCause, attributes: attrs };
    });
  }

  runtimeHealthSummary() {
    const hardRows = this.runtimeHealthGateRows();
    const diagnosticRows = this.runtimeDiagnosticRows();
    const diagnosticBad = diagnosticRows.filter((r) => r.bad);
    const release = this.releaseContract();
    const explicitRuntime = String(release.runtime_health || "").trim();
    const deploymentState = String(this.entity("sensor.mobility_runtime_deployment_health")?.state || "").trim();
    const rawRuntime = explicitRuntime && !["unknown","unavailable","none"].includes(explicitRuntime.toLowerCase()) ? explicitRuntime : deploymentState;
    const normalized = String(rawRuntime || "UNKNOWN").toUpperCase();
    let status = "UNKNOWN";
    if (["OK","PASS","PASSED","READY","HEALTHY"].includes(normalized)) status = "OK";
    else if (["DEGRADED","WARNING","WARN"].includes(normalized)) status = "DEGRADED";
    else if (["FAIL","FAILED","BLOCKED","ERROR","NOT_OK"].includes(normalized)) status = "BLOCKED";
    const runtimeBad = ["DEGRADED","BLOCKED"].includes(status);
    const diagnosticStatus = diagnosticBad.length ? "DEGRADED" : "OK";
    return {
      status,
      ok: status === "OK",
      bad_count: runtimeBad ? 1 : 0,
      blocking_count: status === "BLOCKED" ? 1 : 0,
      diagnostic_status: diagnosticStatus,
      diagnostic_bad_count: diagnosticBad.length,
      rows: hardRows,
      diagnostics: diagnosticRows,
      physical_acceptance: release.physical_acceptance || "Unknown",
      release_acceptance: release.release_acceptance || "Unknown",
      message: status === "OK" ? "Mobility runtime healthy." : status === "DEGRADED" ? "Mobility runtime degraded." : status === "BLOCKED" ? "Mobility runtime failed." : "Mobility runtime health unavailable."
    };
  }

  renderRuntimeHealthWarning() {
    const summary = this.runtimeHealthSummary();
    if (!["DEGRADED","BLOCKED"].includes(summary.status)) return "";
    const deployment = String(this.entity("sensor.mobility_runtime_deployment_health")?.state || summary.status);
    return `<div class="hi-contract-warning" title="Mobility runtime health warning"><div><strong>Runtime ${summary.status === "BLOCKED" ? "failed" : "degraded"}</strong> — ${this.escape(summary.message)}</div><div class="hi-contract-warning-list"><span>Runtime health: ${this.escape(deployment)}</span></div></div>`;
  }


  indexAttr(attr, fallback = []) {
    return Array.isArray(fallback) ? fallback : [];
  }

  typeIndexEntity(kind = "all") {
    return "";
  }

  assetIndexRows(kind = "all") {
    const cacheKey = `assetIndexRows:${kind}`;
    if (this._memo.has(cacheKey)) return this._memo.get(cacheKey);
    // The backend's canonical property entities, not the retired Runtime V2
    // aggregate, own current membership. One row per backend-published asset_id.
    // Missing property evidence is a contract gap, not a reconstructed vehicle.
    const assets = new Map();
    for (const property of this._canonicalProperties.rows()) {
      const id=String(property?.asset_id || '').trim();
      const type=String(property?.asset_type || '').trim().toLowerCase();
      if (!id || !['vehicle','charger','person'].includes(type)) continue;
      if (!assets.has(id)) assets.set(id,{asset_id:id,asset_type:type});
      // Identity and lifecycle are used only when explicitly published.
      const row=assets.get(id);
      if (property.asset_display_name) row.display_name=String(property.asset_display_name);
      if (property.lifecycle_status) row.lifecycle_status=String(property.lifecycle_status);
      if (property.property_key==='asset.display_name' && property.availability==='AVAILABLE')
        row.display_name=String(property.value ?? id);
      if (property.property_key==='asset.profile_id' && property.availability==='AVAILABLE')
        row.profile_id=String(property.value ?? '');
      if (['vehicle.image_key','charger.image_key'].includes(property.property_key) && property.availability==='AVAILABLE')
        row.image_key=String(property.value ?? '');
      if (property.property_key==='asset.lifecycle_status' && property.availability==='AVAILABLE')
        row.lifecycle_status=String(property.value ?? 'Unknown');
    }
    let rows=[...assets.values()].map((v,index)=>
      this.normalizeAssetEntry({sort_order:index,...v})
    ).filter(Boolean);
    if (kind === "vehicle") rows = rows.filter((a) => String(a.asset_type || "").toLowerCase() === "vehicle");
    if (kind === "charger") rows = rows.filter((a) => String(a.asset_type || "").toLowerCase() === "charger");
    if (kind === "person") rows = rows.filter((a) => String(a.asset_type || "").toLowerCase() === "person");
    this._memo.set(cacheKey, rows);
    return rows;
  }

  consumerAssetIds(kind = "all") {
    return this.assetIndexRows(kind).map((a) => a.asset_id).filter(Boolean);
  }

  indexedAssets(kind = "all") {
    // R22.10.3: runtime UX must consume only the backend-owned consumer indexes.
    // Do not fall back to legacy registries, legacy relationship entities,
    // global charger lists or reverse charger matching. Missing indexes should be
    // visible as a contract/deployment issue rather than silently derived in UX.
    return this.assetIndexRows(kind);
  }

  registryEntryFromList(assetId, list = null) {
    const id = this.canonicalAssetId(assetId);
    const items = list || this.assetIndexRows("all");
    return items.find((a) => String(a.asset_id || "") === id) || null;
  }

  assetDisplayName(assetId) {
    const entry = this.registryEntryFromList(assetId, [...this.assetIndexRows("all"), ...this.assetIndexRows("vehicle"), ...this.assetIndexRows("charger")]);
    return entry?.display_name || entry?.raw?.display_name || String(assetId || "Asset");
  }


  assetLiveProfile(assetId) {
    const entry = this.registryEntryFromList(assetId, [...this.assetIndexRows("all"), ...this.assetIndexRows("vehicle"), ...this.assetIndexRows("charger")]);
    return entry?.profile_display_name || entry?.profile || entry?.raw?.profile_display_name || "";
  }


  profileRows() {
    const key = "profileRows";
    if (this._memo.has(key)) return this._memo.get(key);
    const rows = this.mobilityProfileCatalogV2()?.profiles || [];
    this._memo.set(key, rows);
    return rows;
  }

  profileForAsset(asset = {}) {
    const profileId = String(asset?.profile_id || asset?.raw?.profile_id || "");
    if (!profileId) return null;
    return this.profileRows().find((p) => String(p.profile_id || p.id || "") === profileId) || null;
  }

  isGenericVehicleImageKey(imageKey = "") {
    return ["vehicle_guest", "vehicle_guest_generic", "vehicle_fallback", "vehicle_unknown_profile", "vehicle_unknown_profile_hero", "default_vehicle"].includes(String(imageKey || "").trim());
  }

  imageCatalog() {
    return rhiMobilityImageCatalog();
  }

  resolveImageCatalogEntry(imageKey = "") {
    const key = String(imageKey || "").trim();
    if (!key) return null;
    const direct = this.imageCatalog().find((row) => String(row.image_key || "") === key) || null;
    if (direct) return direct;
    const visual = typeof rhiMobilityParseVehicleVisualKey === "function" ? rhiMobilityParseVehicleVisualKey(key) : null;
    if (!visual) return null;
    const base = this.imageCatalog().find((row) => String(row.image_key || "") === String(visual.vehicle?.image_key || "")) || null;
    return base ? { ...base, visual_key:visual.key, vehicle_visual:visual } : null;
  }

  imageUrlFromCatalog(imageKey = "", fallbackKey = "") {
    const first = this.resolveImageCatalogEntry(imageKey);
    const fallback = this.resolveImageCatalogEntry(fallbackKey || first?.fallback_image_key || "");
    const file = first?.package_file || fallback?.package_file || "";
    return file ? this.cache(file) : "";
  }

  visualImageKey(asset = {}, role = "image") {
    const visualRef = String(asset?.visual_ref || asset?.raw?.visual_ref || "").trim();
    const refKey = typeof rhiMobilityLocalVisualKeyFromRef === "function"
      ? rhiMobilityLocalVisualKeyFromRef(visualRef)
      : "";
    if (refKey) return refKey;
    const profile = this.profileForAsset(asset) || {};
    const profileId = String(asset?.profile_id || asset?.raw?.profile_id || "").trim();
    const profileVisual = String(asset?.asset_type || "").toLowerCase() === "vehicle" && typeof rhiMobilityVehicleVisualForProfile === "function"
      ? rhiMobilityVehicleVisualForProfile(profileId)
      : null;
    // Persisted appearance may refine colour only inside the profile-owned visual family.
    // A stale image_key from another model must never override the current Mobility profile.
    const candidates = [asset.image_key, asset.raw?.image_key, profile.image_key];
    const explicit = String(candidates.find((v) => v !== undefined && v !== null && String(v).trim() && !this.isGenericVehicleImageKey(v)) || "").trim();
    if (profileVisual) {
      const parsed = typeof rhiMobilityParseVehicleVisualKey === "function" ? rhiMobilityParseVehicleVisualKey(explicit) : null;
      if (parsed?.vehicle?.id === profileVisual.id) return parsed.key;
      const firstColor = profileVisual.colors?.[0]?.id || "";
      if (firstColor && typeof rhiMobilityVehicleVisualKey === "function") return rhiMobilityVehicleVisualKey(profileVisual.id, firstColor);
    }
    if (explicit) return explicit;
    const fallback = [asset.fallback_image_key, asset.raw?.fallback_image_key, profile.fallback_image_key]
      .find((v) => v !== undefined && v !== null && String(v).trim());
    return String(fallback || "vehicle_fallback").trim();
  }

  visualImageUrl(asset = {}, kind = "vehicle", role = "image", fallback = "") {
    // visual_ref is the canonical cross-domain identity. Package paths remain UX-owned.
    const visualRef = String(asset?.visual_ref || asset?.raw?.visual_ref || "").trim();
    const resolvedRef = visualRef && typeof rhiMobilityResolveVisualRef === "function"
      ? rhiMobilityResolveVisualRef(visualRef)
      : null;
    if (resolvedRef?.package_file) return this.cache(resolvedRef.package_file);
    const key = this.visualImageKey(asset, role);
    const fallbackKey = asset.fallback_image_key || asset.raw?.fallback_image_key || fallback || `${kind}_fallback`;
    return this.imageUrlFromCatalog(key, fallbackKey);
  }

  mobilityRegistry() {
    // R22.8: one discovered asset catalog assembled only from mobility_asset_index.
    const rows = [...this.indexedAssets("all")];
    const seen = new Set();
    return rows.filter((a) => {
      const id = String(a?.asset_id || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  normalizeAssetEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const assetBlock = entry.asset || {};
    const lifecycleBlock = entry.lifecycle || {};
    const identityBlock = entry.identity || {};
    const trustBlock = entry.trust || {};
    const frontendBlock = entry.frontend || {};
    const relationshipBlock = entry.relationship || entry.relationships || {};
    const asset_id = entry.asset_id || assetBlock.id || entry.id || entry.key;
    if (!asset_id) return null;
    const rawRoles = entry.roles ?? assetBlock.roles;
    const roles = Array.isArray(rawRoles) ? rawRoles : (rawRoles ? String(rawRoles).split(",").map((r) => r.trim()) : []);
    const lifecycle = entry.lifecycle_status || lifecycleBlock.lifecycle_status || entry.lifecycle_state || lifecycleBlock.state || entry.lifecycle || "Unknown";
    return {
      schema_version: entry.schema_version || 1,
      asset_id,
      domain: entry.domain || assetBlock.domain || "mobility",
      asset_type: entry.asset_type || entry.concept_id || assetBlock.type || entry.type || "unknown",
      display_name: entry.display_name || identityBlock.display_name || entry.name || asset_id,
      profile: entry.profile || entry.profile_display_name || identityBlock.profile || "",
      profile_id: entry.profile_id || identityBlock.profile_id || "",
      profile_display_name: entry.profile_display_name || identityBlock.profile_display_name || entry.profile || identityBlock.profile || "",
      visual_ref: entry.visual_ref || identityBlock.visual_ref || "",
      image_key: entry.image_key || identityBlock.image_key || "",
      hero_image_key: entry.hero_image_key || identityBlock.hero_image_key || "",
      thumbnail_image_key: entry.thumbnail_image_key || identityBlock.thumbnail_image_key || "",
      fallback_image_key: entry.fallback_image_key || identityBlock.fallback_image_key || "",
      location: entry.location || identityBlock.location || "",
      enabled: entry.enabled ?? lifecycleBlock.enabled ?? true,
      lifecycle_status: this.normalizeLifecycle(lifecycle),
      lifecycle_state: this.normalizeLifecycle(lifecycle),
      roles,
      execution_owner: entry.execution_owner || assetBlock.execution_owner || "",
      frontend_allowed: entry.frontend_allowed ?? frontendBlock.visible ?? true,
      detail_enabled: entry.detail_enabled ?? frontendBlock.detail_enabled ?? true,
      group: entry.group || frontendBlock.group || "",
      sort_order: entry.sort_order ?? frontendBlock.sort_order ?? 999,
      trust_status: entry.trust_status || trustBlock.status || "",
      trust_reason: entry.trust_reason || trustBlock.reason || "",
      last_seen: entry.last_seen ?? lifecycleBlock.last_seen ?? "",
      relationship: relationshipBlock,
      assigned_charger: relationshipBlock.assigned_charger ?? "",
      connected_charger: relationshipBlock.connected_charger ?? "",
      effective_charger: relationshipBlock.effective_charger ?? "",
      selected_charger: relationshipBlock.selected_charger ?? "",
      assigned_charger_display_name: relationshipBlock.assigned_charger_display_name ?? "",
      connected_charger_display_name: relationshipBlock.connected_charger_display_name ?? "",
      effective_charger_display_name: relationshipBlock.effective_charger_display_name ?? "",
      raw: entry
    };
  }

  normalizeLifecycle(value) {
    const s = String(value || "Unknown").trim().toLowerCase();
    if (s === "active") return "Active";
    if (["inactive", "not_present", "not present", "none"].includes(s)) return "Inactive";
    if (s === "disabled") return "Disabled";
    if (s === "retired") return "Retired";
    return "Unknown";
  }

  registryEntry(assetId) {
    return this.registryEntryFromList(assetId, this.mobilityRegistry());
  }

  vehicleChargerRelationship(assetId) {
    const relation=this.vehicleRelationshipProjection(assetId);
    if (!relation.vehicle_id) return { assigned:"none", effective:"none", selected:"none", connected:"none", row:null, relationship_resolution:"not_published" };
    const selected=this.cleanValue(relation.configured_charger_id || "", "none") || "none";
    const effective=this.cleanValue(relation.effective_charger_id || "", "none") || "none";
    const connected=relation.observed_identity_proven === true
      ? (this.cleanValue(relation.physically_connected_charger_id || "", "none") || "none") : "none";
    return {
      assigned:selected, effective, selected, connected,
      assigned_display_name:this.assetDisplayName(selected),
      effective_display_name:this.assetDisplayName(effective),
      connected_display_name:this.assetDisplayName(connected),
      relationship_resolution:relation.relationship_status || "UNKNOWN",
      reason:relation.reason || "",
      observed_identity_proven:relation.observed_identity_proven === true,
      row:relation, physical_row:relation, effective_row:relation, selected_row:relation,
      _authority:"MOBILITY_EXPERIENCE_V2"
    };
  }

  releaseContract() {
    // Release health is reported by the backend deployment gate, not inferred
    // from the presence of a retired aggregate contract.
    const deployment=this.entity("sensor.mobility_runtime_deployment_health");
    const raw=String(deployment?.state || "").trim().toUpperCase();
    const healthy=["OK","PASS","PASSED","READY","HEALTHY"].includes(raw);
    const failed=["FAIL","FAILED","BLOCKED","ERROR","NOT_OK"].includes(raw);
    const attrs=deployment?.attributes || {};
    const backend=this.cleanValue(attrs.backend_release || attrs.backend_version || "", "Unknown") || "Unknown";
    return {
      backend_release:backend, backend_version:backend,
      release_name:attrs.release_name || "",
      contract_version:"Unknown",
      contract_health:healthy ? "OK" : failed ? "BLOCKED" : "UNKNOWN",
      physical_acceptance:attrs.physical_acceptance || "Unknown",
      release_acceptance:attrs.release_acceptance || "Unknown",
      runtime_health:raw || "UNKNOWN",
      authority:"sensor.mobility_runtime_deployment_health"
    };
  }

  backendVersion() {
    return this.releaseContract().backend_release;
  }

  contractVersion() {
    return this.releaseContract().contract_version;
  }

  contractHealth() {
    return this.releaseContract().contract_health;
  }

  contractEntityIdForRevision(contractId = "") {
    const ids = {
      MOBILITY_EXPERIENCE_V2:"sensor.rhi_mobility_experience_v2",
      MOBILITY_POLICY_V2:"sensor.rhi_mobility_policy_v2",
      MOBILITY_COMMAND_V2:"sensor.rhi_mobility_command_v2",
      MOBILITY_ACTIVITY_V2:"sensor.rhi_mobility_activity_v2",
      MOBILITY_PROFILE_CATALOG_V2:"sensor.rhi_mobility_profile_catalog_v2",
      MOBILITY_SUPERVISION_V2:"sensor.rhi_mobility_supervision_v2",
      MOBILITY_ENERGY_V2:"sensor.rhi_mobility_energy_v2"
    };
    return ids[String(contractId || "")] || "";
  }

  entityRevisionSignature(entityIds = []) {
    return [...new Set(entityIds.filter(Boolean))].sort().map((id)=>{
      const state=this.hass?.states?.[id];
      return `${id}:${state?.state ?? ""}:${state?.last_updated ?? ""}`;
    }).join("|");
  }

  productRevisionSignature(assetId = "", contractIds = []) {
    const canonical=assetId ? this.canonicalAssetId(assetId) : "";
    const canonicalRevision=this._canonicalProperties.revision(canonical);
    const contractEntityIds=contractIds.map((id)=>this.contractEntityIdForRevision(id)).filter(Boolean);
    return `canonical:${canonical || "*"}:${canonicalRevision}|${this.entityRevisionSignature(contractEntityIds)}`;
  }

  runtimeSignature(assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    const ids = new Set(this._canonicalProperties.entityIds(canonical));
    // Track explicit producer-owned authorities by entity revision only.
    // Do not serialize complete contract payloads on every HA tick.
    for (const id of [
      "sensor.rhi_mobility_experience_v2",
      "sensor.rhi_mobility_policy_v2",
      "sensor.rhi_mobility_activity_v2",
      "sensor.rhi_mobility_profile_catalog_v2",
      "sensor.rhi_mobility_supervision_v2",
      "sensor.rhi_mobility_command_v2",
      "sensor.rhi_mobility_energy_v2"
    ]) ids.add(id);
    return [...ids].sort().map((id)=>{
      const state=this.hass?.states?.[id];
      return `${id}:${state?.state ?? ""}:${state?.last_updated ?? ""}`;
    }).join("|");
  }

  publicCommandRows() {
    return this.commandV2Rows("") || [];
  }

  publicRelationshipRows() {
    return this.relationshipRows("");
  }

  publicActivityRows() {
    return this.activityRowsFor("");
  }

  publicIntelligenceRows() {
    return this.intelligenceRowsFor("");
  }

  energyAssetPublicationRows(assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    const state = this.contractEntity("MOBILITY_ENERGY_V2", ["sensor.rhi_mobility_energy_v2"]);
    const attrs = state?.attributes || {};
    if (String(attrs.contract_id || "") !== "MOBILITY_ENERGY_V2") return [];
    const rows = [
      ...(Array.isArray(attrs.consumer_assets) ? attrs.consumer_assets : []),
      ...(Array.isArray(attrs.connection_assets) ? attrs.connection_assets : [])
    ];
    return rows.filter((r)=>!canonical || String(r.asset_id || r.source_asset_id || "") === canonical);
  }

  contractCoverageReport() {
    const assets = this.assetIndexRows("all");
    const profiles = this.profileRows();
    const vehicleProfiles = profiles.filter((row)=>String(row.asset_type || "").toLowerCase() === "vehicle");
    const chargerProfiles = profiles.filter((row)=>String(row.asset_type || "").toLowerCase() === "charger");
    const allProperties = this.propertyRows("").filter((p)=>String(p.access || "").toLowerCase() !== "internal");
    const vehicleProperties = allProperties.filter((p)=>String(p.asset_type || "").toLowerCase() === "vehicle");
    const chargerProperties = allProperties.filter((p)=>String(p.asset_type || "").toLowerCase() === "charger");
    const personProperties = allProperties.filter((p)=>String(p.asset_type || "").toLowerCase() === "person");
    const relationships = this.publicRelationshipRows();
    const commands = this.publicCommandRows();
    const intelligence = this.publicIntelligenceRows();
    const activities = this.publicActivityRows();
    const energyPublications = this.energyAssetPublicationRows("");
    const visibleCommands = commands.filter((c)=>this.contractBool(c.frontend_allowed, true) === true && !this.isConfigurationCommand(c));
    return {
      release: { ux_version: UX_VERSION, backend_version: this.backendVersion(), contract_version: this.contractVersion(), contract_health: this.contractHealth(), runtime_health: this.runtimeHealthSummary().status },
      health_gates: { published: this.runtimeHealthGateRows().length, consumed: this.runtimeHealthGateRows().length, bad: this.runtimeHealthSummary().bad_count, blocking: this.runtimeHealthSummary().blocking_count },
      assets: { published: assets.length, consumed: assets.length, rendered_or_categorized: assets.length, missing: 0 },
      profiles: { vehicle_published: vehicleProfiles.length, vehicle_consumed: vehicleProfiles.length, charger_published: chargerProfiles.length, charger_consumed: chargerProfiles.length, missing: 0 },
      properties: {
        published: allProperties.length, consumed: allProperties.length, primary_rendered: 0, detail_rendered: 0, engineering_overflow: allProperties.length, missing: 0,
        vehicle_published: vehicleProperties.length, vehicle_consumed: vehicleProperties.length,
        charger_published: chargerProperties.length, charger_consumed: chargerProperties.length,
        person_published: personProperties.length, person_consumed: personProperties.length
      },
      relationships: { published: relationships.length, consumed: relationships.length, missing: 0 },
      commands: {
        authority: this.mobilityCommandV2() ? "MOBILITY_COMMAND_V2" : "UNAVAILABLE",
        published: commands.length, consumed: commands.length, missing: 0,
        hidden_frontend_false: commands.filter((c)=>this.contractBool(c.frontend_allowed, true) === false).length,
        visible_disabled: visibleCommands.filter((c)=>this.contractBool(c.execution_allowed, false) === false).length,
        visible_enabled: visibleCommands.filter((c)=>this.contractBool(c.execution_allowed, false) === true).length
      },
      intelligence: { published: intelligence.length, consumed: intelligence.length, missing: 0 },
      activity: { published: activities.length, consumed: activities.length, missing: 0 },
      energy_publication: { published: energyPublications.length, consumed: energyPublications.length, missing: 0 },
      vehicle_components: {
        component_contract_available: this.vehicleComponentContractAvailable(),
        published: this.vehicleComponentContractRows().length,
        consumed: this.vehicleComponentRows().length,
        property_index_entities_consumed: this.vehicleComponentPropertyIndexEntities().length,
        detail_source: this.vehicleComponentContractAvailable() ? "component_property_indexes" : "component_contract_unavailable",
        missing: 0
      },
      charger_components: {
        component_contract_available: this.chargerComponentContractAvailable(),
        published: this.chargerComponentContractRows().length,
        consumed: this.chargerComponentRows().length,
        property_index_entities_consumed: this.chargerComponentPropertyIndexEntities().length,
        detail_source: this.chargerComponentContractAvailable() ? "component_contract" : "component_contract_unavailable",
        missing: 0
      }
    };
  }

  canonicalAssetId(assetId) {
    const id = String(assetId || "");
    if (id.startsWith("vehicle_") || id.startsWith("charger_")) return id;
    const reg = this.mobilityRegistry().find((a) =>
      a.asset_id === id ||
      a.asset_id === `vehicle_${id}` ||
      a.asset_id === `charger_${id}` ||
      a.asset_id.replace(/^vehicle_/, "") === id ||
      a.asset_id.replace(/^charger_/, "") === id
    );
    return reg?.asset_id || id;
  }

  uiId(assetId) {
    return String(assetId || "").replace(/^vehicle_/, "").replace(/^charger_/, "");
  }


  assetHasRole(entry, role) {
    return (entry?.roles || []).map((r) => String(r).toLowerCase()).includes(String(role).toLowerCase());
  }

  /**
   * Product classification helper used by the factory, asset viewer and detail card.
   * The backend contract should ideally provide roles, but during contract cleanup the
   * frontend accepts asset_id prefixes and common asset_type/profile words as safe fallbacks.
   */
  isVehicleAsset(entry) {
    const text = [entry?.asset_id, entry?.asset_type, entry?.profile, entry?.group, ...(entry?.roles || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return this.assetHasRole(entry, "vehicle") || text.includes("vehicle") || text.startsWith("vehicle_");
  }

  isChargerAsset(entry) {
    const text = [entry?.asset_id, entry?.asset_type, entry?.profile, entry?.group, ...(entry?.roles || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return this.assetHasRole(entry, "charger") || text.includes("charger") ||
      text.includes("evse") || text.includes("chargepoint") || text.includes("charging point") ||
      text.startsWith("charger_");
  }

  detailRoute(entry) {
    // R21.4: Registry does not own Lovelace routes. UX route factory owns navigation.
    return entry ? this.assetDetailRoute(entry) : "";
  }

  assetDetailRoute(entryOrAssetId) {
    const assetId = typeof entryOrAssetId === "string" ? entryOrAssetId : entryOrAssetId?.asset_id;
    if (!assetId) return "";
    if (this.config?.bootstrap_mode === true) {
      const basePath = String(this.config?.bootstrap_path || window.location?.pathname || "").trim() || window.location.pathname;
      return `${basePath}?mobility_view=detail&asset=${encodeURIComponent(assetId)}#asset=${encodeURIComponent(assetId)}`;
    }
    const configured = String(this.config?.dashboard_path || "").trim();
    const base = hbMobilityDashboardBase(configured || window.location?.pathname || "") || "/mobility-supervisor";
    return `${base}/asset-detail?asset=${encodeURIComponent(assetId)}#asset=${encodeURIComponent(assetId)}`;
  }

  /**
   * Canonical R21.8 command registry lookup.
   *
   * The frontend deliberately does not read the old
   * legacy mobility_asset command registry pattern anymore. If the
   * new registry is missing, actions disappear and the maintenance/contract
   * views expose that as a backend contract issue.
   */
  commandRegistry(assetId = "") {
    return this.commandV2Rows(assetId) || [];
  }


  uiCommandSurface(assetId = "") {
    return this.commandV2Rows(assetId) || [];
  }

  commandsFromIndexValue(value, assetId = "") {
    if (!value) return [];
    if (Array.isArray(value)) {
      if (value.some((x) => typeof x === "object" && (x?.command_id || x?.command_key))) return value.filter((entry) => !assetId || String(entry?.asset_id || "") === String(assetId));
      // index of command registry entity ids or rows
      const registries = value.map((x) => typeof x === "string" ? x : (x.registry || x.entity_id || x.command_registry || x.command_registry_entity || "")).filter(Boolean);
      return registries.flatMap((entityId) => this.commandsFromRegistryEntity(entityId, assetId));
    }
    if (typeof value === "object") {
      if (Array.isArray(value.commands)) return this.commandsFromIndexValue(value.commands, assetId);
      if (assetId && value[assetId]) return this.commandsFromIndexValue(value[assetId], assetId);
      const rows = Object.entries(value).flatMap(([key, row]) => {
        const keyAsset = String(key || "").includes(":") ? String(key).split(":")[0] : String(key || "");
        if (Array.isArray(row)) return row.map((c) => ({ asset_id: c.asset_id || keyAsset, ...c }));
        if (typeof row === "string") return this.commandsFromRegistryEntity(row, assetId || keyAsset);
        if (row?.commands) return this.commandsFromIndexValue(row.commands, assetId || keyAsset).map((c) => ({ asset_id: c.asset_id || keyAsset, ...c }));
        if (row?.command_id || row?.command_key) return [{ asset_id: row.asset_id || keyAsset, ...row }];
        return [];
      });
      return rows.filter((entry) => !assetId || String(entry?.asset_id || "") === String(assetId));
    }
    return [];
  }

  commandsFromRegistryEntity(entityId, assetId = "") {
    // Strict contract mode: per-asset command registries are not consumed by UX.
    return [];
  }


  /** Normalize the backend command contract into the UI action model. */
  normalizeCommandEntry(entry, assetId = "") {
    if (!entry || typeof entry !== "object") return null;
    const rawCommandKey = String(entry.command_key || entry.key || entry.command_id || entry.command || entry.id || entry.name || "").trim();
    const command_id = entry.command_id || (rawCommandKey.includes(".") ? rawCommandKey.split(".").pop() : rawCommandKey) || entry.command || entry.id || entry.name;
    if (!command_id && !rawCommandKey) return null;
    const parameter_schema = this.parseJsonValue(entry.parameter_schema, {});
    const currentSchema = parameter_schema?.current_a || {};
    const frontendAllowed = this.contractBool(entry.frontend_allowed, true);
    const intent = entry.intent_entity || entry.action_entity || entry.button_entity || entry.entity_id || entry.intent || "";
    const invoke = this.parseJsonValue(entry.invoke, entry.invoke || {});
    const invokeObject = invoke && typeof invoke === "object" && !Array.isArray(invoke) ? invoke : {};
    const invokeService = String(invokeObject.service || "").trim();
    const serviceParts = invokeService.includes(".") ? invokeService.split(".") : [];
    const invokeDomain = serviceParts.length > 1 ? serviceParts.shift() : "";
    const invokeAction = serviceParts.length ? serviceParts.join(".") : "";
    return {
      schema_version: entry.schema_version || 1,
      asset_id: entry.asset_id || assetId || "",
      command_id,
      label: entry.label || entry.display_name || this.titleize(command_id || rawCommandKey),
      category: entry.category || "secondary",
      command_key: entry.command_key || rawCommandKey || "",
      command_family: entry.command_family || entry.family || "",
      command_group: entry.command_group || entry.group || "",
      command_role: entry.command_role || entry.role || "",
      current_state_property: entry.current_state_property || "",
      opposite_command_key: entry.opposite_command_key || "",
      frontend_allowed: frontendAllowed,
      execution_allowed: this.contractBool(entry.execution_allowed, true),
      exists: this.contractBool(entry.exists, true),
      enabled: this.contractBool(entry.enabled, true),
      intent_entity: intent,
      intent_candidates: intent ? [intent] : [],
      capability_entity: entry.capability_entity || "",
      disabled_reason_entity: entry.disabled_reason_entity || "",
      execution_status: entry.execution_status || entry.ui_state || entry.effective_availability || "",
      execution_status_entity: entry.execution_status_entity || "",
      execution_reason: entry.blocked_reason || entry.execution_reason || entry.disabled_reason || "",
      execution_reason_entity: entry.execution_reason_entity || "",
      source_entity_id: entry.source_entity_id || "",
      service_domain: invokeDomain || entry.service_domain || entry.domain || "",
      service_action: invokeAction || entry.service_action || entry.service || entry.action || "",
      service_data: this.parseJsonValue(invokeObject.data, this.parseJsonValue(entry.service_data, entry.service_data || {})),
      service_target: this.parseJsonValue(invokeObject.target, entry.service_target || entry.target || {}),
      invoke: invokeObject,
      confirmation_status_entity: entry.confirmation_status_entity || "",
      confirmation_reason_entity: entry.confirmation_reason_entity || "",
      value_entity: entry.value_entity || "",
      current_value_entity: entry.current_value_entity || entry.current_entity || "",
      parameter_schema,
      primary_action: this.contractBool(entry.primary_action, false),
      confirmation_required: this.contractBool(entry.confirmation_required, false),
      physical_executor_asset_id: entry.physical_executor_asset_id || "",
      min: entry.min ?? entry.minimum ?? currentSchema.min ?? null,
      max: entry.max ?? entry.maximum ?? currentSchema.max ?? null,
      step: entry.step ?? currentSchema.step ?? null,
      unit: entry.unit || entry.unit_of_measurement || currentSchema.unit || "",
      supported: this.contractBool(entry.supported ?? currentSchema.supported, true),
      capability: entry.capability ?? entry.can_execute ?? entry.available ?? null,
      sort_order: entry.sort_order ?? 999,
      disabled_reason: entry.disabled_reason || "",
      raw: entry
    };
  }

  commandExists(assetId, commandId) {
    const registry = this.commandRegistry(assetId);
    if (!registry.length) return null;
    return registry.some((c) => {
      const wanted = this.norm(commandId);
      const parts = [c.command_id, c.command_key, c.command_group, c.command_role].filter(Boolean).map((v)=>this.norm(v));
      return c.exists !== false && (parts.includes(wanted) || parts.some((p)=>p.endsWith(wanted)));
    });
  }


  // R22.10.3 shared Mobility runtime contract access layer.
  // All Mobility screens must use these methods instead of view-specific index parsing.
  vehicles() {
    return this.indexedAssets("vehicle").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired");
  }

  chargers() {
    return this.indexedAssets("charger").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired");
  }

  assetById(assetId, kind = "all") {
    const canonical = this.canonicalAssetId(assetId);
    const pool = kind === "vehicle" ? this.vehicles() : kind === "charger" ? this.chargers() : [...this.vehicles(), ...this.chargers(), ...this.indexedAssets("all")];
    return pool.find((a) => String(a.asset_id || "") === String(canonical)) || null;
  }

  vehicleById(assetId) { return this.assetById(assetId, "vehicle"); }
  chargerById(assetId) { return this.assetById(assetId, "charger"); }

  canonicalRows(entityId, attrName, cacheKey = "") {
    const key = `canonicalRows:${cacheKey || entityId}:${attrName}`;
    if (this._memo.has(key)) return this._memo.get(key);
    const entity = this.entity(entityId);
    const attrs = entity?.attributes || {};
    let raw = attrs[attrName];
    let value = this.parseJsonValue(raw, null);
    if (!value && typeof raw === "object") value = raw;
    const rows = Array.isArray(value) ? value : (value && typeof value === "object" ? Object.values(value) : []);
    this._memo.set(key, rows.filter((r) => r && typeof r === "object"));
    return this._memo.get(key);
  }

  canonicalRowsFromAttrs(entityId, attrNames = [], cacheKey = "") {
    const key = `canonicalRowsFromAttrs:${cacheKey || entityId}:${attrNames.join("|")}`;
    if (this._memo.has(key)) return this._memo.get(key);
    const entity = this.entity(entityId);
    const attrs = entity?.attributes || {};
    const rows = [];
    for (const attrName of attrNames) {
      const raw = attrs[attrName];
      let value = this.parseJsonValue(raw, null);
      if (!value && raw && typeof raw === "object") value = raw;
      if (Array.isArray(value)) rows.push(...value);
      else if (value && typeof value === "object") rows.push(...Object.values(value));
    }
    const normalized = rows.filter((r) => r && typeof r === "object");
    this._memo.set(key, normalized);
    return normalized;
  }

  normalizedPropertyCatalog(assetType = "") {
    const rows = Array.isArray(globalThis.HI_MOBILITY_NORMALIZED_PROPERTY_CATALOG)
      ? globalThis.HI_MOBILITY_NORMALIZED_PROPERTY_CATALOG
      : (typeof HI_MOBILITY_NORMALIZED_PROPERTY_CATALOG !== "undefined" ? HI_MOBILITY_NORMALIZED_PROPERTY_CATALOG : []);
    const t = String(assetType || "").trim().toLowerCase();
    return rows.filter((r) => r && (!t || String(r.asset_type || "").toLowerCase() === t));
  }

  commandStandardCatalog(assetType = "") {
    const rows = Array.isArray(globalThis.HI_MOBILITY_COMMAND_STANDARD)
      ? globalThis.HI_MOBILITY_COMMAND_STANDARD
      : (typeof HI_MOBILITY_COMMAND_STANDARD !== "undefined" ? HI_MOBILITY_COMMAND_STANDARD : []);
    const t = String(assetType || "").trim().toLowerCase();
    return rows.filter((r) => r && (!t || String(r.asset_type || "").toLowerCase() === t));
  }

  propertyKeyCandidates(_assetId = "", field = "") {
    const key = String(field || "").trim();
    return key ? [key] : [];
  }


  canonicalFamilies() {
    return ["overview","vehicle","charging","battery","range","climate","security","openings","maintenance","tires","location","energy","metering","diagnostics"];
  }

  familyConfig(family = "overview") {
    const f = String(family || "overview").toLowerCase();
    const map = {
      overview: { title:"Overview", icon:"mdi:view-dashboard-outline", order:0 },
      vehicle: { title:"Vehicle", icon:"mdi:car-info", order:10 },
      charging: { title:"Charging", icon:"mdi:battery-charging", order:20 },
      battery: { title:"Battery", icon:"mdi:battery", order:30 },
      range: { title:"Range", icon:"mdi:map-marker-distance", order:40 },
      climate: { title:"Climate", icon:"mdi:fan", order:50 },
      security: { title:"Security", icon:"mdi:shield-check-outline", order:60 },
      openings: { title:"Openings", icon:"mdi:car-door", order:70 },
      maintenance: { title:"Maintenance", icon:"mdi:wrench-clock", order:80 },
      tires: { title:"Tires", icon:"mdi:car-tire-alert", order:90 },
      location: { title:"Location", icon:"mdi:map-marker", order:100 },
      energy: { title:"Energy", icon:"mdi:flash", order:110 },
      metering: { title:"Metering", icon:"mdi:counter", order:120 },
      diagnostics: { title:"Diagnostics", icon:"mdi:tools", order:900 }
    };
    return map[f] || { title:this.titleize(f), icon:"mdi:folder-outline", order:500 };
  }

  normalizedFamilyName(value = "") {
    const f = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    if (!f) return "";
    const aliases = { comfort:"climate", access:"security", locks:"security", doors:"openings", windows:"openings", electrical:"charging", configuration:"overview", config:"overview", identity:"overview", trust:"diagnostics", health:"diagnostics" };
    return aliases[f] || f;
  }


  propertyFamilyContractValue(row = {}) {
    return this.normalizedFamilyName(row.family || row.property_family || row.ux_family || "");
  }


  propertyFamily(row = {}) {
    return this.propertyFamilyContractValue(row);
  }

  propertyGroup(row = {}) {
    return String(row.group || row.property_group || row.ux_group || row.section_id || "").trim();
  }

  propertyParent(row = {}) {
    return String(row.parent || row.parent_property || row.parent_key || row.summary_parent || "").trim();
  }

  propertyDetailLevel(row = {}) {
    const explicit = String(row.detail_level || row.visibility_level || row.ux_detail_level || row.visibility || "").trim().toLowerCase();
    if (["summary","operational","technical","engineering","diagnostics","diagnostics_only"].includes(explicit)) {
      if (["technical","engineering","diagnostics","diagnostics_only"].includes(explicit)) return "technical";
      return explicit;
    }
    return "";
  }


  propertyDisplayLabel(row = {}) {
    const key = String(row.property_key || "");
    const explicit = String(row.friendly_name || row.display_name || "").trim();
    return explicit || `Contract gap: ${key || "property label"}`;
  }


  valueWithoutUnit(value, unit = "") {
    const raw = String(value ?? "").trim();
    const u = String(unit || "").trim();
    if (!raw || !u) return raw;
    const escaped = u.replace(/[.*+?^${}()|\[\]\\]/g, "\\$&");
    return raw.replace(new RegExp(`\\s*${escaped}$`, "i"), "").trim();
  }

  formatNumberForUnit(value, unit = "", _propertyKey = "") {
    const raw = this.valueWithoutUnit(value, unit);
    const n = Number(String(raw).replace(",", "."));
    if (!Number.isFinite(n)) return String(value ?? "");
    const u = String(unit || "").trim();
    const ul = u.toLowerCase();
    let decimals = 2;
    if (ul === "kwh" || ul === "wh") decimals = 4;
    else if (ul === "kw" || ul === "w") decimals = 2;
    else if (ul === "a") decimals = 1;
    else if (ul === "km" || ul === "m") decimals = 0;
    else if (u === "%") decimals = Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1;
    else if (["eur","€","usd","$","gbp","£"].includes(ul)) decimals = 2;
    const fixed = n.toFixed(decimals);
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }

  formatValue(value, unit = "", propertyKey = "") {
    const s = String(value ?? "").trim();
    if (!s || ["Unknown","Not available","—","None"].includes(s)) return s || "—";
    const formatted = this.formatNumberForUnit(s, unit, propertyKey);
    const u = String(unit || "").trim();
    if (!u) return formatted;
    const noUnit = this.valueWithoutUnit(formatted, u);
    return `${noUnit} ${u}`.trim();
  }

  displayFactWithUnit(assetId, field, fallback = "—") {
    const row = this.factContractRow(assetId, field);
    if (!row) return fallback;
    return this.propertyDisplayValue(row, fallback);
  }

  propertyDisplayValue(row = {}, fallback = "Unknown") {
    const key = String(row.property_key || "").toLowerCase();
    const value = this.factContractValue(row.asset_id, row.property_key, fallback);
    if (["lifecycle_status", "asset.lifecycle_status", "vehicle.lifecycle_status", "charger.lifecycle_status"].includes(key)) {
      const v = String(value || "").trim().toLowerCase();
      if (v === "active") return "Active";
      if (v === "disabled") return "Disabled";
      return value || fallback;
    }
    if (key.includes("charger_id") || key.includes("charger") && String(value || "").startsWith("charger_")) return this.chargerLabel(value);
    if (key.includes("vehicle_id") || key.includes("vehicle") && String(value || "").startsWith("vehicle_")) return this.vehicleLabel(value);
    return this.formatValue(value, row.unit || "", row.property_key || "");
  }

  uxEditorControlKind(prop = {}) {
    // Backend-published canonical write metadata is the sole editor authority.
    // Direct V2 semantic properties are primary; V2 metadata is authoritative.
    // Do not infer editor type from property names, units, integrations or values.
    const binding = String(prop.write_binding_type || prop.editor || "").trim().toLowerCase();
    if (binding === "select") return "select";
    if (binding === "text") return "text";
    if (binding === "switch" || binding === "toggle" || binding === "boolean") return "toggle";
    if (binding === "number" || binding === "slider") return "slider";
    if (binding === "datetime" || binding === "datetime-local") return "datetime";
    return "";
  }

  isConfigurationCommand(command = {}) {
    const key = String(command.command_key || command.command_id || command.label || "").toLowerCase();
    const role = String(command.command_role || command.role || "").toLowerCase();
    const forbidden = [
      "set_current_limit", "set_requested_power", "set_target_soc", "set_ready_by",
      "set_display_name", "set_profile", "set_selected_charger", "set_owner", "set_short_name"
    ];
    return forbidden.some((part) => key.includes(part) || role.includes(part));
  }

  commandFamilyIssue(command = {}) {
    if (!command || command.frontend_allowed === false) return "";
    const explicit = this.normalizedFamilyName(command.command_family || command.family || "");
    const assetId = this.canonicalAssetId(command.asset_id || "");
    const currentKey = String(command.current_state_property || "").trim();
    const row = currentKey ? this.factContractRow(assetId, currentKey) : null;
    const propFamily = row ? this.propertyFamily(row) : "";
    if (explicit && propFamily && explicit !== propFamily) return `Command family '${explicit}' does not match property family '${propFamily}' for ${currentKey}`;
    return "";
  }

  resolvedCommandFamily(command = {}) {
    const explicit = this.normalizedFamilyName(command.command_family || command.family || "");
    if (explicit) return explicit;
    return this.normalizedFamilyName(command.command_group || command.group || "");
  }

  familyCommandRows(assetId = "", family = "") {
    const f = this.normalizedFamilyName(family);
    return this.commandsFor(assetId)
      .filter((cmd) => this.resolvedCommandFamily(cmd) === f)
      .map((cmd) => {
        const st = this.commandState(cmd);
        const label = cmd.label || this.titleize(cmd.command_id || cmd.command_key || "Command");
        const value = st.disabled ? `Blocked${st.reason ? ` — ${st.reason}` : ""}` : "Available";
        return { type:"readonly", icon:this.commandIcon(cmd), label, value, _command:true, detail_level:"operational", order:Number(cmd.sort_order ?? 999) };
      });
  }

  familyLogicalSectionForProperty(row = {}) {
    const visibility=String(row.visibility || row.ux_visibility || "").trim().toLowerCase();
    if (["engineering","diagnostics","diagnostics_only"].includes(visibility)) return "diagnostics";
    const section=String(row.section_id || row.group || row.property_group || row.ux_group || "").trim().toLowerCase();
    if (!section) return "";
    if (["configuration","config","settings","editors"].includes(section)) return "editors";
    if (["metering","history"].includes(section)) return "metering";
    if (["overview","key","key_properties","summary"].includes(section)) return "overview";
    if (["diagnostics","engineering"].includes(section)) return "diagnostics";
    return section;
  }

  familyLogicalSectionLabel(section = "details") {
    const key = String(section || "details").toLowerCase();
    const labels = { overview:"Overview", editors:"Editors", settings:"Editors", actions:"Actions", details:"Details", metering:"Metering", diagnostics:"Diagnostics" };
    return labels[key] || this.titleize(key);
  }

  familyLogicalSectionOrder(section = "details") {
    const order = { overview:0, editors:8, settings:8, actions:10, details:20, metering:30, diagnostics:40 };
    return order[String(section || "details").toLowerCase()] ?? 99;
  }


  isWritableProperty(prop = {}) {
    // Appearance is a dedicated visual picker, not a generic readonly field.
    // The backend explicitly marks image_key writable while render_as is readonly_value.
    const editor = this.isAppearanceProperty(prop) ? "appearance_picker" : this.uxEditorControlKind(prop);
    return this.contractBool(prop.editable, false) === true
      && this.contractBool(prop.write_supported, false) === true
      && !!editor
      && !!prop.write_service_domain
      && !!prop.write_service_action
      && !!prop.write_target_entity;
  }

  isAppearanceProperty(prop = {}) {
    const key = String(prop.property_key || "").trim().toLowerCase();
    return key === "vehicle.image_key" || key === "charger.image_key";
  }

  isProductConfigurationProperty(prop = {}) {
    // Product UX deliberately exposes only configuration intents that have a
    // dedicated Mobility interaction. A backend source/sensor fact can still
    // be technically writable, but it must not become an editor merely because
    // transport metadata was accidentally projected.
    const key = String(prop.property_key || "").trim().toLowerCase();
    const allowed = new Set([
      "asset.profile_id",
      "vehicle.selected_charger",
      "vehicle.requested_charge_power_kw",
      "charger.requested_charge_power_kw",
      "vehicle.target_soc_pct",
      "vehicle.ready_by",
      "vehicle.image_key",
      "charger.image_key"
    ]);
    return allowed.has(key);
  }

  isProductWritableProperty(prop = {}) {
    return this.isProductConfigurationProperty(prop) && this.isWritableProperty(prop);
  }

  propertyEditorChoices(prop = {}) {
    // Backend-published choices/options are authoritative. Direct V2 metadata is primary.
    // UX never derives profile, charger or other configuration options from integrations or device identity.
    const direct = this.parseJsonValue(prop.choices, prop.choices || null);
    if (Array.isArray(direct)) return direct;
    const options = this.parseJsonValue(prop.options, prop.options || null);
    if (Array.isArray(options)) return options;
    const validation = prop.validation && typeof prop.validation === "object" ? prop.validation : {};
    const validationChoices = this.parseJsonValue(validation.choices, validation.choices || null);
    if (Array.isArray(validationChoices)) return validationChoices;
    const validationOptions = this.parseJsonValue(validation.options, validation.options || null);
    if (Array.isArray(validationOptions)) return validationOptions;
    return [];
  }

  numericPropertyValue(assetId = "", propertyKey = "", fallback = null) {
    const v = this.factValue(assetId, propertyKey, fallback);
    const n = Number(String(this.valueWithoutUnit(v ?? "", "")).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  numericPropertyValueAny(assetId = "", propertyKeys = [], fallback = null) {
    for (const key of propertyKeys.filter(Boolean)) {
      const v = this.numericPropertyValue(assetId, key, null);
      if (Number.isFinite(v)) return v;
    }
    return fallback;
  }

  sliderBoundsForProperty(prop = {}) {
    // R43.2.54: min/max/step are property-contract metadata. UX does not derive
    // power from current/phases/voltage, clamp against local capability guesses,
    // or invent semantic fallback bounds.
    const validation = prop.validation && typeof prop.validation === "object" ? { ...prop.validation } : {};
    const min = validation.min ?? validation.minimum ?? prop.min;
    const max = validation.max ?? validation.maximum ?? prop.max;
    const step = validation.step ?? prop.step;
    const nMin = Number(String(min ?? "").replace(",", "."));
    const nMax = Number(String(max ?? "").replace(",", "."));
    const nStep = Number(String(step ?? "").replace(",", "."));
    const valid = Number.isFinite(nMin) && Number.isFinite(nMax) && nMax >= nMin;
    return {
      min: valid ? nMin : "",
      max: valid ? nMax : "",
      step: Number.isFinite(nStep) && nStep > 0 ? nStep : "",
      valid: valid && Number.isFinite(nStep) && nStep > 0,
      source: valid && Number.isFinite(nStep) && nStep > 0 ? "property_contract" : ""
    };
  }

  propertyEditorRow(prop) {
    const editor = this.uxEditorControlKind(prop);
    const validation = prop.validation && typeof prop.validation === "object" ? { ...prop.validation } : {};
    const slider = this.sliderBoundsForProperty(prop);
    if (slider.valid) {
      validation.min = slider.min;
      validation.max = slider.max;
      validation.step = slider.step;
    }
    const allowNone = this.contractBool(prop.allow_none, false);
    const noneValue = prop.none_value ?? "";
    const configuredValue = prop.value === undefined || prop.value === null || String(prop.value).trim() === ""
      ? (allowNone ? noneValue : "")
      : prop.value;
    return {
      type:"property-editor",
      property: prop,
      icon: prop.icon || this.propertyIcon(prop.property_key),
      label: this.propertyDisplayLabel(prop),
      value: this.propertyDisplayValue(prop),
      editor_value: configuredValue,
      help: prop.description || prop.meaning || "",
      editor,
      validation,
      slider_bounds_valid: slider.valid,
      slider_bounds_source: slider.source || "",
      choices: this.propertyEditorChoices(prop),
      choice_source: prop.choice_source || "",
      value_field: prop.value_field || "value",
      label_field: prop.label_field || "label",
      secondary_label_field: prop.secondary_label_field || "secondary_label",
      allow_none: allowNone,
      none_value: noneValue,
      disabled: !this.isWritableProperty(prop),
      disabled_reason: prop.write_blocked_reason || (!this.contractBool(prop.write_supported, false) ? "Editing not available" : (!editor ? "Editor metadata missing" : (!prop.write_service_domain || !prop.write_service_action || !prop.write_target_entity) ? "Write binding incomplete" : ""))
    };
  }

  propertyOperationalRow(prop) {
    if (this.isProductWritableProperty(prop) && !this.isAppearanceProperty(prop)) return this.propertyEditorRow(prop);
    return { type:"readonly", icon: prop.icon || this.propertyIcon(prop.property_key), label:this.propertyDisplayLabel(prop), value:this.propertyDisplayValue(prop), detail_level:prop._ux_level, parent:prop._ux_parent, group:prop._ux_group };
  }

  propertyWriteSection(prop) {
    if (this.isProductWritableProperty(prop) && !this.isAppearanceProperty(prop)) return "editors";
    return this.familyLogicalSectionForProperty(prop);
  }

  activityRowsFor(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const rows = [...(this.mobilityActivityV2()?.activities || [])];
    return rows.filter((a)=>!canonical || String(a.asset_id || a.subject_asset_id || a.related_asset_id || "") === canonical || String(a.related_asset_id || "") === canonical);
  }

  intelligenceRowsFor(assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    const experience = this.mobilityExperienceV2();
    if (!experience) return [];
    const source = [...(experience.vehicles || []), ...(experience.chargers || [])]
      .filter((row)=>!canonical || String(row?.asset_id || "") === canonical);
    const rows = [];
    for (const row of source) {
      for (const [key, value] of Object.entries(row || {})) {
        if (!key.endsWith("_intelligence") || !value || typeof value !== "object") continue;
        rows.push({
          asset_id: row.asset_id,
          insight_type: key,
          family: key.replace(/_intelligence$/, ""),
          title: key.replace(/_/g, " "),
          message: value.summary || value.reason || value.state || "",
          value: value.state,
          reason: value.reason || "",
          raw: value,
          _authority: "MOBILITY_EXPERIENCE_V2"
        });
      }
    }
    return rows;
  }


  clusterIntelligenceRows(assetType = "vehicle", assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const experience = this.mobilityExperienceV2();
    if (!experience) return [];
    const source = String(assetType || "").toLowerCase() === "charger" ? (experience.chargers || []) : (experience.vehicles || []);
    return source.filter((row)=>!canonical || String(row?.asset_id || "") === canonical);
  }

  clusterIntelligenceObject(assetId = "", assetType = "vehicle") {
    const rows = this.clusterIntelligenceRows(assetType, assetId);
    if (!rows.length) return null;
    const first = rows[0] || {};
    return first.summary && typeof first.summary === "object" ? { ...first, ...first.summary } : first;
  }

  contractGapTile(label = "", icon = "mdi:alert-outline", detail = "") {
    return {
      icon,
      label:label || this.t("common.status",{},"Status"),
      value:this.t("common.not_available",{},"Not available"),
      subvalue:detail || this.t("common.information_missing",{},"Information is not available yet."),
      tone:"attention",
      subIcon:"mdi:alert-outline"
    };
  }

  normalizedIntelligenceTile(raw = null, required = {}) {
    if (!raw || typeof raw !== "object" || !Object.keys(raw).length) {
      return this.contractGapTile(required.label || "Status", required.icon || "mdi:alert-outline", required.detail || "Missing from intelligence index");
    }
    const primary = raw.primary ?? raw.primary_display ?? raw.summary ?? raw.value ?? raw.display ?? raw.label ?? raw.state_label ?? "";
    const secondary = raw.secondary ?? raw.secondary_display ?? raw.reason ?? raw.detail ?? raw.message ?? raw.activity_display ?? raw.charging_activity_display ?? "";
    if (!String(primary || "").trim()) {
      return this.contractGapTile(required.label || raw.label || "Status", required.icon || raw.icon || "mdi:alert-outline", "Missing primary display");
    }
    const severity = String(raw.severity || raw.tone || raw.state || "neutral").toLowerCase();
    const tone = /error|critical|not_ok|not ok|fault/.test(severity) ? "error" : (/warn|attention|stale|due/.test(severity) ? "attention" : (/active|charging/.test(severity) ? "active" : "neutral"));
    return {
      icon: raw.icon || raw.primary_icon || required.icon || "mdi:information-outline",
      label: required.label || raw.label_text || raw.title || raw.label || "Status",
      value: String(primary || "Unknown"),
      subvalue: secondary ? String(secondary) : "",
      tone,
      subIcon: raw.reason_icon || raw.secondary_icon || ""
    };
  }

  vehicleIntelligenceStatusTiles(assetId = "") {
    const obj = this.clusterIntelligenceObject(assetId, "vehicle");
    if (!obj) {
      return [
        this.contractGapTile("Range", "mdi:road-variant", "Information is not available yet"),
        this.contractGapTile("Energy", "mdi:battery-charging", "Information is not available yet"),
        this.contractGapTile("Security", "mdi:lock-outline", "Information is not available yet"),
        this.contractGapTile("Maintenance", "mdi:wrench-outline", "Information is not available yet"),
        this.contractGapTile("Freshness", "mdi:clock-outline", "Information is not available yet")
      ];
    }
    const range = obj.range_intelligence || obj.range || obj.range_summary || obj.Range || null;
    const energy = obj.energy_intelligence || obj.energy || obj.energy_summary || obj.charging_energy || obj.Energy || null;
    const charging = obj.charging_intelligence || obj.charging || obj.charging_summary || null;
    const security = obj.security_intelligence || obj.security || obj.security_summary || obj.Security || null;
    const maintenance = obj.maintenance_intelligence || obj.maintenance || obj.maintenance_summary || obj.Maintenance || null;
    const freshness = obj.freshness_intelligence || obj.freshness || obj.freshness_summary || obj.data_freshness || obj.Freshness || null;
    const energyRaw = energy ? {
      ...energy,
      primary: energy.primary || energy.primary_display || [energy.ev_range_display, energy.battery_soc_display].filter(Boolean).join(" · ") || energy.display,
      secondary: energy.secondary || energy.secondary_display || energy.charging_activity_display || energy.activity_display || charging?.summary || charging?.primary || charging?.primary_display || [energy.actual_charge_power_display, energy.charge_state || energy.charging_state].filter(Boolean).join(" "),
      icon: energy.icon || "mdi:battery-charging"
    } : null;
    return [
      this.normalizedIntelligenceTile(range, { label:"Range", icon:"mdi:road-variant" }),
      this.normalizedIntelligenceTile(energyRaw, { label:"Energy", icon:"mdi:battery-charging" }),
      this.normalizedIntelligenceTile(security, { label:"Security", icon:"mdi:lock-outline" }),
      this.normalizedIntelligenceTile(maintenance, { label:"Maintenance", icon:"mdi:wrench-outline" }),
      this.normalizedIntelligenceTile(freshness, { label:"Freshness", icon:"mdi:clock-outline" })
    ];
  }

  // Charger product headline semantics intentionally have no intelligence-based
  // fallback resolver. Use chargerProductSnapshot() only.

  lifecyclePropertyRow(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    // R43.2.54: lifecycle is a property concern. Deprecated aggregate runtime
    // publications and asset-index metadata are never product lifecycle fallbacks.
    return this.semanticProperty(canonical, "asset.lifecycle_status") || null;
  }



  lifecycleStatus(assetOrId = "") {
    const asset = typeof assetOrId === "object" ? assetOrId : this.assetById(assetOrId);
    const canonical = this.canonicalAssetId(asset?.asset_id || assetOrId || "");
    const prop = canonical ? this.lifecyclePropertyRow(canonical) : null;
    const raw = String(prop?.value ?? "").trim().toLowerCase();
    if (raw === "active") return "active";
    if (raw === "disabled") return "disabled";
    if (raw === "retired") return "retired";
    return "unknown";
  }

  isLifecycleActive(assetOrId = "") {
    return this.lifecycleStatus(assetOrId) === "active";
  }

  isLifecycleDisabled(assetOrId = "") {
    return this.lifecycleStatus(assetOrId) === "disabled";
  }

  lifecycleWriteModel(assetOrId = "", desiredStatus = "") {
    const asset = typeof assetOrId === "object" ? assetOrId : this.assetById(assetOrId);
    const canonical = this.canonicalAssetId(asset?.asset_id || assetOrId || "");
    const value = String(desiredStatus || "").trim().toLowerCase();
    // Lifecycle truth is asset.lifecycle_status. The backend may publish a
    // distinct alias only as its explicit editable transport: it is NOT truth.
    const prop = canonical ? this.semanticProperty(canonical, "lifecycle_status") : null;
    const writable = !!(prop && this.lifecyclePropertyRow(canonical) && this.isWritableProperty(prop));
    const current = this.lifecycleStatus(asset || canonical);
    return {
      asset_id: canonical,
      property_key: prop?.property_key || "lifecycle_status",
      prop,
      current,
      desired: value,
      writable,
      disabled: !writable || !["active", "disabled"].includes(value),
      reason: prop ? (writable ? "" : "Lifecycle write binding incomplete") : "Lifecycle contract gap"
    };
  }

  propertyTransportValue(prop = {}, semanticValue = "") {
    const domainText = String(prop.write_service_domain || "").toLowerCase();
    const actionText = String(prop.write_service_action || "").toLowerCase();
    const binding = String(prop.write_binding_type || "").toLowerCase();
    if (!(binding === "select" || domainText === "select" || actionText.includes("select"))) return semanticValue;
    const choices = this.propertyEditorChoices(prop);
    const wanted = String(semanticValue ?? "");
    const match = choices.find((row)=>{
      const value = typeof row === "object" && row !== null ? row.value : row;
      return String(value ?? "") === wanted;
    });
    if (match && typeof match === "object" && match !== null) {
      const transportField = String(prop.transport_value_field || "transport_value").trim() || "transport_value";
      const transport = match[transportField] ?? match.transport_value;
      if (transport !== undefined && transport !== null && String(transport).trim() !== "") return transport;
      const label = match.label ?? match.display_name ?? match.name;
      if (label !== undefined && label !== null && String(label).trim() !== "") return label;
    }
    return semanticValue;
  }

  canonicalWriteValueEqual(actual, expected) {
    if (typeof expected === "boolean") return String(actual).toLowerCase() === String(expected).toLowerCase();
    const a = Number(String(actual ?? "").replace(",", "."));
    const e = Number(String(expected ?? "").replace(",", "."));
    if (String(actual ?? "").trim() !== "" && String(expected ?? "").trim() !== "" && Number.isFinite(a) && Number.isFinite(e)) {
      return Math.abs(a - e) <= 0.000001;
    }
    return String(actual ?? "").trim() === String(expected ?? "").trim();
  }

  async waitForCanonicalPropertyReadback(assetId = "", propertyKey = "", expected = "", options = {}) {
    const canonical = this.canonicalAssetId(assetId);
    const attempts = Math.max(1, Number(options.attempts || 20));
    const delayMs = Math.max(25, Number(options.delay_ms || 150));
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      this._canonicalProperties.refresh(this.hass);
      const row = this.v2SemanticProperty(canonical, propertyKey);
      if (row && this.canonicalWriteValueEqual(row.value, expected)) return true;
      if (attempt < attempts - 1) await new Promise((resolve)=>setTimeout(resolve, delayMs));
    }
    return false;
  }

  async writePropertyValueAsync(prop = {}, value = "", options = {}) {
    if (!prop || !this.hass || !this.isWritableProperty(prop)) return false;
    const domain = prop.write_service_domain;
    const action = prop.write_service_action;
    const target = prop.write_target_entity;
    const transportValue = this.propertyTransportValue(prop, value);
    const payload = { ...(prop.write_service_data && typeof prop.write_service_data === "object" ? prop.write_service_data : {}) };
    if (!payload.entity_id) payload.entity_id = target;
    const domainText = String(domain || "").toLowerCase();
    const actionText = String(action || "").toLowerCase();
    if (!["button", "input_button"].includes(domainText)) {
      const explicitField = String(prop.write_value_field || "").trim();
      if (explicitField) payload[explicitField] = transportValue;
      else if (actionText.includes("select") || domainText.includes("select")) payload.option = transportValue;
      else if (actionText.includes("datetime") || domainText.includes("datetime")) payload.datetime = transportValue;
      else if (actionText.includes("time")) payload.time = transportValue;
      else if (actionText.includes("turn_")) { /* entity_id only */ }
      else payload.value = transportValue;
    }
    try {
      await this.hass.callService(domain, action, payload);
      if (options.readback === false) return true;
      const assetId = this.canonicalAssetId(prop.asset_id || options.asset_id || "");
      const propertyKey = String(prop.property_key || options.property_key || "").trim();
      if (!assetId || !propertyKey) return false;
      const confirmed = await this.waitForCanonicalPropertyReadback(assetId, options.readback_property_key || propertyKey, value, options);
      if (!confirmed) {
        console.error("[RHI Mobility UX] canonical property readback timeout", {property_key:propertyKey,asset_id:assetId,expected:value});
      }
      return confirmed;
    } catch (error) {
      console.error("[RHI Mobility UX] property write failed", {property_key:prop.property_key,asset_id:prop.asset_id,error});
      return false;
    }
  }

  async writePublishedPropertyAsync(assetId = "", propertyKey = "", value = "", options = {}) {
    const canonical = this.canonicalAssetId(assetId);
    const prop = this.semanticProperty(canonical, propertyKey);
    if (!prop) return false;
    return this.writePropertyValueAsync(prop, value, { ...options, asset_id:canonical, property_key:propertyKey });
  }

  async writeLifecycleStatusAsync(assetOrId = "", desiredStatus = "") {
    const model = this.lifecycleWriteModel(assetOrId, desiredStatus);
    if (model.disabled) return false;
    return this.writePropertyValueAsync(model.prop, model.desired, {
      asset_id:this.canonicalAssetId(typeof assetOrId === "string" ? assetOrId : assetOrId?.asset_id || ""),
      readback_property_key:"asset.lifecycle_status"
    });
  }

  lifecycleContractGapSection(assetId = "") {
    if (this.lifecyclePropertyRow(assetId)) return null;
    return {
      key:"lifecycle-contract-gap",
      title:"Lifecycle",
      icon:"mdi:alert-outline",
      header:"Contract gap",
      rows:[{ type:"readonly", icon:"mdi:alert-outline", label:"Lifecycle", value:"Contract gap" }],
      details:[{ label:"Required property", value:"property_key=asset.lifecycle_status is missing; no fallback to mobility_enabled/Enabled" }]
    };
  }

  contractConsumptionSummary(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const props = this.propertyRows(canonical).filter((p)=>String(p.access || "").toLowerCase() !== "internal");
    const commands = this.commandRegistry(canonical).filter((c)=>this.contractBool(c.frontend_allowed, true) === true && !this.isConfigurationCommand(c));
    const activities = this.activityRowsFor(canonical);
    const insights = this.intelligenceRowsFor(canonical);
    const editable = props.filter((p)=>p.editable);
    const editableGaps = editable.filter((p)=>!this.isWritableProperty(p));
    const executableCommandGaps = commands.filter((c)=>this.contractBool(c.execution_allowed, false) === true && (!c.service_domain || !c.service_action));
    return { props, commands, activities, insights, editable, editableGaps, executableCommandGaps };
  }

  familyDetailSections(assetId = "", assetType = "") {
    const canonical = this.canonicalAssetId(assetId);
    const groups = new Map();
    const warnings = [];
    const publishedPublicPropertyKeys = new Set();
    const renderedPublicPropertyKeys = new Set();
    const engineeringPublicPropertyKeys = new Set();
    const addFamily = (family) => {
      const f = this.normalizedFamilyName(family);
      if (!f) return null;
      if (!groups.has(f)) groups.set(f, { properties:[], commands:[] });
      return groups.get(f);
    };

    for (const prop of this.propertyRows(canonical)) {
      if (String(prop.access || "").toLowerCase() === "internal") continue;
      const propKeyLower = String(prop.property_key || prop.normalized_property || prop.fact_type || "").toLowerCase();
      if (["asset.mobility_enabled", "vehicle.mobility_enabled", "charger.mobility_enabled", "mobility_enabled"].includes(propKeyLower)) { engineeringPublicPropertyKeys.add(propKeyLower); continue; }
      const publishedKey = String(prop.property_key || prop.normalized_property || prop.fact_type || "");
      publishedPublicPropertyKeys.add(publishedKey);
      if (this.isAppearanceProperty(prop)) {
        // Appearance is rendered once, at the asset hero where users expect it.
        // Count it as consumed here so contract completeness does not force a
        // duplicate property-grid representation.
        renderedPublicPropertyKeys.add(publishedKey);
        continue;
      }
      const family = this.propertyFamily(prop);
      const level = this.propertyDetailLevel(prop);
      const bucket = addFamily(family);
      const group = this.propertyGroup(prop);
      const parent = this.propertyParent(prop);
      const logical = this.propertyWriteSection(prop);
      if (!family || !bucket) {
        warnings.push(`Missing property family metadata for ${prop.property_key}; property remains a contract gap.`);
        continue;
      }
      bucket.properties.push({ ...prop, _ux_family:family, _ux_group:group, _ux_parent:parent, _ux_level:level, _ux_logical_section:logical });
      if (!logical) warnings.push(`Missing section/placement metadata for ${prop.property_key}; property remains a contract gap.`);
      if (prop.editable && !this.isWritableProperty(prop)) warnings.push(`Editable property ${prop.property_key} is not writable under R41.4; UX renders it read-only and reports backend contract gap.`);
      if (String(prop.group || "").toLowerCase() === "main_info") warnings.push(`Property ${prop.property_key} still uses deprecated group=main_info; R41.4 requires group=overview.`);
      if (String(prop.group || "").toLowerCase() === "actions") warnings.push(`Property ${prop.property_key} uses group=actions; R41.4 reserves Actions for command_index only.`);
    }


    const sections = [];
    const familyOrder = this.canonicalFamilies();
    const sortedFamilies = Array.from(groups.keys()).sort((a,b) => (this.familyConfig(a).order - this.familyConfig(b).order) || familyOrder.indexOf(a) - familyOrder.indexOf(b) || a.localeCompare(b));

    for (const family of sortedFamilies) {
      const bucket = groups.get(family) || { properties:[], commands:[] };
      const cfg = this.familyConfig(family);
      const props = bucket.properties.sort((a,b)=>(Number(a.display_order ?? a.sort_order ?? 999)-Number(b.display_order ?? b.sort_order ?? 999)) || String(a._ux_parent).localeCompare(String(b._ux_parent)) || String(a.property_key).localeCompare(String(b.property_key)));
      const primary = props.find((p)=>p._ux_level === "summary" || p._ux_logical_section === "overview") || props[0] || null;
      const logical = new Map();
      const addLogical = (name, item) => {
        const key = String(name || "details").toLowerCase();
        if (!logical.has(key)) logical.set(key, []);
        logical.get(key).push(item);
      };
      for (const p of props) {
        // Normal detail screens must not become a public property dump. Technical/diagnostic
        // rows stay available under Engineering details only.
        if (p._ux_logical_section === "diagnostics" || p._ux_level === "technical") {
          engineeringPublicPropertyKeys.add(String(p.property_key || ""));
          continue;
        }
        renderedPublicPropertyKeys.add(String(p.property_key || ""));
        addLogical(p._ux_logical_section, { kind:"property", row:p });
      }
      for (const cmd of bucket.commands.sort((a,b)=>(Number(a.sort_order ?? 999)-Number(b.sort_order ?? 999)) || String(a.command_key || a.label || "").localeCompare(String(b.command_key || b.label || "")))) addLogical("actions", { kind:"command", row:cmd });

      const rows = [];
      const details = [];
      const logicalKeys = Array.from(logical.keys()).sort((a,b)=>this.familyLogicalSectionOrder(a)-this.familyLogicalSectionOrder(b));
      for (const logicalKey of logicalKeys) {
        const items = logical.get(logicalKey) || [];
        if (!items.length) continue;
        rows.push({ type:"subheader", label:this.familyLogicalSectionLabel(logicalKey), value:"" });
        let currentParent = "";
        for (const item of items) {
          if (item.kind === "property") {
            const p = item.row;
            const parent = String(p._ux_parent || p._ux_group || "general");
            if (parent && parent !== currentParent && logicalKey !== "overview") {
              currentParent = parent;
              rows.push({ type:"subheader-small", label:this.titleize(parent.replace(/_/g," ")), value:"" });
            }
            rows.push(this.propertyOperationalRow(p));
          } else if (item.kind === "command") {
            const cmd = item.row;
            rows.push({ type:"action-row", icon:this.commandIcon(cmd), label:cmd.label || this.titleize(cmd.command_id || cmd.command_key), command:cmd, asset_id:canonical });
          }
        }
      }

      const technicalProps = props.filter((p)=>p._ux_level === "technical" || p._ux_logical_section === "diagnostics" || p.source_entity_id || p.source_adapter_id || p.source_candidate_id);
      for (const p of technicalProps) {
        engineeringPublicPropertyKeys.add(String(p.property_key || ""));
        details.push({ label:this.propertyDisplayLabel(p), value:`${this.propertyDisplayValue(p)} · key=${p.property_key}; quality=${p.quality || ""}; health=${p.health || ""}` });
      }
      // Public-contract completeness guard: every public property must be visible in normal UX or
      // traceable from Engineering details. This prevents silent drops when family,
      // group, detail_level or access metadata changes in runtime.
      const familyPublicKeys = props.map((p)=>String(p.property_key || "")).filter(Boolean);
      const unaccounted = familyPublicKeys.filter((k)=>!renderedPublicPropertyKeys.has(k) && !engineeringPublicPropertyKeys.has(k));
      for (const key of unaccounted) {
        const p = props.find((row)=>String(row.property_key || "") === key) || {};
        engineeringPublicPropertyKeys.add(key);
        details.push({ label:`unaccounted ${this.propertyDisplayLabel(p)}`, value:`${this.propertyDisplayValue(p)} · key=${key}; routed_to=engineering_guard` });
      }
      for (const cmd of bucket.commands) {
        const st = this.commandState(cmd);
        details.push({ label:`command ${cmd.command_key || cmd.command_id}`, value:`${st.disabled ? "disabled" : "enabled"}; reason=${st.reason || cmd.execution_reason || ""}` });
      }

      sections.push({ key:`family-${family}`, title:cfg.title, icon:cfg.icon, header: primary ? this.propertyDisplayValue(primary) : `${bucket.commands.length} actions`, rows, details });
    }

    const activities = this.activityRowsFor(canonical);
    if (activities.length) {
      sections.push({ key:"activity", title:"Current Activity", icon:"mdi:progress-clock", header:`${activities.length} active`, rows:activities.map((a)=>({type:"readonly", icon:"mdi:progress-clock", label:a.activity_type || a.family || "Activity", value:a.message || a.activity_state || "Active"})), details:activities.map((a,i)=>({label:`Activity ${i+1}`, value:`family=${a.family || ""}; state=${a.activity_state || ""}; confidence=${a.confidence || ""}`})) });
    }
    const insights = this.intelligenceRowsFor(canonical);
    if (insights.length) {
      sections.push({ key:"intelligence", title:"Insights", icon:"mdi:brain", header:`${insights.length} insights`, rows:insights.map((r)=>({type:"readonly", icon:"mdi:brain", label:r.title || r.insight_type || r.family || "Insight", value:r.message || r.meaning || r.value || "Published"})), details:insights.map((r,i)=>({label:`Insight ${i+1}`, value:`quality=${r.quality || ""}; confidence=${r.confidence || ""}; sources=${Array.isArray(r.source_properties) ? r.source_properties.join(",") : (r.source_property || "")}`})) });
    }

    const summary = this.contractConsumptionSummary(canonical);
    const silentDrops = Array.from(publishedPublicPropertyKeys).filter((k)=>k && !renderedPublicPropertyKeys.has(k) && !engineeringPublicPropertyKeys.has(k));
    if (silentDrops.length) warnings.push(`Silent property drops detected: ${silentDrops.join(", ")}`);
    const reportRows = [
      {type:"readonly", icon:"mdi:database-check", label:"Properties consumed", value:String(summary.props.length)},
      {type:"readonly", icon:"mdi:gesture-tap-button", label:"Commands surfaced", value:String(summary.commands.length)},
      {type:"readonly", icon:"mdi:tune", label:"Editable properties", value:String(summary.editable.length)},
      {type:"readonly", icon:"mdi:alert", label:"Gaps", value:String(warnings.length + summary.editableGaps.length + summary.executableCommandGaps.length)}
    ];
    // Keep contract consumption evidence out of normal detail UX. It belongs in validation
    // reports and Engineering details, not as a visible product section.
    if (this.config?.show_contract_consumption === true) {
      sections.push({ key:"contract-consumption", title:"Contract Consumption", icon:"mdi:file-check-outline", header:"UX completeness", rows:reportRows, details:[...warnings.map((w,i)=>({label:`Warning ${i+1}`, value:w})), ...summary.editableGaps.map((p)=>({label:`Editable gap ${p.property_key}`, value:"Missing write_supported/write_service_domain/write_service_action/write_target_entity"})), ...summary.executableCommandGaps.map((c)=>({label:`Command gap ${c.command_key || c.command_id}`, value:"execution_allowed=true but service metadata incomplete"}))] });
    }
    return sections.filter((s)=>s.rows?.length || s.details?.length);
  }

  propertyDisplaySection(assetId = "", title = "Published Properties") {
    const rows = this.propertyRows(assetId)
      .slice()
      .sort((a,b)=>String(a.property_key || "").localeCompare(String(b.property_key || "")));
    const displayRows = rows.map((p) => {
      return { type:"readonly", icon:this.propertyIcon(p.property_key), label:this.propertyDisplayLabel(p), value:this.propertyDisplayValue(p) };
    });
    const details = rows.map((p) => ({
      label:p.property_key,
      value:`quality=${p.quality || ""}; health=${p.health || ""}; source=${p.source_layer || ""}; command=${p.write_command || ""}`
    }));
    return {
      key:"published-properties",
      title,
      icon:"mdi:database-eye-outline",
      header:`${rows.length} properties`,
      rows:displayRows,
      details
    };
  }

  propertyIcon(propertyKey = "") {
    const k = String(propertyKey || "").toLowerCase();
    if (k.includes("soc") || k.includes("battery")) return "mdi:battery";
    if (k.includes("range")) return "mdi:map-marker-distance";
    if (k.includes("power")) return "mdi:flash";
    if (k.includes("current")) return "mdi:current-ac";
    if (k.includes("voltage")) return "mdi:sine-wave";
    if (k.includes("lock") || k.includes("door") || k.includes("window") || k.includes("security")) return "mdi:shield-car";
    if (k.includes("climate") || k.includes("temperature")) return "mdi:fan";
    if (k.includes("energy")) return "mdi:counter";
    if (k.includes("profile")) return "mdi:card-account-details-outline";
    return "mdi:database";
  }

  vehicleComponentContractRows(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const grouped = new Map();
    for (const row of this.v2PropertyRows(canonical)) {
      const componentId = String(row.component_id || "").trim();
      if (!componentId) continue;
      if (!grouped.has(componentId)) grouped.set(componentId,{ component_id:componentId, asset_id:canonical, properties:[] });
      grouped.get(componentId).properties.push(row);
    }
    return [...grouped.values()];
  }

  vehicleComponentContractAvailable() {
    return this.vehicleComponentContractRows().length > 0;
  }

  vehicleComponentRows() {
    // R43.2.54 fail-closed: layout comes only from the published component contract.
    return this.vehicleComponentContractRows();
  }

  vehicleComponent(assetId = "", componentId = "") {
    const id = String(componentId || "").trim();
    return this.vehicleComponentRows().find((c)=>String(c.component_id || "") === id) || null;
  }

  vehicleComponentPropertyIndexEntities() { return []; }

  componentPropertyRows(assetId = "", componentId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const component = this.vehicleComponent(canonical, componentId);
    if (!component?.property_index_entity) return [];
    return this.propertyRowsFromEntity(component.property_index_entity, canonical).map((row)=>({ ...row, component_id: component.component_id, component_display_name: component.display_name }));
  }

  vehicleComponentProperties(assetId = "", componentId = "") {
    return this.componentPropertyRows(assetId, componentId);
  }

  vehicleComponentCommands(assetId = "", componentId = "") {
    // R43.2.54: component contracts never invent command placement. Only explicit
    // vehicle command-slot placement may put a command inside a component.
    const rows = this.commandSlotRowsForSurface(assetId, componentId);
    if (rows === null || !rows.length) return [];
    return this.commandsForSurface(assetId, componentId);
  }

  vehicleComponentModel(assetId = "", componentId = "") {
    const component = this.vehicleComponent(assetId, componentId);
    if (!component) return null;
    const properties = this.vehicleComponentProperties(assetId, componentId);
    return {
      ...component,
      properties,
      commands: this.vehicleComponentCommands(assetId, componentId),
      property_count: properties.length
    };
  }

  vehicleComponentModels(assetId = "") {
    return this.vehicleComponentRows().map((c)=>this.vehicleComponentModel(assetId, c.component_id)).filter(Boolean);
  }

  vehicleOverviewMetricSlots(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const propDisplay = (key) => {
      const prop = this.semanticProperty(canonical, key);
      if (!prop) return { display:"", prop:null };
      if (prop.value === undefined || prop.value === null || String(prop.value).trim() === "") return { display:"", prop };
      return { display:this.formatValue(prop.value, prop.unit || "", key), prop };
    };

    const total = propDisplay("vehicle.range_total_km");
    const ev = propDisplay("vehicle.ev_range_km");
    const soc = propDisplay("vehicle.soc_pct");
    const currentEnergy = propDisplay("vehicle.current_energy_kwh");
    const batteryEnergy = propDisplay("vehicle.battery_energy_kwh");
    const energy = currentEnergy.display ? currentEnergy : batteryEnergy;

    const slots = [];
    if (total.display) slots.push({ label:"Range", display:total.display, value:total.display, resolved:true, available:true, property_key:"vehicle.range_total_km", prop:total.prop, source:"RHI_MOBILITY_CANONICAL_PROPERTY_V1" });
    if (ev.display && ev.display !== total.display) slots.push({ label:"Electric", display:ev.display, value:ev.display, resolved:true, available:true, property_key:"vehicle.ev_range_km", prop:ev.prop, source:"RHI_MOBILITY_CANONICAL_PROPERTY_V1" });
    const batteryDisplay = [soc.display, energy.display].filter(Boolean).join(" · ");
    if (batteryDisplay) slots.push({ label:"Battery", display:batteryDisplay, value:batteryDisplay, resolved:true, available:true, property_key:"vehicle.soc_pct", prop:soc.prop || energy.prop, source:"RHI_MOBILITY_CANONICAL_PROPERTY_V1" });
    return slots;
  }

  vehicleComponentDetailSections(assetId = "") {
    return this.v2ComponentDetailSections(assetId, "vehicle") || [];
  }


  chargerComponentContractRows(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const grouped = new Map();
    for (const row of this.v2PropertyRows(canonical)) {
      const componentId = String(row.component_id || "").trim();
      if (!componentId) continue;
      if (!grouped.has(componentId)) grouped.set(componentId,{ component_id:componentId, asset_id:canonical, properties:[] });
      grouped.get(componentId).properties.push(row);
    }
    return [...grouped.values()];
  }

  chargerComponentContractAvailable() {
    return this.v2PropertyRows("").some((row)=>String(row.asset_type || "").toLowerCase()==="charger" && !!row.component_id);
  }

  chargerComponentRows() {
    // R43.2.54 fail-closed: layout comes only from the published component contract.
    return this.chargerComponentContractRows();
  }

  chargerComponent(componentId = "") {
    const id = String(componentId || "").trim();
    return this.chargerComponentRows().find((c)=>String(c.component_id || c.card_id || "") === id) || null;
  }

  chargerComponentPropertyIndexEntities() { return []; }

  chargerComponentPropertyRows(assetId = "", componentId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const component = this.chargerComponent(componentId);
    if (!component?.property_index_entity) return [];
    return this.propertyRowsFromEntity(component.property_index_entity, canonical).map((row)=>({ ...row, component_id: component.component_id, component_display_name: component.display_name }));
  }

  chargerComponentCommands(assetId = "", componentId = "", sectionId = "") {
    // R43.2.54 product rule: charger_actions.commands is rendered exactly once in
    // the shared top Actions surface. Component contracts own layout/properties and
    // may not cause a second command rendering path.
    return [];
  }

  chargerFieldConfig(propertyKey = "", component = {}) {
    const key = String(propertyKey || "").trim();
    const rows = Array.isArray(component?.properties) ? component.properties : [];
    return rows.find((row)=>String(row?.property_key || "") === key) || {};
  }

  chargerPropertyRowForContract(prop = {}, component = {}) {
    const field = this.chargerFieldConfig(prop.property_key, component);
    const row = { ...prop };
    if (field.display_name || field.label) row.display_name = field.display_name || field.label;
    if (field.icon) row.icon = field.icon;
    if (field.render_mode) row.render_mode = field.render_mode;
    if (field.detail_level) row.detail_level = field.detail_level;
    return this.propertyOperationalRow(row);
  }

  chargerSectionDefinitions(component = {}) {
    const parsed = this.parseListValue(component.sections || []);
    if (parsed.length) return parsed.map((section) => {
      if (typeof section === "string") return { section_id:section, display_name:this.titleize(section.replace(/_/g," ")) };
      return {
        section_id: section.section_id || section.id || section.key || section.name || "details",
        display_name: section.display_name || section.title || section.label || this.titleize(String(section.section_id || section.id || section.key || "details").replace(/_/g," ")),
        ...section
      };
    });
    // A component may be a single-card layout without sub-sections. Keep every
    // property in that backend-owned component rather than inventing UX families.
    return [{ section_id:"__component__", display_name:"" }];
  }

  chargerComponentDetailSections(assetId = "") {
    return this.v2ComponentDetailSections(assetId, "charger") || [];
  }

  propertyIndexEntityForAsset(assetId = "") {
    return "";
  }

  v2PropertyRows(assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    return this._canonicalProperties.rows(canonical)
      .map((row)=>this.normalizePropertyRow(row))
      .filter(Boolean)
      .sort((a,b)=>
        String(a.asset_id || "").localeCompare(String(b.asset_id || "")) ||
        Number(a.display_order ?? 9999) - Number(b.display_order ?? 9999) ||
        String(a.property_key || "").localeCompare(String(b.property_key || ""))
      );
  }

  v2ComponentDetailSections(assetId = "", assetType = "") {
    const canonical = this.canonicalAssetId(assetId);
    const props = this.v2PropertyRows(canonical);
    if (!props.length) return null;

    const product = [];
    const engineering = [];
    const unplaced = [];
    for (const prop of props) {
      const visibility = String(prop.visibility || prop.ux_visibility || "").toLowerCase();
      if (visibility === "internal") continue;
      if (visibility === "engineering" || visibility === "diagnostics" || visibility === "diagnostics_only") {
        engineering.push(prop);
        continue;
      }
      const componentId = String(prop.component_id || "").trim();
      const sectionId = String(prop.section_id || "").trim();
      if (!componentId || !sectionId) {
        unplaced.push(prop);
        continue;
      }
      product.push(prop);
    }

    const sections = [];
    const groups = new Map();
    for (const prop of product) {
      const componentId = String(prop.component_id);
      if (!groups.has(componentId)) groups.set(componentId, new Map());
      const sectionId = String(prop.section_id);
      if (!groups.get(componentId).has(sectionId)) groups.get(componentId).set(sectionId, []);
      groups.get(componentId).get(sectionId).push(prop);
    }

    for (const [componentId, sectionMap] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))) {
      const rows = [];
      const multiSection = sectionMap.size > 1;
      for (const [sectionId, sectionProps] of [...sectionMap.entries()].sort(([a],[b])=>a.localeCompare(b))) {
        if (multiSection || !["overview","details","main"].includes(this.norm(sectionId))) {
          rows.push({ type:"subheader", label:this.titleize(sectionId.replace(/_/g," ")), value:"" });
        }
        for (const prop of sectionProps.sort((a,b)=>
          Number(a.display_order ?? 9999) - Number(b.display_order ?? 9999) ||
          String(a.property_key || "").localeCompare(String(b.property_key || ""))
        )) rows.push(this.propertyOperationalRow(prop));
      }
      sections.push({
        key:`v2-component-${componentId}`,
        title:this.titleize(componentId.replace(/_/g," ")),
        icon:componentId.includes("power") ? "mdi:flash" : componentId.includes("charging") ? "mdi:ev-station" : componentId.includes("security") ? "mdi:shield-car" : componentId.includes("battery") ? "mdi:battery" : "mdi:information-outline",
        header:`${rows.filter((row)=>row.type !== "subheader").length} fields`,
        rows,
        details:[]
      });
    }

    if (unplaced.length) {
      sections.push({
        key:"v2-layout-contract-gap",
        title:"Layout contract gap",
        icon:"mdi:alert-outline",
        header:`${unplaced.length} unplaced properties`,
        rows:[{ type:"readonly", icon:"mdi:alert-outline", label:"Component placement", value:"Contract gap" }],
        details:unplaced.map((prop)=>({
          label:String(prop.property_key || "Property"),
          value:`owner=${prop._source_entity_id || "RHI_MOBILITY_CANONICAL_PROPERTY_V1"}; missing component_id/section_id`
        }))
      });
    }

    if (engineering.length) {
      sections.push({
        key:"v2-engineering",
        title:"Engineering",
        icon:"mdi:wrench",
        header:`${engineering.length} diagnostics`,
        rows:[],
        details:engineering
          .sort((a,b)=>String(a.property_key || "").localeCompare(String(b.property_key || "")))
          .map((prop)=>({ label:this.propertyDisplayLabel(prop), value:`${this.propertyDisplayValue(prop)} · key=${prop.property_key}` }))
      });
    }
    return sections.filter((section)=>section.rows?.length || section.details?.length);
  }

  propertyRowsFromEntity(entityId = "", assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    const attrs = this.entity(entityId)?.attributes || {};
    const rows = [];

    // Transport normalization only: preserve the structural keys published by the
    // same property-index owner. In particular, keyed maps may omit asset_id and/or
    // property_key because those values are encoded in the map key. Losing those
    // keys made valid canonical charger fields disappear from UX in R22.12.11.29.
    const addRow = (rawRow, keyHint = "", assetHint = "") => {
      if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow)) return;
      const row = { ...rawRow, _source_entity_id: entityId };
      const hint = String(keyHint || "").trim();
      const hintedAsset = String(assetHint || "").trim();
      if (hint.includes(":")) {
        const splitAt = hint.indexOf(":");
        const keyAsset = hint.slice(0, splitAt);
        const keyProperty = hint.slice(splitAt + 1);
        if (!row.asset_id && keyAsset) row.asset_id = keyAsset;
        if (!row.property_key && !row.normalized_property && !row.fact_type && keyProperty) row.property_key = keyProperty;
        row._compound_key = row._compound_key || hint;
      } else {
        if (!row.asset_id && hintedAsset) row.asset_id = hintedAsset;
        if (!row.property_key && !row.normalized_property && !row.fact_type && hint && hint.includes(".")) row.property_key = hint;
      }
      rows.push(row);
    };

    const collectPropertyContainer = (value, assetHint = "") => {
      const parsed = this.parseJsonValue(value, value);
      if (Array.isArray(parsed)) {
        for (const row of parsed) addRow(row, "", assetHint);
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      for (const [key, row] of Object.entries(parsed)) {
        if (Array.isArray(row)) {
          for (const item of row) addRow(item, key, assetHint);
        } else if (row && typeof row === "object") {
          // Nested asset map: { charger_x: { charger.power_kw: {...} } }
          if (!row.asset_id && !row.property_key && !row.normalized_property && !row.fact_type && !key.includes(":")) {
            const nestedEntries = Object.entries(row);
            const looksLikeNestedPropertyMap = nestedEntries.some(([nestedKey, nestedRow]) => nestedRow && typeof nestedRow === "object" && (nestedKey.includes(".") || nestedKey.includes(":")));
            if (looksLikeNestedPropertyMap) {
              collectPropertyContainer(row, key.startsWith("vehicle_") || key.startsWith("charger_") || key.startsWith("person_") ? key : assetHint);
              continue;
            }
          }
          addRow(row, key, assetHint);
        }
      }
    };

    for (const attrName of ["properties", "properties_json", "property_index", "property_index_json", "rows", "rows_json"]) {
      collectPropertyContainer(attrs[attrName]);
    }

    // Some property-index schemas wrap the exact property rows per asset. Only
    // explicit nested property containers are consumed; top-level asset scalars are
    // not reinterpreted as properties.
    for (const attrName of ["assets"]) {
      const assets = this.parseJsonValue(attrs[attrName], attrs[attrName] || null);
      const assetRows = Array.isArray(assets) ? assets : (assets && typeof assets === "object" ? Object.values(assets) : []);
      for (const asset of assetRows) {
        if (!asset || typeof asset !== "object") continue;
        const assetKey = String(asset.asset_id || "").trim();
        for (const nestedName of ["properties", "properties_json", "property_index", "property_index_json", "rows", "rows_json", "source_properties"]) {
          collectPropertyContainer(asset[nestedName], assetKey);
        }
      }
    }

    const seen = new Set();
    return rows.map((r) => this.normalizePropertyRow(r)).filter(Boolean).filter((r) => {
      if (canonical && String(r.asset_id || "") !== String(canonical)) return false;
      const key = `${r.asset_id}:${r.property_key}:${String(r.value)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  propertyRows(assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    const cacheKey = `propertyRows:${canonical || "all"}`;
    if (this._memo.has(cacheKey)) return this._memo.get(cacheKey);
    const rows = this.v2PropertyRows(canonical);
    this._memo.set(cacheKey, rows);
    return rows;
  }

  propertyControlModel(assetId = "", propertyKey = "") {
    const canonical = this.canonicalAssetId(assetId);
    const prop = this.propertyByCompoundKey(canonical, propertyKey);
    if (!prop) return { asset_id: canonical, property_key: propertyKey, resolved: false, writable: false, reason: "property_contract_gap" };
    const min = Number(prop.min ?? prop.validation?.min);
    const max = Number(prop.max ?? prop.validation?.max);
    const step = Number(prop.step ?? prop.validation?.step);
    const value = Number(prop.value);
    return {
      asset_id: canonical, property_key: prop.property_key, prop, resolved: true,
      value: Number.isFinite(value) ? value : prop.value, unit: prop.unit || "",
      min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null,
      step: Number.isFinite(step) && step > 0 ? step : null,
      writable: this.isWritableProperty(prop),
      reason: prop.write_blocked_reason || (this.isWritableProperty(prop) ? "" : "editing_not_available"),
      write_target_entity: prop.write_target_entity || "",
      write_service_domain: prop.write_service_domain || "",
      write_service_action: prop.write_service_action || "",
      authority_entity: prop._source_entity_id || ""
    };
  }

  vehicleChargePowerControlModel(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    // R43.2.54: the vehicle property is the backend-owned delegated proxy. UX
    // reads/writes that exact vehicle property and never resolves a charger-side
    // property as a frontend authority fallback.
    const delegated = this.propertyControlModel(canonical, "vehicle.requested_charge_power_kw");
    return { ...delegated, consumer_asset_id: canonical, authority_asset_id: canonical, delegated: true };
  }

  normalizedPropertyControlValue(model = {}, value = null) {
    let next = Number(value);
    if (!Number.isFinite(next)) return null;
    if (Number.isFinite(model.min)) next = Math.max(model.min, next);
    if (Number.isFinite(model.max)) next = Math.min(model.max, next);
    if (Number.isFinite(model.step) && model.step > 0 && Number.isFinite(model.min)) {
      next = model.min + Math.round((next - model.min) / model.step) * model.step;
      next = Number(next.toFixed(6));
    }
    return next;
  }

  writePropertyControl(model = {}, value = null) {
    if (!model?.resolved || !model?.prop || !model.writable) return false;
    const next = this.normalizedPropertyControlValue(model, value);
    if (next === null) return false;
    return this.writePropertyValue(model.prop, next);
  }

  async writePropertyControlAsync(model = {}, value = null) {
    if (!model?.resolved || !model?.prop || !model.writable) return false;
    const next = this.normalizedPropertyControlValue(model, value);
    if (next === null) return false;
    return this.writePropertyValueAsync(model.prop, next, {
      asset_id:model.asset_id || model.prop?.asset_id || "",
      property_key:model.property_key || model.prop?.property_key || ""
    });
  }

  v2SemanticProperty(assetId = "", propertyKey = "") {
    const canonical = this.canonicalAssetId(assetId);
    const wanted = String(propertyKey || "").trim();
    if (!canonical || !wanted) return null;
    const row = this._canonicalProperties.row(canonical, wanted);
    return row ? this.normalizePropertyRow(row) : null;
  }

  semanticProperty(assetId = "", propertyKey = "") {
    return this.v2SemanticProperty(assetId, propertyKey);
  }

  propertyByCompoundKey(assetId = "", propertyKey = "") {
    return this.v2SemanticProperty(assetId, propertyKey);
  }

  normalizePropertyRow(row = {}) {
    if (!row || typeof row !== "object") return null;
    const asset_id = String(row.asset_id || "").trim();
    const asset_type = String(row.asset_type || row.logical_object_class || row.object_class || "").trim();
    const property_key = String(row.property_key || "").trim();
    if (!asset_id || !asset_type || !property_key) return null;
    return {
      ...row,
      asset_id,
      asset_type,
      property_key,
      fact_type:String(row.fact_type || ""),
      normalized_property:property_key,
      value:row.value,
      unit:row.unit ?? row.unit_of_measurement ?? "",
      quality:String(row.quality || ""),
      health:String(row.health || row.quality || ""),
      access:String(row.access || ""),
      persistence:String(row.persistence || ""),
      editable:this.contractBool(row.editable, false),
      editor:String(row.editor || row.editor_type || ""),
      validation:this.parseJsonValue(row.validation, row.validation || {}),
      choices:this.parseJsonValue(row.choices, row.choices || null),
      options:this.parseJsonValue(row.options, row.options || null),
      choice_source:String(row.choice_source || ""),
      value_field:String(row.value_field || ""),
      label_field:String(row.label_field || ""),
      secondary_label_field:String(row.secondary_label_field || ""),
      allow_none:this.contractBool(row.allow_none, false),
      none_value:row.none_value ?? "",
      write_supported:this.contractBool(row.write_supported, false),
      write_binding_type:String(row.write_binding_type || row.editor || ""),
      write_service_domain:String(row.write_service_domain || ""),
      write_service_action:String(row.write_service_action || ""),
      write_target_entity:String(row.write_target_entity || ""),
      write_service_data:this.parseJsonValue(row.write_service_data, row.write_service_data || {}),
      write_value_field:String(row.write_value_field || ""),
      write_command:String(row.write_command || ""),
      family:String(row.family || row.presentation_family || ""),
      group:String(row.group || row.section_id || ""),
      parent:String(row.parent || ""),
      parent_property:String(row.parent_property || ""),
      detail_level:String(row.detail_level || row.visibility || ""),
      logical_entity:String(row.logical_entity || ""),
      display_order:row.display_order ?? 999,
      display_name:String(row.display_name || row.friendly_name || ""),
      description:String(row.description || ""),
      icon:String(row.icon || ""),
      semantic_value_type:String(row.semantic_value_type || ""),
      value_type:String(row.value_type || ""),
      importance:String(row.importance || "")
    };
  }

  factRows(assetId = "") {
    // R22.8: runtime values come only from typed property indexes.
    // Legacy mobility_fact_index and embedded vehicle/charger facts are not consumed.
    return this.propertyRows(assetId);
  }

  relationshipRows(assetId = "") {
    const canonical = assetId ? this.canonicalAssetId(assetId) : "";
    // Project only backend-published relationship truth; never infer a
    // physical connection from assignment or a Home Assistant entity name.
    const rows=(this.mobilityExperienceV2()?.vehicles || []).flatMap((vehicle)=>{
      const vehicleId=String(vehicle?.asset_id || "");
      const relation=vehicle?.charging_relationship;
      if (!vehicleId || !relation || typeof relation !== "object") return [];
      return [
        ["configured",relation.configured_charger_id],
        ["effective",relation.effective_charger_id],
        ["physical",relation.observed_identity_proven === true ? relation.physically_connected_charger_id : null]
      ].filter(([,chargerId])=>typeof chargerId === "string" && chargerId.trim())
        .map(([kind,chargerId])=>({
          source_asset_id:vehicleId, target_asset_id:chargerId,
          relationship_type:kind === "physical" ? "physically_connected" : kind,
          observed_identity_proven:kind === "physical",
          relationship_status:relation.relationship_status || "UNKNOWN",
          authority:"MOBILITY_EXPERIENCE_V2"
        }));
    });
    return rows.filter((row)=>!canonical || row.source_asset_id===canonical || row.target_asset_id===canonical);
  }

  relationshipFor(assetId) {
    const canonical=this.canonicalAssetId(assetId);
    if (canonical.startsWith("vehicle_")) return this.vehicleChargerRelationship(canonical);
    if (!canonical.startsWith("charger_")) return { assigned:"none", connected:"none", effective:"none", selected:"none", row:null };
    // The backend experience publisher owns the relationship resolution.
    // Do not infer physical connection from a configured or effective assignment.
    const relations=(this.mobilityExperienceV2()?.vehicles || [])
      .flatMap((vehicle)=>{
        const vehicleId=String(vehicle?.asset_id || "");
        const relation=vehicle?.charging_relationship;
        if (!vehicleId.startsWith("vehicle_") || !relation || typeof relation !== "object") return [];
        if (relation.vehicle_id && String(relation.vehicle_id)!==vehicleId) return [];
        return [{...relation,vehicle_id:vehicleId}];
      });
    const configured=relations.filter((row)=>String(row.configured_charger_id || "")===canonical);
    const effectiveRows=relations.filter((row)=>String(row.effective_charger_id || "")===canonical);
    const physical=relations.filter((row)=>row.observed_identity_proven===true && String(row.physically_connected_charger_id || "")===canonical);
    const one=(rows)=>rows.length===1 ? rows[0].vehicle_id : "none";
    const selected=one(configured), effective=one(effectiveRows), connected=one(physical);
    const conflict=[configured,effectiveRows,physical].some((rows)=>rows.length>1);
    return {
      assigned:selected, connected, effective, selected,
      assigned_vehicle:selected, connected_vehicle:connected,
      effective_vehicle:effective, selected_vehicle:selected,
      relationship_resolution:conflict ? "CONFLICT" : "MOBILITY_EXPERIENCE_V2",
      confidence:physical.length===1 ? "proven" : "",
      row:physical[0] || effectiveRows[0] || configured[0] || null,
      connected_row:physical.length===1 ? physical[0] : null,
      effective_row:effectiveRows.length===1 ? effectiveRows[0] : null,
      selected_row:configured.length===1 ? configured[0] : null,
      _authority:"MOBILITY_EXPERIENCE_V2"
    };
  }

  commandsFor(assetId) {
    const canonical = this.canonicalAssetId(assetId);
    // MOBILITY_COMMAND_V2 is the sole product command authority.
    return this.commandRegistry(canonical)
      .filter((c) => c && String(c.asset_id || "") === String(canonical))
      .filter((c) => this.contractBool(c.frontend_allowed, true) === true)
      .map((c) => this.withCommandEnumOptions(c))
      .sort((a,b)=>(Number(a.sort_order ?? 999)-Number(b.sort_order ?? 999)) || String(a.command_key || a.label || "").localeCompare(String(b.command_key || b.label || "")));
  }

  withCommandEnumOptions(command) {
    if (!command || !command.parameter_schema || typeof command.parameter_schema !== "object") return command;
    const out = { ...command, enum_options: {} };
    for (const [paramName, schema] of Object.entries(command.parameter_schema || {})) {
      if (!schema || typeof schema !== "object" || String(schema.type || "").toLowerCase() !== "enum") continue;
      const options = this.commandEnumOptions(schema);
      out.enum_options[paramName] = options;
    }
    return out;
  }

  commandEnumOptions(schema = {}) {
    const source = String(schema.source || "").trim();
    if (!source) return [];
    const valueField = schema.value_field || "value";
    const labelField = schema.label_field || "label";
    const rows = this.canonicalRowsFromAttrs(source, ["profiles", "chargers", "assets", "rows", "options"], `enum:${source}`);
    return rows
      .map((row) => ({
        value: row?.[valueField] ?? row?.asset_id ?? row?.profile_id ?? row?.id ?? "",
        label: row?.[labelField] ?? row?.display_name ?? row?.short_name ?? row?.name ?? row?.asset_id ?? row?.profile_id ?? ""
      }))
      .filter((o) => String(o.value || "").trim())
      .sort((a,b)=>String(a.label || a.value).localeCompare(String(b.label || b.value)));
  }

  commandFamily(command) {
    return this.resolvedCommandFamily(command);
  }

  commandsByFamily(assetId) {
    const grouped = new Map();
    this.commandsFor(assetId)
      .filter((cmd) => cmd && cmd.frontend_allowed !== false)
      .forEach((cmd) => {
        const family = this.commandFamily(cmd) || `__${String(cmd.command_id || cmd.label || "command").toLowerCase()}`;
        if (!grouped.has(family)) grouped.set(family, []);
        grouped.get(family).push(this.completeCommandIntent(cmd, assetId));
      });
    for (const [family, rows] of grouped.entries()) {
      grouped.set(family, rows.filter(Boolean).sort((a,b)=>(Number(a.sort_order ?? 999)-Number(b.sort_order ?? 999)) || String(a.label || "").localeCompare(String(b.label || ""))));
    }
    return grouped;
  }

  commandFromFamily(assetId, family, orderedIds = []) {
    const rows = this.commandsByFamily(assetId).get(String(family || "").toLowerCase()) || [];
    if (!rows.length) return null;
    for (const id of orderedIds) {
      const wanted = this.norm(id);
      const found = rows.find((cmd) => this.norm(cmd.command_id) === wanted);
      if (found) return found;
    }
    return rows.find((cmd) => this.commandUsable(cmd)) || rows[0] || null;
  }

  commandActionRank(command = {}) {
    const id = String(command.command_key || command.command_id || command.label || "").toLowerCase();
    const family = this.resolvedCommandFamily(command);
    const group = String(command.command_group || "").toLowerCase();
    const role = String(command.command_role || "").toLowerCase();
    const familyRank = { charging: 10, climate: 20, security: 30, access: 30, maintenance: 70, diagnostics: 75, vehicle: 80, charger: 80, overview: 90 };
    let actionRank = 50;
    if (id.includes("stop") || role.includes("stop")) actionRank = 10;
    else if (id.includes("pause")) actionRank = 15;
    else if (id.includes("start") || id.includes("force") || id.includes("resume")) actionRank = 20;
    else if (id.includes("toggle")) actionRank = 30;
    else if (id.includes("unlock")) actionRank = 35;
    else if (id.includes("lock")) actionRank = 40;
    else if (id.includes("restart")) actionRank = 70;
    else if (id.includes("identify") || id.includes("locate")) actionRank = 75;
    else if (id.includes("availability")) actionRank = 85;
    return [familyRank[family] ?? 60, actionRank, Number(command.sort_order ?? 999), group, id].join("|");
  }

  commandInteraction(command = {}) {
    const schema = command?.parameter_schema && typeof command.parameter_schema === "object" ? command.parameter_schema : {};
    const parameters = Object.entries(schema).map(([name, definition]) => ({
      name,
      ...(definition && typeof definition === "object" ? definition : {}),
      required: this.contractBool(definition?.required, false) === true
    }));
    const required = parameters.filter((parameter) => parameter.required);
    if (!required.length) return { mode: "immediate", parameters, required, supported: true, reason: "" };
    const supported = required.every((parameter) => {
      const type = String(parameter.type || "").toLowerCase();
      if (type !== "enum") return false;
      return this.commandEnumOptions(parameter).length > 0 || (Array.isArray(parameter.values) && parameter.values.length > 0);
    });
    return {
      mode: "form",
      parameters,
      required,
      supported,
      reason: supported ? "" : "Required command parameters are not supported by this control surface"
    };
  }

  commandSlotContract(assetId = "") { return null; }

  commandSlotRowsForSurface(assetId = "", surface = "quick_actions") { return null; }

  commandsForSurface(assetId = "", surface = "operational") {
    const canonical = this.canonicalAssetId(assetId);
    const rows = this.commandV2RowsForSurface(canonical, surface);
    if (rows === null) return [];
    return rows
      .map((command)=>this.completeCommandIntent(command, canonical))
      .filter((command)=>command && this.contractBool(command.frontend_allowed, true) === true);
  }



  controlsFor(assetId = "") {
    // Public typed model: write controls are exposed on property rows as write_command.
    return [];
  }

  controlEntity(assetId, field, fallback = "") {
    const canonical = this.canonicalAssetId(assetId);
    const prop = this.propertyRows(canonical).find((p) => {
      const ft = String(p.fact_type || "");
      const pk = String(p.property_key || "");
      return ft === String(field) || pk === String(field) || pk.endsWith(`.${field}`);
    });
    if (prop?.write_command) return prop.write_command;
    const row = this.controlsFor(canonical).find((c) => String(c.field || c.control_id || c.id || "") === String(field));
    return row?.entity_id || row?.value_entity || fallback;
  }

  factTypeAliases(field, assetId = "") {
    return this.propertyKeyCandidates(assetId, field);
  }

  factContractRow(assetId, field) {
    return this.semanticProperty(assetId, field);
  }


  factEntity(assetId, field) {
    const canonicalFact = this.factContractRow(assetId, field);
    return canonicalFact?.entity_id || "";
  }


  factContractValue(assetId, field, fallback = "") {
    const canonicalFact = this.factContractRow(assetId, field);
    if (!canonicalFact) return fallback;
    const value = canonicalFact.value;
    if (value === undefined || value === null) return fallback;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return String(value);
    const s = String(value).trim();
    if (s === "") return fallback;
    const lower = s.toLowerCase();
    // A published property row is meaningful even when the backend explicitly says
    // unknown/unavailable/degraded. Do not hide it as if the contract row was missing.
    if (["unknown", "unavailable", "none", "null", "undefined", "nan", "invalid"].includes(lower)) {
      if (fallback === "—" || fallback === "") return "Unknown";
      return lower === "none" ? "None" : "Unknown";
    }
    return s;
  }


  factValue(assetId, field, fallback = "") {
    return this.factContractValue(assetId, field, fallback);
  }


  factEntityExists(assetId, field) {
    return !!this.factContractRow(assetId, field);
  }


  displayFactValue(assetId, field, fallback = "Not available") {
    const row = this.factContractRow(assetId, field);
    if (!row) return fallback;
    return this.factContractValue(assetId, field, fallback);
  }


  numberValue(entityId) {
    const raw = this.state(entityId, "");
    if (raw === "") return null;
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  factNumber(assetId, field) {
    const v = this.factContractValue(assetId, field, "");
    if (v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }


  completeCommandIntent(command, assetId = "") {
    if (!command) return null;
    const completed = { ...command };
    const canonical = assetId ? this.canonicalAssetId(assetId) : (completed.asset_id || "");
    if (!completed.asset_id && canonical) completed.asset_id = canonical;
    if (!completed.parameter_schema && typeof completed.parameter_schema_json === "string" && completed.parameter_schema_json.trim()) {
      const parsed = this.parseJsonValue(completed.parameter_schema_json, null);
      if (parsed && typeof parsed === "object") completed.parameter_schema = parsed;
    }
    return completed;
  }

  selectCommand(assetId, ids = []) {
    const canonical = this.canonicalAssetId(assetId);
    const commands = this.commandsFor(canonical).filter((c) => c.frontend_allowed !== false);
    for (const wanted of ids) {
      const normWanted = this.norm(wanted);
      const found = commands.find((cmd) => {
        const parts = [cmd.command_id, cmd.command_key, cmd.command_group, cmd.command_role, cmd.current_state_property, cmd.label].filter(Boolean).map((v)=>this.norm(v));
        return parts.includes(normWanted) || parts.some((p)=>p.endsWith(normWanted));
      });
      if (found) return this.completeCommandIntent(found, canonical);
    }
    return null;
  }

  vehicleCommandSafetyState(command) {
    // R41.5: vehicle charging proxy availability is owned by the backend command row.
    // UX must not locally disable vehicle charging actions by inspecting relationships.
    // If backend cannot bind the proxy, it must publish frontend_allowed=false or execution_allowed=false.
    return { disabled: false, reason: "" };
  }

  commandUsable(command) {
    if (!command || this.contractBool(command.frontend_allowed, true) === false) return false;
    return this.contractBool(command.execution_allowed, false) === true;
  }

  commandState(command) {
    // MOBILITY_COMMAND_V2 is the sole product command authority.
    const status = command?.execution_status || command?.ui_state || command?.effective_availability || "";
    const reason = command?.blocked_reason || command?.execution_reason || command?.disabled_reason || "";
    const lower = String(status).toLowerCase();
    const frontendHidden = !command || this.contractBool(command.frontend_allowed, true) === false;
    const executionAllowed = this.contractBool(command?.execution_allowed, false) === true;
    const hasServiceCall = !!(command?.service_domain && command?.service_action);
    const missingExecutor = executionAllowed && !hasServiceCall;
    const unsupportedInteraction = command?.interaction_mode === "form" && command?.interaction_supported === false;
    return {
      disabled: frontendHidden || !executionAllowed || missingExecutor || unsupportedInteraction,
      busy: lower.includes("running") || lower.includes("pending") || lower.includes("queued") || lower.includes("in_progress"),
      failed: lower.includes("failed") || lower.includes("blocked") || lower.includes("unavailable") || lower.includes("error"),
      status,
      reason: reason || (unsupportedInteraction ? (command?.interaction_reason || "Required command parameters are not supported") : (missingExecutor ? "No executable producer command boundary available" : (!executionAllowed ? "Execution not allowed by command contract" : "")))
    };
  }

  commandVisibilityReport(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    return this.commandRegistry(canonical).map((cmd) => {
      const st = this.commandState(cmd);
      const hidden = cmd.frontend_allowed === false ? "frontend_allowed=false" : (this.isConfigurationCommand(cmd) ? "configuration-setting-command" : "visible");
      return {
        asset_id: cmd.asset_id || canonical,
        command_key: cmd.command_key || cmd.command_id || "",
        family: cmd.command_family || "",
        frontend_allowed: String(cmd.frontend_allowed !== false),
        execution_allowed: String(cmd.execution_allowed === true),
        render_decision: hidden === "visible" ? (st.disabled ? "visible_disabled" : "visible_enabled") : "hidden",
        reason: hidden === "visible" ? (st.reason || cmd.execution_reason || "") : hidden
      };
    });
  }

  normalizeRuntimeChargingStatus(value) {
    const s = String(value || "").trim();
    const l = s.toLowerCase();
    if (!s || ["unknown", "unavailable", "none", "null", "undefined", "empty_snapshots", "invalid"].includes(l)) return "Unknown";
    if (l === "off") return "Off";
    if (l === "on") return "On";
    if (l.includes("charging")) return "Charging";
    if (l.includes("connected") || l.includes("plugged")) return "Connected";
    return s;
  }

  chargingActive(status, power = null) {
    const l = String(status || "").toLowerCase();
    return l === "charging" || l.includes("charging now") || (power !== null && Number.isFinite(Number(power)) && Math.abs(Number(power)) > 0.05);
  }

  canonicalPropertyValue(assetId = "", propertyKey = "") {
    const canonical = this.canonicalAssetId(assetId);
    const row = this.propertyByCompoundKey(canonical, propertyKey);
    if (!row) return { resolved:false, value:"", row:null, reason:"information_not_available" };
    const value = this.cleanValue(row.value, "");
    if (value === "" || value === null || value === undefined) return { resolved:false, value:"", row, reason:"value_not_available" };
    return { resolved:true, value:String(value).trim(), row, reason:"" };
  }

  canonicalPropertyDisplay(assetId = "", propertyKey = "", fallback = "—") {
    const prop = this.canonicalPropertyValue(assetId, propertyKey);
    if (!prop.resolved) return fallback;
    return this.formatValue(prop.value, prop.row?.unit || "", propertyKey);
  }

  canonicalChargerPropertyValue(assetId = "", propertyKey = "") {
    return this.canonicalPropertyValue(assetId, propertyKey);
  }

  canonicalChargerPropertyDisplay(assetId = "", propertyKey = "", fallback = "—") {
    // Exact-owner display helper. This intentionally does not use displayFactValue()
    // because that resolver supports historical aliases for non-cutover surfaces.
    const prop = this.canonicalChargerPropertyValue(assetId, propertyKey);
    if (!prop.resolved) return fallback;
    const row = prop.row || {};
    return this.formatValue(prop.value, row.unit || "", propertyKey);
  }

  chargerProductSnapshot(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const cacheKey = `chargerProductSnapshot:${canonical}`;
    if (this._memo.has(cacheKey)) return this._memo.get(cacheKey);
    const exact = (propertyKey) => this.canonicalChargerPropertyValue(canonical, propertyKey);
    const operating = exact("charger.operating_state");
    const connection = exact("charger.connection_state");
    const power = exact("charger.power_kw");
    const health = exact("charger.health");
    const healthReason = exact("charger.health_reason");
    const relationship = this.relationshipFor(canonical);
    const connectedRaw = String(relationship?.connected_vehicle || relationship?.connected || "").trim();
    const hasConnectedVehicle = !!connectedRaw && !["none", "unknown", "unavailable", "null", "undefined", "—"].includes(connectedRaw.toLowerCase());
    const vehicleId = hasConnectedVehicle ? this.canonicalAssetId(connectedRaw.startsWith("vehicle_") ? connectedRaw : `vehicle_${connectedRaw.replace(/^vehicle_/, "")}`) : "";
    const vehicleEntry = vehicleId ? (this.vehicleById(vehicleId) || this.assetById(vehicleId)) : null;
    const connectionRaw = connection.resolved ? String(connection.value).trim().toLowerCase() : "";
    const connectionDisplay = !connection.resolved ? "—" : (["connected", "asset_connected"].includes(connectionRaw) ? "Connected" : (["disconnected", "no_asset_connected"].includes(connectionRaw) ? "Disconnected" : this.titleize(connection.value)));
    const healthDisplay = health.resolved ? this.titleize(health.value) : "—";
    const reasonDisplay = healthReason.resolved && !["none", "ok", ""].includes(String(healthReason.value || "").toLowerCase()) ? this.titleize(healthReason.value) : "";
    const snapshot = {
      asset_id: canonical,
      operating: { ...operating, display: operating.resolved ? this.chargerOperatingStateDisplay(operating.value) : "—" },
      connection: { ...connection, display: connectionDisplay },
      power: { ...power, display: power.resolved ? this.formatValue(power.value, power.row?.unit || "kW", "charger.power_kw") : "—" },
      health: { ...health, display: healthDisplay, reason: reasonDisplay, reason_resolved: healthReason.resolved },
      connected_vehicle: { resolved: hasConnectedVehicle, asset_id: vehicleId, display: hasConnectedVehicle ? (vehicleEntry?.display_name || this.vehicleLabel(vehicleId)) : "—", relationship }
    };
    this._memo.set(cacheKey, snapshot);
    return snapshot;
  }


  chargerOperatingStateDisplay(value = "") {
    const raw = String(value || "").trim();
    const state = raw.toLowerCase();
    const labels = {
      idle:"Idle",
      stopped:"Stopped",
      running:"Charging",
      suspended:"Suspended",
      preparing:"Preparing",
      fault:"Fault",
      unknown:"Unknown"
    };
    return labels[state] || this.titleize(raw);
  }

  chargerOperationalStatus(assetId = "") {
    return this.chargerProductSnapshot(assetId).operating.display;
  }

  chargerConnectionState(assetId = "") {
    return this.chargerProductSnapshot(assetId).connection.display;
  }

  chargerConnectedVehicleLabel(assetId = "") {
    return this.chargerProductSnapshot(assetId).connected_vehicle.display;
  }

  physicalVehicleForCharger(assetId = "") {
    const connected = this.chargerProductSnapshot(assetId).connected_vehicle;
    if (!connected.resolved) return { assetId:"", displayName:"", detailRoute:"" };
    const entry = this.vehicleById(connected.asset_id) || this.assetById(connected.asset_id);
    return { assetId:connected.asset_id, displayName:connected.display, detailRoute:this.assetDetailRoute(entry || connected.asset_id) };
  }

  chargerHealthSummary(assetId = "") {
    const health = this.chargerProductSnapshot(assetId).health;
    return { value:health.display, reason:health.reason, resolved:health.resolved };
  }

  chargerCanonicalStatusTiles(assetId = "", vehicleTile = {}) {
    const snapshot = this.chargerProductSnapshot(assetId);
    const statusValue = snapshot.operating.display;
    const connectionValue = snapshot.connection.display;
    const connectedVehicle = snapshot.connected_vehicle.display;
    return [
      { label:"Status", value:statusValue, subvalue:snapshot.operating.resolved ? "Canonical operating state" : snapshot.operating.reason, icon:"mdi:ev-station", tone: !snapshot.operating.resolved ? "neutral" : (this.chargerStatusToneLabel(statusValue) === "red" ? "error" : this.chargerStatusToneLabel(statusValue) === "amber" ? "attention" : "neutral") },
      { label:"Connection", value:connectionValue, subvalue:snapshot.connection.resolved ? "Physical connection" : snapshot.connection.reason, icon:"mdi:ev-plug-type2", tone: connectionValue === "Connected" ? "active" : "neutral" },
      { label:"Power", value:snapshot.power.display, subvalue:snapshot.power.resolved ? "Actual canonical power" : snapshot.power.reason, icon:"mdi:flash", tone: snapshot.power.resolved && Number(snapshot.power.value) > 0.05 ? "active" : "neutral" },
      { label:"Vehicle", value:connectedVehicle === "—" ? "No vehicle connected" : connectedVehicle, subvalue:snapshot.connected_vehicle.resolved ? "Physical relationship" : "No physical vehicle relationship", icon:"mdi:car-electric", tone:snapshot.connected_vehicle.resolved ? "active" : "neutral", detailRoute:snapshot.connected_vehicle.resolved ? (vehicleTile.detailRoute || "") : "", detailTitle:vehicleTile.detailTitle || "Open vehicle details" },
      { label:"Health", value:snapshot.health.display, subvalue:snapshot.health.reason, icon:"mdi:shield-check-outline", tone:snapshot.health.resolved && String(snapshot.health.display).toLowerCase() === "ok" ? "active" : (snapshot.health.resolved ? "attention" : "neutral") }
    ];
  }

  chargerStatusToneLabel(value = "") {
    const l = String(value || "").toLowerCase();
    if (l.includes("running") || l.includes("charging")) return "green";
    if (["idle", "stopped", "suspended"].some((s)=>l.includes(s))) return "green";
    if (l.includes("fault") || l.includes("error")) return "red";
    if (l.includes("unavailable") || l.includes("unknown") || l === "—") return "amber";
    return "green";
  }


  relatedVehicleForCharger(assetId = "") {
    const canonical = this.canonicalAssetId(assetId);
    const rel = this.relationshipFor(canonical);
    const isReal = (value) => {
      const v = String(value || "").trim();
      return !!v && !["none", "unknown", "unavailable", "null", "undefined", "—"].includes(v.toLowerCase());
    };
    // Navigation may use the effective/selected relationship when physically disconnected,
    // but the displayed connection badge/connected-vehicle pill never does.
    const raw = [rel.connected_vehicle, rel.effective_vehicle, rel.assigned_vehicle, rel.connected, rel.effective, rel.assigned].find(isReal) || "";
    const vehicleId = raw ? this.canonicalAssetId(String(raw).startsWith("vehicle_") ? raw : `vehicle_${String(raw).replace(/^vehicle_/, "")}`) : "";
    const entry = vehicleId ? (this.vehicleById(vehicleId) || this.assetById(vehicleId)) : null;
    const displayName = entry?.display_name || (vehicleId ? this.vehicleLabel(vehicleId) : "");
    const detailRoute = vehicleId ? this.assetDetailRoute(entry || vehicleId) : "";
    return { assetId: vehicleId, displayName, detailRoute };
  }

  addRelatedAssetDetailLinks(sections = [], context = {}) {
    const chargerRoute = String(context.chargerDetailRoute || "");
    const chargerDisplay = String(context.chargerDisplay || "");
    const vehicleRoute = String(context.vehicleDetailRoute || "");
    const vehicleDisplay = String(context.vehicleDisplay || "");
    const decorateRow = (row) => {
      if (!row || typeof row !== "object" || row.detailRoute) return row;
      const label = String(row.label || "").toLowerCase();
      const value = String(row.value || "").trim();
      const isMissing = !value || ["—", "none", "unknown", "unavailable", "not available"].includes(value.toLowerCase());
      if (isMissing) return row;
      if (chargerRoute && (label.includes("active charger") || label.includes("connected charger") || label === "charger" || label.includes("effective charger"))) {
        return { ...row, detailRoute: chargerRoute, detailTitle: `Open ${chargerDisplay || "charger"} details` };
      }
      if (vehicleRoute && (label.includes("active vehicle") || label.includes("connected vehicle") || label === "vehicle" || label.includes("effective vehicle"))) {
        return { ...row, detailRoute: vehicleRoute, detailTitle: `Open ${vehicleDisplay || "vehicle"} details` };
      }
      return row;
    };
    return (sections || []).map((section) => section && typeof section === "object" ? {
      ...section,
      rows: (section.rows || []).map(decorateRow)
    } : section);
  }

  commandActionsFor(assetId, surface = "operational") {
    return this.commandsForSurface(assetId, surface);
  }

  liveChargerInfo(chargerAssetOrId) {
    const assetId = this.canonicalAssetId(typeof chargerAssetOrId === "string" ? chargerAssetOrId : chargerAssetOrId?.asset_id || "");
    if (!assetId) return { active:false, status:"—", power:null, current:null, evidence:"contract_gap" };
    const snapshot = this.chargerProductSnapshot(assetId);
    const current = this.canonicalChargerPropertyValue(assetId, "charger.actual_current_a");
    const power = snapshot.power.resolved && Number.isFinite(Number(snapshot.power.value)) ? Number(snapshot.power.value) : null;
    const operatingState = snapshot.operating.resolved ? String(snapshot.operating.value).toLowerCase() : "";
    return {
      active: operatingState === "running",
      status: snapshot.operating.display,
      power,
      current: current.resolved && Number.isFinite(Number(current.value)) ? Number(current.value) : null,
      evidence: snapshot.operating.resolved || snapshot.power.resolved ? "canonical_charger_property_index" : "contract_gap"
    };
  }

  vehicleChargePowerControl(vehicleAssetOrId) {
    const assetId = typeof vehicleAssetOrId === "string" ? this.canonicalAssetId(vehicleAssetOrId) : this.canonicalAssetId(vehicleAssetOrId?.asset_id || "");
    if (!assetId) return { value: null, display: "—", unit: "kW", property: null, entity: "", intent: "", visible: false, executable: false };
    const model = this.vehicleChargePowerControlModel(assetId);
    const prop = model?.prop || null;
    const value = model?.resolved && Number.isFinite(Number(model.value)) ? Number(model.value) : null;
    const display = value === null ? "—" : this.formatValue(Number.isInteger(value) ? String(value) : String(Number(value).toFixed(2)).replace(/\.00$/, ""), model?.unit || "kW", prop?.property_key || "charger.requested_charge_power_kw");
    return {
      value, display, unit: model?.unit || "kW", property: prop,
      entity: model?.write_target_entity || "", intent: "", visible: !!model?.resolved,
      executable: !!model?.writable,
      min: model?.min, max: model?.max, step: model?.step, authority_asset_id: model?.authority_asset_id || ""
    };
  }

  liveChargingContextForVehicle(vehicleAssetOrId) {
    const assetId = this.canonicalAssetId(typeof vehicleAssetOrId === "string" ? vehicleAssetOrId : vehicleAssetOrId?.asset_id || "");
    if (!assetId) return { active:false, status:"—", rawStatus:"", reason:"contract_gap", power:null, current:null, detail:"Charging context unavailable.", assigned:"", effective_charger:"", physical_charger:"", charger:null, chargerEvidence:"contract_gap", statusEntity:"" };
    const rel = this.vehicleChargerRelationship(assetId);
    const isReal = (value) => {
      const v = String(value || "").trim();
      return !!v && !["none","unknown","unavailable","null","undefined","—"].includes(v.toLowerCase());
    };
    const physicalId = isReal(rel.connected) ? this.canonicalAssetId(rel.connected) : "";
    const effectiveId = isReal(rel.effective) ? this.canonicalAssetId(rel.effective) : "";
    const chargerId = physicalId || effectiveId;
    const charger = chargerId ? (this.chargerById(chargerId) || { asset_id:chargerId }) : null;
    const snapshot = chargerId ? this.chargerProductSnapshot(chargerId) : null;
    const status = physicalId && snapshot?.operating?.resolved ? snapshot.operating.display : (physicalId ? "—" : "Not connected");
    const power = physicalId && snapshot?.power?.resolved && Number.isFinite(Number(snapshot.power.value)) ? Number(snapshot.power.value) : null;
    const active = physicalId && snapshot?.operating?.resolved && String(snapshot.operating.value).toLowerCase() === "running";
    return {
      active,
      status,
      rawStatus: snapshot?.operating?.resolved ? String(snapshot.operating.value) : "",
      reason: snapshot?.operating?.reason || "",
      power,
      current:null,
      detail: physicalId ? "Physical charger context from relationship_index and canonical charger properties." : "No physical charger relationship published.",
      assigned: effectiveId,
      effective_charger: effectiveId,
      physical_charger: physicalId,
      charger,
      chargerEvidence: physicalId ? "relationship_index+charger_property_index" : "relationship_index",
      statusEntity:""
    };
  }

  vehicleChargingInfo(vehicleAssetOrId) {
    return this.liveChargingContextForVehicle(vehicleAssetOrId);
  }

  assetViewModel(assetId) {
    const canonical = this.canonicalAssetId(assetId);
    const asset = this.assetById(canonical, canonical.startsWith("vehicle_") ? "vehicle" : canonical.startsWith("charger_") ? "charger" : "all") || { asset_id:canonical, contract_gap:true };
    const facts = canonical.startsWith("vehicle_") ? { charging: this.liveChargingContextForVehicle(canonical) } : { charging: this.liveChargerInfo(canonical) };
    return {
      asset,
      asset_id: canonical,
      facts,
      relationship: canonical.startsWith("vehicle_") ? this.relationshipFor(canonical) : {},
      commands: this.commandsFor(canonical),
      controls: this.controlsFor(canonical),
      outcome: {
        status: this.supervisorOutcome(canonical, "status", this.assetStatus(canonical, "status", "Unknown")),
        trust: this.supervisorOutcome(canonical, "trust", this.assetStatus(canonical, "trust", "Unknown")),
        attention: this.supervisorOutcome(canonical, "attention", this.assetStatus(canonical, "attention", "None")),
        opportunity: this.supervisorOutcome(canonical, "opportunity", this.assetStatus(canonical, "opportunity", "None")),
        recommended_action: this.supervisorOutcome(canonical, "recommended_action", this.assetStatus(canonical, "recommended_action", "none"))
      }
    };
  }

  entity(entityId) {
    const id = String(entityId || "").trim();
    if (!id) return undefined;
    // UX consumption contract R22.11.9: all runtime/identity/selector reads
    // must go through the approved public Mobility indexes only.
    // This prevents accidental candidate/fact/adapter/diagnostics/raw entity fallback.
    if (!this.isAllowedContractEntity(id)) return undefined;
    return this.hass?.states?.[id];
  }

  exists(entityId) {
    return !!this.entity(entityId);
  }

  jsonAttr(entityId, attr, fallback = []) {
    const entity = this.entity(entityId);
    const raw = entity?.attributes?.[attr];
    const result = { ok: false, value: fallback, raw, error: "", exists: !!entity, attr_exists: raw !== undefined };
    if (!entity) { result.error = `Entity ${entityId} not found`; return result; }
    if (typeof raw !== "string" || !raw.trim()) { result.error = `Attribute ${attr} missing or not a JSON string`; return result; }
    try { result.value = JSON.parse(raw); result.ok = true; return result; }
    catch (e) { result.error = String(e?.message || e); return result; }
  }

  state(entityId, fallback = "") {
    const raw = this.entity(entityId)?.state;
    if (raw === undefined || raw === null) return fallback;
    const s = String(raw).trim();
    if (!s || ["unknown", "unavailable", "none", "null", "undefined"].includes(s.toLowerCase())) return fallback;
    return s;
  }

  cleanState(entityId, fallback = "") {
    const s = this.state(entityId, fallback);
    if (String(s).toLowerCase() === "none") return fallback;
    return s;
  }

  cleanValue(value, fallback = "") {
    if (value === undefined || value === null) return fallback;
    if (Array.isArray(value)) return value.length ? String(value[0] ?? "").trim() : fallback;
    if (typeof value === "object") {
      const candidate = value.asset_id ?? value.id ?? value.value ?? value.state ?? value.display_name ?? value.name;
      return this.cleanValue(candidate, fallback);
    }
    const s = String(value).trim();
    if (!s || ["unknown", "unavailable", "none", "null", "undefined", "nan"].includes(s.toLowerCase())) return fallback;
    return s;
  }

  firstCleanState(candidates = [], fallback = "") {
    for (const entityId of (candidates || []).filter(Boolean)) {
      const v = this.cleanState(entityId, "");
      if (v !== "") return this.normalizeOutcomeValue(key, v, fallback || "Unknown");
    }
    return fallback;
  }

  indexedEntity(assetId, indexAttrName, fieldName) {
    const canonical = this.canonicalAssetId(assetId);
    const rows = this.indexAttr(indexAttrName, []);
    const row = rows.find((r) => String(r?.asset_id || "") === canonical);
    return row?.[fieldName] || "";
  }

  assetStatus(assetId, statusName, fallback = "Unknown") {
    const canonical = this.canonicalAssetId(assetId);
    const mapped = {
      operational_status: "status",
      availability_status: "status",
      data_freshness_status: "data_freshness",
      trust_status: "trust"
    }[statusName] || statusName;
    if (["status", "trust", "attention", "recommended_action", "opportunity"].includes(mapped)) {
      return this.supervisorOutcome(canonical, mapped, fallback);
    }
    return this.displayFactValue(canonical, mapped, fallback);
  }


  energyFactEntity(assetId, fieldName) {
    const canonical = this.canonicalAssetId(assetId);
    return this.indexedEntity(canonical, "energy_fact_entities_json", fieldName);
  }

  energyFact(assetId, fieldName, fallback = "") {
    return this.cleanState(this.energyFactEntity(assetId, fieldName), fallback);
  }


  outcomeCatalogValues(kind = "") {
    return [];
  }

  normalizeOutcomeValue(kind, value, fallback = "Unknown") {
    const clean = this.cleanValue(value, "");
    if (!clean) return fallback;
    const allowed = this.outcomeCatalogValues(kind);
    // No catalog is currently published. If one is added later, only a real
    // non-empty Set constrains backend values.
    if (!(allowed instanceof Set) || allowed.size === 0) return clean;
    return allowed.has(clean) ? clean : fallback;
  }

  supervisorOutcome(assetId = "mobility", key = "status", fallback = "") {
    const canonical = this.canonicalAssetId(assetId || "");
    if (canonical && canonical !== "mobility") return this.factContractValue(canonical, key, fallback);

    // M0.9.44+: global product supervision is a direct producer-owned V2 contract.
    // UX never derives readiness/trust/attention from local facts.
    const supervision = this.mobilitySupervisionV2();
    if (!supervision) return fallback;
    const wanted = String(key || "status").trim().toLowerCase();
    const aliases = {
      trust:"system_trust",
      systemtrust:"system_trust",
      activity:"current_activity"
    };
    const field = aliases[wanted] || wanted;
    const raw = supervision[field];
    if (raw === undefined || raw === null) return fallback;
    if (typeof raw === "object") {
      if (raw.value !== undefined && raw.value !== null) return String(raw.value);
      if (field === "current_activity" && raw.activity) {
        return String(raw.activity.activity_state || raw.activity.state || raw.activity.activity_type || "active");
      }
    }
    if (typeof raw === "string" || typeof raw === "number") return String(raw);
    return fallback;
  }

  parseSupervisorValue(raw, assetId, key) {
    if (raw === undefined || raw === null || raw === "") return "";
    const value = this.parseJsonValue(raw, raw);
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      const row = value.find((r) => String(r?.asset_id || r?.id || r?.scope || "mobility") === String(assetId));
      return row?.[key] ?? row?.outcomes?.[key] ?? "";
    }
    if (typeof value === "object") {
      if (value[key] !== undefined && (assetId === "mobility" || value.asset_id === assetId || !value.asset_id)) return String(value[key]);
      if (value[assetId]) return this.parseSupervisorValue(value[assetId], assetId, key);
      if (value.outcomes) return this.parseSupervisorValue(value.outcomes, assetId, key);
    }
    return "";
  }

  vehicleState(assetId, stateName, fallback = "Unknown") {
    return this.displayFactValue(assetId, stateName, fallback);
  }


  chargerState(assetId, stateName, fallback = "Unknown") {
    return this.displayFactValue(assetId, stateName, fallback);
  }


  isOn(entityId) {
    return this.state(entityId) === "on";
  }

  boolPresent(entityId) {
    const s = this.state(entityId, "");
    if (!s) return true;
    return s !== "off";
  }

  contractBool(value, fallback = true) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    const s = String(value).trim().toLowerCase();
    if (["true", "yes", "on", "1"].includes(s)) return true;
    if (["false", "no", "off", "0"].includes(s)) return false;
    return fallback;
  }

  parseJsonValue(value, fallback = {}) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try { return JSON.parse(value); } catch (e) { return fallback; }
    }
    return fallback;
  }

  norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  cache(src) {
    if (!src || src.startsWith("data:")) return src;
    const v = this.config.resource_version || UX_VERSION;
    return src.includes("?") ? `${src}&v=${v}` : `${src}?v=${v}`;
  }

  formatAge(value) {
    if (!value && value !== 0) return this.t("common.unknown",{},"Unknown");
    const raw = String(value).trim();
    const n = Number(raw.replace(",", "."));
    if (Number.isNaN(n)) return raw;
    const locale=rhiMobilityLocale(this.hass);
    const relative=new Intl.RelativeTimeFormat(locale,{numeric:"auto"});
    if (n < 60) return relative.format(-Math.round(n),"second");
    if (n < 3600) return relative.format(-Math.round(n / 60),"minute");
    if (n < 86400) return relative.format(-Math.round(n / 3600),"hour");
    return relative.format(-Math.round(n / 86400),"day");
  }

  /** Convert command ids and contract values into calm product labels. */
  titleize(value) {
    return String(value || "")
      .replace(/^.*\./, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }


  /** Shared command icon resolver used by all screens and adapters. */
  commandIcon(command) {
    const id = String(command?.command_id || command?.id || "").toLowerCase();
    const family = String(command?.command_family || "").toLowerCase();
    const text = `${family} ${id}`;
    if (text.includes("restart") || text.includes("reboot") || text.includes("reset")) return "mdi:restart";
    if (text.includes("identify") || text.includes("locate") || text.includes("location")) return "mdi:crosshairs-gps";
    if (text.includes("stop") || text.includes("pause")) return "mdi:stop";
    if (text.includes("start") || text.includes("charge") || text.includes("resume")) return "mdi:lightning-bolt";
    if (text.includes("climate") || text.includes("heat") || text.includes("precondition")) return "mdi:fan";
    if (text.includes("unlock")) return "mdi:lock-open-outline";
    if (text.includes("lock") || text.includes("security")) return "mdi:lock-outline";
    if (text.includes("present") || text.includes("active")) return "mdi:power";
    return "mdi:gesture-tap-button";
  }

  assetLabelFromIndex(assetId, kind = "all") {
    const id = String(assetId || "").trim();
    if (!id || id.toLowerCase() === "none") return "None";
    const row = this.assetIndexRows(kind).find((a)=>String(a.asset_id || "") === id) || this.assetIndexRows("all").find((a)=>String(a.asset_id || "") === id);
    return row?.display_name || this.titleize(id);
  }

  chargerLabel(value) {
    return this.assetLabelFromIndex(value, "charger");
  }

  vehicleLabel(value) {
    return this.assetLabelFromIndex(value, "vehicle");
  }

  /**
   * Execute the exact invocation published by MOBILITY_COMMAND_V2.
   * The UI never reconstructs vendor/OEM producer bindings.
   */
  callCommand(command, data = {}) {
    if (!command || !this.hass) return;
    const st = this.commandState(command);
    if (st.disabled) return;
    if (command.service_domain && command.service_action) {
      const serviceData = { ...(command.service_data && typeof command.service_data === "object" ? command.service_data : {}) };
      if (data && Object.keys(data).length) Object.assign(serviceData, data);
      const target = command.service_target && typeof command.service_target === "object" ? command.service_target : {};
      this.hass.callService(command.service_domain, command.service_action, serviceData, target);
      return;
    }
    console.warn("HomeBrain Mobility: command has no executable service metadata", command.command_key || command.command_id || command);
  }

  toDateTimeLocalInputValue(value = "") {
    const raw = String(value ?? "").trim();
    if (!raw || ["unknown","unavailable","none","null","undefined","not available","—"].includes(raw.toLowerCase())) return "";
    // Already usable HA/input_datetime or datetime-local format.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) return raw.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) return raw.replace(" ", "T").slice(0, 16);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  navigate(path) {
    if (!path) return;
    try {
      const u = new URL(path, window.location.origin);
      const asset = u.searchParams.get("asset") || (u.hash || "").replace(/^#asset=/, "");
      if (asset) sessionStorage.setItem("homebrain_mobility_last_asset", decodeURIComponent(asset));

      // Optional single-card bootstrap routing. Existing multi-view Lovelace YAML
      // keeps using physical routes because bootstrap_mode is false by default.
      if (this.config?.bootstrap_mode === true) {
        const route = String(u.searchParams.get("mobility_view") || u.pathname.split("/").filter(Boolean).pop() || "").toLowerCase();
        const viewMap = {
          overview:"overview",
          dashboard:"vehicles",
          vehicles:"vehicles",
          "charger-maintenance":"chargers",
          chargers:"chargers",
          planning:"planning",
          strategies:"strategies",
          history:"history",
          log:"log",
          "asset-detail":"detail",
          detail:"detail"
        };
        const view = viewMap[route] || "overview";
        const current = new URL(window.location.href);
        const basePath = String(this.config?.bootstrap_path || current.pathname || "").trim() || current.pathname;
        current.pathname = basePath;
        current.search = "";
        current.searchParams.set("mobility_view", view);
        if (asset) current.searchParams.set("asset", decodeURIComponent(asset));
        // Related detail links preserve their explicit parent for meaningful
        // Back navigation after reload in single-card/bootstrap mode.
        const fromAsset = String(u.searchParams.get("from_asset") || "");
        if (/^(vehicle_|charger_)[a-zA-Z0-9_:-]+$/.test(fromAsset) && fromAsset !== asset) {
          current.searchParams.set("from_asset", fromAsset);
        }
        current.hash = "";
        history.pushState(null, "", current.pathname + current.search);
        window.dispatchEvent(new Event("location-changed"));
        return;
      }
    } catch (e) {}
    history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
  }
}
