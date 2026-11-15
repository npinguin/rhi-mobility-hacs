// Shared image-first vehicle visual picker.
// UX owns artwork/catalog rendering; Mobility V2 owns profile/image-key persistence.
class HomeBrainVehicleVisualPicker {
  constructor(rt) { this.rt = rt; }

  catalog() {
    return typeof rhiMobilitySelectableVehicleVisualCatalog === "function"
      ? rhiMobilitySelectableVehicleVisualCatalog()
      : [];
  }

  brands(catalog = this.catalog()) {
    return [...new Set(catalog.map((row)=>String(row.brand || "").trim()).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b));
  }

  modelsForBrand(brand, catalog = this.catalog()) {
    return [...new Set(catalog.filter((row)=>row.brand===brand).map((row)=>String(row.model || "").trim()).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b));
  }

  variantsFor(brand, model, catalog = this.catalog()) {
    return catalog.filter((row)=>row.brand===brand && row.model===model)
      .slice().sort((a,b)=>String(a.variant || "").localeCompare(String(b.variant || "")));
  }

  profileIdForVehicle(vehicle, profileProp) {
    if (!vehicle) return "";
    if (!profileProp || typeof profileProp !== "object") return "";
    const choices = this.rt.propertyEditorChoices(profileProp) || [];
    const available = new Set(choices.map((row)=>String((row?.value ?? row) || "")));
    const candidates = Array.isArray(vehicle.profile_ids) ? vehicle.profile_ids : [];
    return candidates.find((id)=>available.has(String(id))) || "";
  }

  selection(asset = {}, draft = {}) {
    const assetId = String(asset?.asset_id || asset || "").trim();
    const imageProp = assetId ? this.rt.semanticProperty(assetId, "vehicle.image_key") : null;
    const profileProp = assetId ? this.rt.semanticProperty(assetId, "asset.profile_id") : null;
    const persistedRaw = String(imageProp?.value ?? this.rt.visualImageKey(asset || {}, "image") ?? asset?.image_key ?? "").trim();
    const persistedParsed = typeof rhiMobilityParseVehicleVisualKey === "function" ? rhiMobilityParseVehicleVisualKey(persistedRaw) : null;
    const currentProfileId = String(profileProp?.value ?? asset?.profile_id ?? asset?.raw?.profile_id ?? "").trim();
    const profileVehicle = typeof rhiMobilityVehicleVisualForProfile === "function" ? rhiMobilityVehicleVisualForProfile(currentProfileId) : null;
    const catalog = this.catalog();
    const currentVehicle = profileVehicle || (persistedParsed?.vehicle ? catalog.find((row)=>row.id===persistedParsed.vehicle.id) || null : null);

    const brand = String(draft.brand ?? currentVehicle?.brand ?? "");
    const model = String(draft.model ?? (currentVehicle?.brand===brand ? currentVehicle?.model : "") ?? "");
    const variants = brand && model ? this.variantsFor(brand, model, catalog) : [];
    const vehicle = variants.find((row)=>row.id===String(draft.variant_id || ""))
      || (currentVehicle?.brand===brand && currentVehicle?.model===model ? currentVehicle : null)
      || null;

    const sameVisual = !!(vehicle && persistedParsed?.vehicle?.id===vehicle.id);
    const currentColor = sameVisual ? persistedParsed?.color : (vehicle?.colors?.[0] || null);
    const color = vehicle?.colors?.find((row)=>row.id===String(draft.color_id || "")) || currentColor || vehicle?.colors?.[0] || null;
    const key = vehicle && color && typeof rhiMobilityVehicleVisualKey === "function"
      ? rhiMobilityVehicleVisualKey(vehicle.id,color.id)
      : "";
    const profileId = this.profileIdForVehicle(vehicle, profileProp) || (vehicle?.id===currentVehicle?.id ? currentProfileId : "");
    const profileChanged = !!profileId && profileId!==currentProfileId;
    const profileWritable = !!(profileProp && this.rt.isWritableProperty(profileProp));
    const imageWritable = !!(imageProp && this.rt.isWritableProperty(imageProp));
    // Appearance-only changes on the same backend identity need no profile write.
    // Changing product requires an exact supported and writable profile choice.
    const sameProduct=!!(vehicle && currentVehicle?.id===vehicle.id);
    const writable=!!key && imageWritable && (!profileChanged || profileWritable)
      && (sameProduct || (!!profileId && profileWritable));

    return {
      asset_id:assetId,
      prop:imageProp,
      image_prop:imageProp,
      profile_prop:profileProp,
      raw:persistedRaw,
      parsed:persistedParsed,
      current_profile_id:currentProfileId,
      profile_id:profileId,
      profile_changed:profileChanged,
      profile_writable:profileWritable,
      image_writable:imageWritable,
      current_vehicle:currentVehicle,
      brand,model,vehicle,color,key,writable
    };
  }

  render(asset = {}, options = {}) {
    let current;
    try { current=this.selection(asset,options.draft || {}); }
    catch (error) {
      const assetId=String(asset?.asset_id || asset || "").trim();
      return `<div class="visual-picker-notice" data-picker-panel="${this.rt.escape(assetId)}"><ha-icon icon="mdi:palette-outline"></ha-icon><span>Appearance is temporarily unavailable. Vehicle data remains available.</span></div>`;
    }
    const catalog=this.catalog();
    const brands=this.brands(catalog);
    const models=current.brand ? this.modelsForBrand(current.brand,catalog) : [];
    const variants=current.brand && current.model ? this.variantsFor(current.brand,current.model,catalog) : [];
    const colors=current.vehicle?.colors || [];
    const assetId=current.asset_id;
    const close=options.showClose===false ? "" : `<button class="vehicle-picker-close" data-vehicle-picker-close="${this.rt.escape(assetId)}" title="Close appearance selector"><ha-icon icon="mdi:close"></ha-icon></button>`;
    const placeholder=(label,selected)=>`<option value="" ${selected?"selected":""} disabled>${label}</option>`;
    const visibleCatalog=current.brand ? catalog.filter((row)=>row.brand===current.brand) : catalog;
    const tiles=visibleCatalog.map((row)=>{
      const color=(row.colors || [])[0] || null;
      const active=row.id===current.vehicle?.id;
      const src=row.package_file || "";
      return rhiUxVisualChoice({id:row.id,image:src ? (typeof this.rt.cache==='function' ? this.rt.cache(src) : src) : "",imageAlt:row.label || row.model || "Vehicle",label:row.label || row.model || "Vehicle",detail:[row.variant,row.years].filter(Boolean).join(" · "),selected:active,imageStyle:`filter:${active ? (current.color?.filter || "none") : (color?.filter || "none")}`,attributes:{"data-vehicle-visual-choice":row.id,"data-choice-brand":row.brand || "","data-choice-model":row.model || "","data-choice-color":color?.id || ""}});
    }).join("");

    const blocked = !current.writable;
    const notice = blocked
      ? `<div class="visual-picker-notice"><ha-icon icon="mdi:information-outline"></ha-icon><span>Save needs a writable image binding. Changing model also needs an allowed backend profile option.</span></div>`
      : "";

    const refineHtml=`<label><span>Brand</span><select data-vehicle-picker-brand="${this.rt.escape(assetId)}">
          ${placeholder("Choose brand…",!current.brand)}
          ${brands.map((brand)=>`<option value="${this.rt.escape(brand)}" ${brand===current.brand?"selected":""}>${this.rt.escape(brand)}</option>`).join("")}
        </select></label>
        <label><span>Model</span><select data-vehicle-picker-model="${this.rt.escape(assetId)}" ${!current.brand?"disabled":""}>
          ${placeholder("Choose model…",!current.model)}
          ${models.map((model)=>`<option value="${this.rt.escape(model)}" ${model===current.model?"selected":""}>${this.rt.escape(model)}</option>`).join("")}
        </select></label>
        <label><span>${this.rt.escape(this.rt.t("common.variant",{},"Variant"))}</span><select data-vehicle-picker-variant="${this.rt.escape(assetId)}" ${!current.model?"disabled":""}>
          ${placeholder(this.rt.t("common.choose_variant",{},"Choose variant…"),!current.vehicle)}
          ${variants.map((row)=>`<option value="${this.rt.escape(row.id)}" ${row.id===current.vehicle?.id?"selected":""}>${this.rt.escape(row.variant)} · ${this.rt.escape(row.years)}</option>`).join("")}
        </select></label>
        <label><span>${this.rt.escape(this.rt.t("common.colour",{},"Colour"))}</span><select data-vehicle-picker-color="${this.rt.escape(assetId)}" ${!current.vehicle?"disabled":""}>
          ${placeholder(this.rt.t("common.choose_colour",{},"Choose colour…"),!current.color)}
          ${colors.map((row)=>`<option value="${this.rt.escape(row.id)}" ${row.id===current.color?.id?"selected":""}>${this.rt.escape(row.label)}</option>`).join("")}
        </select></label>`;
    const selectedHtml=`<div class="visual-picker-selection"><small>${this.rt.escape(this.rt.t("common.selected",{},"Selected"))}</small><b>${this.rt.escape(current.vehicle?.label || current.vehicle?.model || this.rt.t("appearance.choose_vehicle",{},"Choose a vehicle"))}</b><span>${this.rt.escape(current.color?.label || "")}</span></div>${notice}`;
    const saveHtml=`<button class="primary vehicle-picker-save" data-vehicle-picker-save="${this.rt.escape(assetId)}" data-vehicle-profile-id="${this.rt.escape(current.profile_id)}" data-vehicle-key="${this.rt.escape(current.key)}" ${!current.writable?"disabled":""}><ha-icon icon="mdi:check"></ha-icon><span>${this.rt.escape(this.rt.t("common.save_appearance",{},"Save appearance"))}</span></button>`;
    const shell=rhiUxVisualPickerShell({
      eyebrow:this.rt.t("appearance.vehicle.eyebrow",{},"Appearance · Vehicle"),
      title:this.rt.t("common.choose_appearance",{},"Choose appearance"),
      description:this.rt.t("appearance.vehicle.description",{},"Select the real vehicle, then refine brand, model, variant and colour."),
      choicesHtml:tiles,
      refineHtml,
      selectedHtml,
      saveHtml,
      closeHtml:close
    });
    return `<div class="${options.context==="detail"?"detail-vehicle-picker":""}" data-picker-panel="${this.rt.escape(assetId)}">${shell}</div>`;
  }
}
