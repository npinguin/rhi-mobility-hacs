// Canonical Mobility page/detail hero library. The UX owns the presentation mapping;
// domain/runtime semantics remain backend-owned. Every semantic hero key maps to
// exactly one package asset and screens must resolve through this catalog.
const RHI_MOBILITY_HERO_CATALOG = Object.freeze({
  overview: "heroes/mobility-overview.png",
  vehicles: "heroes/mobility-vehicles.png",
  chargers: "heroes/mobility-chargers.png",
  planning: "heroes/mobility-planning.png",
  strategies: "heroes/mobility-strategies.png",
  history: "heroes/mobility-history.png",
  log: "heroes/mobility-log.png",
  vehicle_detail: "heroes/mobility-vehicle-detail.png",
  charging_detail: "heroes/mobility-charging-detail.png"
});

function rhiMobilityHeroCatalog() {
  return Object.entries(RHI_MOBILITY_HERO_CATALOG).map(([key, package_path])=>({
    key,
    package_path,
    package_file:rhiMobilityAssetUrl(package_path)
  }));
}

function rhiMobilityHeroAsset(key = "") {
  const packagePath = RHI_MOBILITY_HERO_CATALOG[String(key || "").trim()] || "";
  return packagePath ? rhiMobilityAssetUrl(packagePath) : "";
}

// Package-owned visual catalog. Backend owns image_key; this layer maps keys to immutable package assets.
const RHI_MOBILITY_IMAGE_CATALOG = Object.freeze([
  { image_key:"vehicle_audi_q8", package_path:"vehicles/vehicle_audi_q8.webp", fallback_image_key:"vehicle_fallback" },
  { image_key:"vehicle_bmw_x1_phev", package_path:"vehicles/vehicle_bmw_x1_phev.webp", fallback_image_key:"vehicle_fallback" },
  { image_key:"vehicle_mercedes_gla", package_path:"vehicles/vehicle_mercedes_gla.webp", fallback_image_key:"vehicle_fallback" },
  { image_key:"vehicle_vw_id4", package_path:"vehicles/vehicle_vw_id4.webp", fallback_image_key:"vehicle_fallback" },
  { image_key:"vehicle_renault_scenic_techno_ev", package_path:"vehicles/vehicle_renault_scenic_techno_ev.webp", fallback_image_key:"vehicle_fallback" },
  { image_key:"vehicle_guest", package_path:"vehicles/vehicle_guest.webp", fallback_image_key:"vehicle_fallback" },
  { image_key:"vehicle_fallback", package_path:"vehicles/vehicle_fallback.png", fallback_image_key:"vehicle_fallback" },
  { image_key:"charger_wallbox", package_path:"chargers/charger_wallbox_white.webp", fallback_image_key:"charger_fallback" },
  { image_key:"charger_wallbox_white", package_path:"chargers/charger_wallbox_white.webp", fallback_image_key:"charger_wallbox" },
  { image_key:"charger_wallbox_black", package_path:"chargers/charger_wallbox_black.webp", fallback_image_key:"charger_wallbox" },
  { image_key:"charger_peblar", package_path:"chargers/charger_peblar.webp", fallback_image_key:"charger_fallback" },
  { image_key:"charger_utility_plug", package_path:"chargers/charger_utility_plug.svg", fallback_image_key:"charger_fallback" },
  { image_key:"charger_fallback", package_path:"chargers/charger_fallback.png", fallback_image_key:"charger_fallback" }
]);

function rhiMobilityImageCatalog() {
  return RHI_MOBILITY_IMAGE_CATALOG.map((row)=>({
    image_key: row.image_key,
    package_file: rhiMobilityAssetUrl(row.package_path),
    fallback_image_key: row.fallback_image_key
  }));
}


/**
 * Package-owned vehicle visual catalog.
 * Backend stores only the selected vehicle.image_key. UX owns type/color choices,
 * asset paths and presentation.
 */
const RHI_MOBILITY_VEHICLE_VISUALS = Object.freeze([
  {
    id:"audi.q8.4m.2024-2026.tfsi-e", label:"Audi Q8 TFSI-e", brand:"Audi", model:"Q8", profile_ids:["audi_q8_55_tfsi_e_quattro_my2025","audi_q8_tfsi_55e_2025_phev"],
    generation:"4M", years:"2024–2026", variant:"TFSI-e", image_key:"vehicle_audi_q8", selectable:true, visual_quality:"verified_model",
    colors:[
      { id:"daytona-grey", label:"Daytona Grey", filter:"none" },
      { id:"mythos-black", label:"Mythos Black", filter:"brightness(.42) contrast(1.14) saturate(.7)" },
      { id:"glacier-white", label:"Glacier White", filter:"brightness(1.35) saturate(.45) contrast(.88)" },
      { id:"navarra-blue", label:"Navarra Blue", filter:"sepia(.32) saturate(2.4) hue-rotate(170deg) brightness(.78)" },
      { id:"tango-red", label:"Tango Red", filter:"sepia(.45) saturate(3.2) hue-rotate(305deg) brightness(.82)" }
    ]
  },
  {
    id:"bmw.x1.u11.2025-2026.phev", label:"BMW X1 PHEV", brand:"BMW", model:"X1", profile_ids:["bmw_x1_xdrive25e_my2026","bmw_x1_2025_phev"],
    generation:"U11", years:"2025–2026", variant:"PHEV", image_key:"vehicle_bmw_x1_phev", selectable:true, visual_quality:"verified_model",
    colors:[
      { id:"mineral-white", label:"Mineral White", filter:"none" },
      { id:"black-sapphire", label:"Black Sapphire", filter:"brightness(.40) contrast(1.18) saturate(.7)" },
      { id:"skyscraper-grey", label:"Skyscraper Grey", filter:"grayscale(.55) brightness(.86)" },
      { id:"phytonic-blue", label:"Phytonic Blue", filter:"sepia(.28) saturate(2.5) hue-rotate(170deg) brightness(.82)" },
      { id:"fire-red", label:"Fire Red", filter:"sepia(.45) saturate(3.1) hue-rotate(305deg) brightness(.85)" }
    ]
  },
  {
    id:"mercedes.gla.h247.2023-2026.phev", label:"Mercedes-Benz GLA PHEV", brand:"Mercedes-Benz", model:"GLA", profile_ids:["mercedes_gla_250e_my2025","mercedes_gla_2021_phev"],
    generation:"H247", years:"2023–2026", variant:"PHEV", image_key:"vehicle_mercedes_gla", selectable:true, visual_quality:"verified_model",
    colors:[
      { id:"mountain-grey", label:"Mountain Grey", filter:"none" },
      { id:"night-black", label:"Night Black", filter:"brightness(.42) contrast(1.15) saturate(.7)" },
      { id:"polar-white", label:"Polar White", filter:"brightness(1.35) saturate(.45) contrast(.88)" },
      { id:"spectral-blue", label:"Spectral Blue", filter:"sepia(.30) saturate(2.5) hue-rotate(170deg) brightness(.80)" },
      { id:"patagonia-red", label:"Patagonia Red", filter:"sepia(.45) saturate(3.1) hue-rotate(305deg) brightness(.82)" }
    ]
  },
  {
    id:"renault.scenic.e-tech.2024-2026.techno", label:"Renault Scenic E-Tech", brand:"Renault", model:"Scenic", profile_ids:["renault_scenic_techno_ev"],
    generation:"E-Tech", years:"2024–2026", variant:"Techno EV", image_key:"vehicle_renault_scenic_techno_ev", selectable:true, visual_quality:"verified_model",
    colors:[
      { id:"pearl-white", label:"Pearl White", filter:"none" },
      { id:"starry-black", label:"Starry Black", filter:"brightness(.42) contrast(1.16) saturate(.65)" },
      { id:"schiste-grey", label:"Schiste Grey", filter:"grayscale(.55) brightness(.82)" },
      { id:"midnight-blue", label:"Midnight Blue", filter:"sepia(.28) saturate(2.2) hue-rotate(170deg) brightness(.72)" },
      { id:"flame-red", label:"Flame Red", filter:"sepia(.45) saturate(3.0) hue-rotate(305deg) brightness(.84)" }
    ]
  },
  {
    id:"volkswagen.id4.2024-2026.ev", label:"Volkswagen ID.4", brand:"Volkswagen", model:"ID.4", profile_ids:["volkswagen_id4_pro_my2026","vw_id4_business_pro_77kwh"],
    generation:"ID.4", years:"2024–2026", variant:"EV", image_key:"vehicle_vw_id4", selectable:true, visual_quality:"verified_model",
    colors:[
      { id:"costa-azul", label:"Costa Azul", filter:"none" },
      { id:"moonstone-grey", label:"Moonstone Grey", filter:"grayscale(.65) brightness(.78)" },
      { id:"mythos-black", label:"Black", filter:"brightness(.40) contrast(1.18) saturate(.65)" },
      { id:"glacier-white", label:"Glacier White", filter:"brightness(1.35) saturate(.42) contrast(.88)" },
      { id:"scale-silver", label:"Scale Silver", filter:"grayscale(.85) brightness(1.05)" }
    ]
  },
  {
    id:"generic.guest.current.phev-1phase", label:"Guest PHEV 1-phase", brand:"Generic", model:"Guest PHEV", profile_ids:["guest_phev_1phase"],
    generation:"Current", years:"Any", variant:"PHEV 1-phase", image_key:"vehicle_guest", selectable:true, visual_quality:"verified_guest",
    colors:[
      { id:"slate-grey", label:"Slate Grey", filter:"none" },
      { id:"carbon-black", label:"Carbon Black", filter:"brightness(.42) contrast(1.16)" },
      { id:"pearl-white", label:"Pearl White", filter:"brightness(1.32) saturate(.40)" },
      { id:"deep-blue", label:"Deep Blue", filter:"sepia(.3) saturate(2.4) hue-rotate(170deg) brightness(.76)" },
      { id:"urban-green", label:"Urban Green", filter:"sepia(.4) saturate(1.9) hue-rotate(70deg) brightness(.72)" }
    ]
  },
  {
    id:"generic.guest.current.ev-3phase", label:"Guest EV 3-phase", brand:"Generic", model:"Guest EV", profile_ids:["guest_ev_3phase"],
    generation:"Current", years:"Any", variant:"EV 3-phase", image_key:"vehicle_guest", selectable:true, visual_quality:"verified_guest",
    colors:[
      { id:"slate-grey", label:"Slate Grey", filter:"none" },
      { id:"carbon-black", label:"Carbon Black", filter:"brightness(.42) contrast(1.16)" },
      { id:"pearl-white", label:"Pearl White", filter:"brightness(1.32) saturate(.40)" },
      { id:"deep-blue", label:"Deep Blue", filter:"sepia(.3) saturate(2.4) hue-rotate(170deg) brightness(.76)" },
      { id:"urban-green", label:"Urban Green", filter:"sepia(.4) saturate(1.9) hue-rotate(70deg) brightness(.72)" }
    ]
  }
]);

const RHI_MOBILITY_VEHICLE_VISUAL_ALIASES = Object.freeze({
  // Current Mobility profile/source keys
  audi_q8_daytona_grey_23:"audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
  vw_id4_business_pro_silver_grey:"volkswagen.id4.2024-2026.ev.scale-silver",
  mercedes_gla_phev:"mercedes.gla.h247.2023-2026.phev.mountain-grey",
  bmw_x1_phev:"bmw.x1.u11.2025-2026.phev.mineral-white",
  renault_scenic_techno_ev:"renault.scenic.e-tech.2024-2026.techno.pearl-white",
  guest_phev:"generic.guest.current.phev-1phase.slate-grey",
  guest_ev:"generic.guest.current.ev-3phase.slate-grey",

  // Existing UX/package aliases kept for backward compatibility
  vehicle_audi_q8:"audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
  vehicle_audi_q8_hero:"audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
  vehicle_bmw_x1_phev:"bmw.x1.u11.2025-2026.phev.mineral-white",
  vehicle_bmw_ix1_phev:"bmw.x1.u11.2025-2026.phev.mineral-white",
  vehicle_bmw_x1:"bmw.x1.u11.2025-2026.phev.mineral-white",
  vehicle_bmw_ix1_phev_hero:"bmw.x1.u11.2025-2026.phev.mineral-white",
  vehicle_mercedes_gla:"mercedes.gla.h247.2023-2026.phev.mountain-grey",
  vehicle_mercedes_gla_hero:"mercedes.gla.h247.2023-2026.phev.mountain-grey",
  vehicle_renault_scenic_techno_ev:"renault.scenic.e-tech.2024-2026.techno.pearl-white",
  vehicle_renault_scenic:"renault.scenic.e-tech.2024-2026.techno.pearl-white",
  vehicle_renault_scenic_techno_ev_hero:"renault.scenic.e-tech.2024-2026.techno.pearl-white",
  vehicle_vw_id4:"volkswagen.id4.2024-2026.ev.scale-silver",
  vehicle_vw_id4_hero:"volkswagen.id4.2024-2026.ev.scale-silver",
  vehicle_guest:"generic.guest.current.phev-1phase.slate-grey",
  vehicle_guest_generic:"generic.guest.current.phev-1phase.slate-grey"
});

function rhiMobilityVehicleVisualCatalog() {
  return RHI_MOBILITY_VEHICLE_VISUALS.map((row)=>({
    ...row,
    colors: row.colors.map((color)=>({ ...color })),
    package_file: rhiMobilityImageCatalog().find((item)=>item.image_key===row.image_key)?.package_file || ""
  }));
}

function rhiMobilitySelectableVehicleVisualCatalog() {
  return rhiMobilityVehicleVisualCatalog().filter((row)=>row.selectable !== false);
}

function rhiMobilityParseVehicleVisualKey(value = "") {
  const raw = String(value || "").trim();
  const canonical = RHI_MOBILITY_VEHICLE_VISUAL_ALIASES[raw] || raw;
  for (const vehicle of RHI_MOBILITY_VEHICLE_VISUALS) {
    const prefix = vehicle.id + ".";
    if (!canonical.startsWith(prefix)) continue;
    const colorId = canonical.slice(prefix.length);
    const color = vehicle.colors.find((row)=>row.id===colorId) || vehicle.colors[0];
    return { key:vehicle.id + "." + color.id, vehicle, color };
  }
  return null;
}

function rhiMobilityVehicleVisualKey(vehicleId = "", colorId = "") {
  const vehicle = RHI_MOBILITY_VEHICLE_VISUALS.find((row)=>row.id===String(vehicleId));
  if (!vehicle) return "";
  const color = vehicle.colors.find((row)=>row.id===String(colorId)) || vehicle.colors[0];
  return vehicle.id + "." + color.id;
}


/**
 * Package-owned charger visual catalog.
 * Same contract shape as vehicle visuals: one product identity, explicit
 * appearances, one central alias surface and package-owned rendering.
 * Previous catalog may only provide a readonly charger.image_key; the catalog remains
 * the presentation authority so V2 can replace only the runtime adapter.
 */
const RHI_MOBILITY_CHARGER_VISUALS = Object.freeze([
  {
    id:"wallbox.commander2", label:"Wallbox Commander 2", brand:"Wallbox", model:"Commander 2", profile_ids:["wallbox_commander2_22kw","wallbox_ocpp"],
    variant:"", years:"Current", selectable:true, visual_quality:"verified_model",
    appearances:[
      { id:"white", label:"White", image_key:"charger_wallbox_white" },
      { id:"black", label:"Black", image_key:"charger_wallbox_black" }
    ]
  },
  {
    id:"peblar.business.socket", label:"Peblar Business", brand:"Peblar", model:"Business", profile_ids:["peblar_business_socket_22kw","peblar_22kw"],
    variant:"Socket", years:"Current", selectable:true, visual_quality:"verified_model",
    appearances:[
      { id:"factory", label:"Factory finish", image_key:"charger_peblar" }
    ]
  },
  {
    id:"fibaro.wall-plug-2.zwave-plus.be-fr", label:"Fibaro Wall Plug 2", brand:"Fibaro", model:"Wall Plug 2", profile_ids:["fibaro_utility_plug"],
    variant:"Z-Wave Plus BE/FR", years:"Current", selectable:true, visual_quality:"verified_model",
    appearances:[
      { id:"white", label:"White", image_key:"charger_utility_plug" }
    ]
  }
]);

const RHI_MOBILITY_CHARGER_VISUAL_ALIASES = Object.freeze({
  // Previous catalog profile image keys.
  wallbox_ocpp:"wallbox.commander2.white",
  peblar_22kw:"peblar.business.socket.factory",
  fibaro_utility_plug:"fibaro.wall-plug-2.zwave-plus.be-fr.white",
  utility_plug:"fibaro.wall-plug-2.zwave-plus.be-fr.white",

  // Existing package keys.
  charger_wallbox:"wallbox.commander2.white",
  charger_wallbox_white:"wallbox.commander2.white",
  charger_wallbox_black:"wallbox.commander2.black",
  charger_peblar:"peblar.business.socket.factory",
  charger_utility_plug:"fibaro.wall-plug-2.zwave-plus.be-fr.white",

  // Previous catalog instance compatibility only. V2 identity/color replaces these.
  charger_driveway_left:"wallbox.commander2.white",
  charger_driveway_right:"wallbox.commander2.black",
  charger_sideway:"peblar.business.socket.factory"
});

function rhiMobilityChargerVisualCatalog() {
  const images = rhiMobilityImageCatalog();
  return RHI_MOBILITY_CHARGER_VISUALS.map((row)=>({
    ...row,
    appearances: row.appearances.map((appearance)=>({
      ...appearance,
      package_file: images.find((item)=>item.image_key===appearance.image_key)?.package_file || ""
    }))
  }));
}

function rhiMobilitySelectableChargerVisualCatalog() {
  return rhiMobilityChargerVisualCatalog().filter((row)=>row.selectable !== false);
}

function rhiMobilityParseChargerVisualKey(value = "", assetId = "") {
  const raw = String(value || "").trim();
  const instanceAlias = RHI_MOBILITY_CHARGER_VISUAL_ALIASES[String(assetId || "").trim()];
  // Persisted V2 appearance is authoritative. Instance aliases are a last-resort
  // compatibility input for old deployments that do not publish charger.image_key.
  const canonical = raw
    ? (RHI_MOBILITY_CHARGER_VISUAL_ALIASES[raw] || raw)
    : (instanceAlias || "");
  for (const charger of rhiMobilityChargerVisualCatalog()) {
    const prefix = charger.id + ".";
    if (!canonical.startsWith(prefix)) continue;
    const appearanceId = canonical.slice(prefix.length);
    const appearance = charger.appearances.find((row)=>row.id===appearanceId) || charger.appearances[0] || null;
    return appearance ? { key:charger.id + "." + appearance.id, charger, appearance } : null;
  }
  return null;
}

function rhiMobilityChargerVisualKey(chargerId = "", appearanceId = "") {
  const charger = rhiMobilityChargerVisualCatalog().find((row)=>row.id===String(chargerId));
  if (!charger) return "";
  const appearance = charger.appearances.find((row)=>row.id===String(appearanceId)) || charger.appearances[0];
  return appearance ? charger.id + "." + appearance.id : "";
}


function rhiMobilityVehicleVisualForProfile(profileId = "") {
  const id=String(profileId || "").trim();
  return rhiMobilityVehicleVisualCatalog().find((row)=>(row.profile_ids || []).includes(id)) || null;
}

function rhiMobilityChargerVisualForProfile(profileId = "") {
  const id=String(profileId || "").trim();
  return rhiMobilityChargerVisualCatalog().find((row)=>(row.profile_ids || []).includes(id)) || null;
}

function rhiMobilityResolveChargerVisual(asset = {}, rawKey = "") {
  const assetId = String(asset?.asset_id || asset || "").trim();
  const parsed = rhiMobilityParseChargerVisualKey(rawKey || asset?.image_key || asset?.raw?.image_key || "", assetId);
  if (parsed?.appearance?.package_file) return parsed;
  return null;
}


/**
 * Canonical cross-domain visual identity bridge.
 * Backend contracts publish package-neutral visual_ref values; this UX resolves
 * only Mobility-owned refs to its own local artwork. No backend URL/path is used.
 */
function rhiMobilityLocalVisualKeyFromRef(visualRef = "") {
  const ref = String(visualRef || "").trim();
  if (ref.startsWith("mobility.vehicle.")) return ref.slice("mobility.vehicle.".length);
  if (ref.startsWith("mobility.charger.")) return ref.slice("mobility.charger.".length);
  return "";
}

function rhiMobilityVisualRefFromLocalKey(kind = "vehicle", localKey = "") {
  const key = String(localKey || "").trim();
  if (!key) return "";
  if (key.startsWith("mobility.")) return key;
  return `mobility.${String(kind || "vehicle").toLowerCase()}.${key}`;
}

function rhiMobilityResolveVisualRef(visualRef = "") {
  const ref = String(visualRef || "").trim();
  const local = rhiMobilityLocalVisualKeyFromRef(ref);
  if (!local) return null;
  if (ref.startsWith("mobility.vehicle.")) {
    if (local === "generic.fallback") {
      const fallback = rhiMobilityImageCatalog().find((row)=>row.image_key==="vehicle_fallback") || null;
      return fallback ? { visual_ref:ref, kind:"vehicle", package_file:fallback.package_file, filter:"none" } : null;
    }
    const parsed = rhiMobilityParseVehicleVisualKey(local);
    return parsed?.vehicle?.image_key
      ? {
          visual_ref:ref,
          kind:"vehicle",
          package_file:rhiMobilityImageCatalog().find((row)=>row.image_key===parsed.vehicle.image_key)?.package_file || "",
          filter:parsed.color?.filter || "none",
          visual:parsed
        }
      : null;
  }
  if (local === "generic.fallback") {
    const fallback = rhiMobilityImageCatalog().find((row)=>row.image_key==="charger_fallback") || null;
    return fallback ? { visual_ref:ref, kind:"charger", package_file:fallback.package_file, filter:"none" } : null;
  }
  const parsed = rhiMobilityParseChargerVisualKey(local);
  return parsed?.appearance?.package_file
    ? { visual_ref:ref, kind:"charger", package_file:parsed.appearance.package_file, filter:"none", visual:parsed }
    : null;
}
