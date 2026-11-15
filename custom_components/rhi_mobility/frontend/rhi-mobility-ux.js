/**
 * Robotix Home Intelligence Mobility UX v0.10.56
 * GENERATED FILE - DO NOT EDIT.
 * License: GPL-3.0-only
 */

// ---- src/app/asset-paths.js ----
// Packaging-only HACS asset resolver. Backend owns image_key only; UX maps it to packaged relative paths.
const RHI_MOBILITY_HACS_BASE = "/rhi_mobility/frontend";
const RHI_MOBILITY_ASSET_PATH = /^(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9_.-]*\.(?:png|webp|svg|jpg|jpeg)$/;

function rhiMobilityAssetUrl(path, revision = "") {
  const normalized = String(path || "").trim().replace(/^\/+/, "");
  if (!normalized) return "";
  if (
    normalized.includes("..")
    || normalized.includes("\\")
    || normalized.includes("?")
    || normalized.includes("#")
    || normalized.includes(":")
    || !RHI_MOBILITY_ASSET_PATH.test(normalized)
  ) return "";
  const base = `${RHI_MOBILITY_HACS_BASE}/assets/${normalized}`;
  return revision ? `${base}?v=${encodeURIComponent(String(revision))}` : base;
}

// ---- src/app/asset-catalog.js ----
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

// ---- src/vendor/rhi-ux-core.js ----
/* RHI UX Core 1.6.3 */
// RHI UX Core 1.6.3 — build-time presentation primitives only.
// No domain semantics or Home Assistant contract/entity knowledge belongs here.
const RHI_UX_CORE_VERSION = "1.6.3";
const RHI_UX_COMPANY_LOGO_SVG = "<svg viewBox=\"75 116 1624 688\" role=\"img\" aria-labelledby=\"title desc\">\n<title id=\"title\">Robotix.be</title>\n<desc id=\"desc\">DomotiX · Network · Security</desc>\n<path fill=\"#0B4C86\" fill-rule=\"evenodd\" d=\"M536,549 L516,554 L512,556 L501,558 L497,560 L497,609 L512,608 L513,607 L525,606 L537,603 L537,551ZM1698,698 L1696,696 L1692,695 L1678,695 L1677,694 L1658,694 L1657,693 L1638,693 L1637,692 L1618,692 L1617,691 L1573,690 L1572,689 L1552,689 L1551,688 L1524,688 L1523,687 L1494,687 L1493,686 L1447,685 L1446,684 L1441,684 L1440,683 L1441,682 L1440,679 L1440,636 L1419,633 L1418,632 L1397,630 L1396,629 L1381,628 L1380,627 L1364,625 L1362,623 L1362,542 L1360,539 L1334,531 L1327,530 L1313,525 L1310,525 L1293,519 L1262,511 L1255,508 L1245,506 L1211,495 L1201,493 L1175,484 L1172,484 L1148,476 L1145,476 L1122,468 L1115,467 L1092,459 L1085,458 L1076,454 L1059,450 L1049,446 L1036,443 L1033,441 L1030,441 L1013,435 L1006,434 L997,430 L987,428 L964,420 L957,419 L944,414 L941,414 L928,409 L925,409 L909,403 L906,403 L890,397 L887,397 L867,404 L857,406 L848,410 L832,414 L819,419 L809,421 L784,430 L781,430 L771,434 L761,436 L752,440 L749,440 L721,450 L714,451 L683,462 L680,462 L639,476 L623,480 L620,482 L614,483 L601,488 L598,488 L595,490 L583,493 L573,497 L563,496 L562,495 L554,495 L547,499 L538,508 L343,571 L342,572 L342,638 L338,640 L332,640 L321,643 L315,643 L314,644 L309,644 L301,646 L300,648 L300,683 L296,685 L252,686 L251,687 L231,687 L230,688 L210,688 L209,689 L191,689 L190,690 L170,690 L169,691 L152,691 L151,692 L135,692 L134,693 L82,695 L81,696 L77,696 L76,700 L78,701 L121,701 L122,702 L299,704 L300,705 L300,729 L302,732 L306,733 L315,733 L316,734 L334,735 L335,736 L360,738 L361,739 L371,739 L372,740 L380,740 L381,741 L400,742 L401,743 L408,743 L409,744 L417,744 L418,745 L427,745 L428,746 L436,746 L437,747 L453,748 L454,749 L472,750 L473,751 L489,752 L490,753 L514,755 L515,756 L522,756 L523,757 L558,760 L559,761 L591,764 L599,766 L607,766 L608,767 L625,768 L632,770 L657,772 L665,774 L691,776 L692,777 L698,777 L706,779 L713,779 L714,780 L721,780 L729,782 L752,784 L753,785 L765,786 L766,787 L781,788 L789,790 L812,792 L813,793 L819,793 L820,794 L826,794 L827,795 L833,795 L841,797 L848,797 L849,798 L855,798 L856,799 L862,799 L870,801 L884,802 L885,801 L906,799 L907,798 L913,798 L914,797 L920,797 L921,796 L927,796 L928,795 L934,795 L935,794 L941,794 L942,793 L948,793 L949,792 L955,792 L956,791 L962,791 L970,789 L985,788 L986,787 L992,787 L999,785 L1006,785 L1007,784 L1035,781 L1036,780 L1042,780 L1050,778 L1057,778 L1058,777 L1065,777 L1066,776 L1072,776 L1080,774 L1103,772 L1104,771 L1112,771 L1113,770 L1127,769 L1128,768 L1149,766 L1150,765 L1157,765 L1165,763 L1173,763 L1174,762 L1190,761 L1191,760 L1205,759 L1213,757 L1223,757 L1224,756 L1256,753 L1257,752 L1264,752 L1265,751 L1272,751 L1273,750 L1316,746 L1324,744 L1332,744 L1333,743 L1341,743 L1342,742 L1350,742 L1351,741 L1359,741 L1360,740 L1369,740 L1370,739 L1378,739 L1379,738 L1387,738 L1388,737 L1398,737 L1399,736 L1416,735 L1417,734 L1424,734 L1425,733 L1434,733 L1440,731 L1440,708 L1441,707 L1440,706 L1442,704 L1513,704 L1514,703 L1524,703 L1527,704 L1528,703 L1657,702 L1658,701 L1695,701ZM1408,720 L1404,722 L1400,721 L1400,652 L1399,651 L1384,649 L1383,648 L1377,648 L1376,647 L1369,647 L1368,646 L1349,644 L1349,726 L1348,727 L1341,727 L1340,728 L1333,728 L1332,729 L1314,730 L1313,729 L1313,640 L1307,638 L1278,635 L1277,634 L1271,634 L1263,632 L1224,628 L1224,738 L1222,740 L1189,743 L1188,744 L1180,744 L1179,745 L1171,745 L1170,746 L1163,746 L1162,747 L1139,749 L1138,750 L1131,750 L1130,751 L1122,751 L1121,752 L1114,752 L1113,753 L1096,754 L1095,753 L1095,611 L1071,608 L1070,607 L1048,605 L1047,604 L1040,604 L1039,603 L1033,603 L1032,602 L1026,602 L1025,601 L1019,601 L1011,599 L1003,599 L995,597 L972,595 L971,594 L959,593 L958,592 L954,592 L953,593 L953,772 L951,774 L937,775 L936,776 L908,779 L900,781 L893,781 L885,783 L877,783 L876,782 L862,781 L861,780 L855,780 L847,778 L840,778 L839,777 L817,775 L816,774 L807,774 L806,773 L800,773 L799,772 L793,772 L785,770 L778,770 L777,769 L770,769 L769,768 L762,768 L761,767 L739,765 L738,764 L730,764 L729,763 L729,606 L714,607 L706,609 L676,612 L675,613 L661,614 L660,615 L646,616 L645,617 L631,618 L630,619 L623,619 L622,620 L622,750 L621,751 L588,748 L587,747 L571,746 L570,745 L562,745 L561,744 L552,744 L551,743 L544,743 L537,741 L537,631 L536,630 L507,633 L506,634 L500,634 L499,635 L485,636 L484,637 L476,638 L476,735 L475,736 L466,736 L465,735 L465,644 L464,643 L464,639 L402,648 L402,729 L401,730 L364,727 L361,725 L361,661 L364,659 L370,659 L371,658 L377,658 L378,657 L394,655 L395,654 L395,650 L394,649 L362,653 L361,654 L355,654 L354,655 L340,656 L339,657 L327,658 L326,659 L318,659 L317,660 L313,660 L312,659 L312,655 L322,652 L342,650 L355,647 L393,643 L406,640 L413,640 L414,639 L420,639 L421,638 L434,637 L435,636 L441,636 L449,634 L456,634 L457,633 L463,633 L471,631 L479,631 L480,630 L492,629 L493,628 L509,627 L510,626 L530,624 L536,622 L552,621 L553,620 L576,618 L583,616 L607,614 L608,613 L615,613 L616,612 L624,612 L632,610 L640,610 L648,608 L671,606 L672,605 L701,602 L702,601 L709,601 L710,600 L716,600 L717,599 L723,599 L731,597 L739,597 L747,595 L755,595 L762,593 L770,593 L771,592 L792,590 L800,588 L832,585 L833,584 L861,581 L862,580 L879,579 L880,578 L887,578 L888,577 L898,577 L906,579 L915,579 L916,580 L923,580 L924,581 L956,584 L963,586 L979,587 L986,589 L1002,590 L1003,591 L1031,594 L1039,596 L1046,596 L1054,598 L1062,598 L1063,599 L1069,599 L1076,601 L1083,601 L1084,602 L1090,602 L1098,604 L1106,604 L1107,605 L1113,605 L1114,606 L1120,606 L1121,607 L1127,607 L1135,609 L1143,609 L1144,610 L1166,612 L1167,613 L1181,614 L1189,616 L1197,616 L1198,617 L1210,618 L1211,619 L1218,619 L1219,620 L1233,621 L1234,622 L1242,622 L1243,623 L1272,626 L1273,627 L1279,627 L1287,629 L1312,631 L1313,632 L1319,632 L1320,633 L1339,635 L1340,636 L1347,636 L1354,638 L1362,638 L1363,639 L1369,639 L1376,641 L1404,644 L1408,646ZM885,440 L886,441 L886,560 L883,562 L875,562 L869,564 L861,564 L853,566 L846,566 L845,567 L817,570 L816,569 L816,460 L819,458 L822,458 L826,456 L829,456 L833,454 L836,454 L840,452 L843,452 L847,450 L858,448 L875,442ZM1339,551 L1339,612 L1338,613 L1338,620 L1337,621 L1332,620 L1330,617 L1330,589 L1331,588 L1331,578 L1330,577 L1331,559 L1330,558 L1330,554 L1316,549 L1283,541 L1276,538 L1269,537 L1251,531 L1248,531 L1248,606 L1246,608 L1238,608 L1237,607 L1230,607 L1222,605 L1215,605 L1214,604 L1208,604 L1207,603 L1201,603 L1200,602 L1194,602 L1193,601 L1187,601 L1186,600 L1180,600 L1172,598 L1149,596 L1142,594 L1135,594 L1128,592 L1086,587 L1085,586 L1066,584 L1065,583 L1058,583 L1057,582 L1035,580 L1034,579 L1021,578 L1020,577 L1014,577 L1013,576 L1007,576 L999,574 L992,574 L991,573 L985,573 L977,571 L963,570 L959,568 L959,524 L958,523 L958,509 L959,508 L959,455 L958,454 L958,448 L955,448 L941,443 L920,438 L891,429 L885,429 L860,437 L843,441 L823,448 L820,448 L813,451 L799,454 L786,459 L779,460 L766,465 L749,469 L743,472 L743,579 L741,581 L709,585 L708,586 L702,586 L701,587 L695,587 L694,588 L688,588 L687,589 L666,591 L665,592 L657,592 L656,593 L650,593 L649,594 L643,594 L635,596 L620,597 L612,599 L604,599 L603,598 L603,583 L602,582 L602,578 L603,577 L603,546 L602,545 L603,543 L603,523 L602,522 L602,513 L600,513 L556,527 L553,527 L543,531 L526,535 L488,548 L485,548 L482,550 L482,564 L480,566 L444,575 L440,577 L429,579 L425,581 L421,581 L414,584 L411,584 L395,589 L395,625 L396,626 L404,624 L416,623 L417,622 L423,622 L424,621 L451,618 L458,616 L464,616 L470,614 L478,614 L479,613 L489,612 L490,611 L490,556 L493,554 L522,547 L543,540 L545,547 L545,599 L544,600 L545,607 L543,609 L525,611 L518,613 L504,614 L503,615 L497,615 L496,616 L477,618 L476,619 L464,620 L463,621 L456,621 L455,622 L429,625 L428,626 L422,626 L421,627 L389,631 L388,632 L376,633 L375,634 L369,634 L362,636 L358,635 L358,583 L360,581 L372,578 L391,571 L394,571 L429,559 L432,559 L435,557 L444,555 L466,547 L469,547 L491,539 L494,539 L506,534 L509,534 L542,523 L545,523 L551,520 L564,517 L577,512 L580,512 L587,509 L590,509 L597,506 L610,503 L616,500 L636,495 L665,485 L679,482 L689,478 L692,478 L728,466 L735,465 L778,451 L785,450 L798,445 L818,440 L828,436 L848,431 L861,426 L870,424 L873,422 L884,420 L887,418 L913,426 L916,426 L926,430 L933,431 L936,433 L957,438 L999,451 L1006,452 L1023,458 L1030,459 L1033,461 L1065,469 L1085,476 L1092,477 L1099,480 L1120,485 L1130,489 L1141,491 L1147,494 L1182,503 L1212,513 L1231,517 L1265,528 L1268,528 L1272,530 L1303,538 L1309,541 L1316,542 L1326,546 L1336,548ZM1248,241 L1248,281 L1249,282 L1295,282 L1296,281 L1296,241 L1295,240 L1249,240ZM1493,178 L1490,184 L1487,195 L1487,246 L1488,247 L1489,255 L1493,263 L1498,270 L1503,274 L1515,280 L1523,282 L1533,282 L1534,283 L1640,282 L1641,280 L1641,250 L1640,246 L1549,246 L1546,245 L1541,240 L1540,237 L1541,234 L1639,234 L1641,226 L1641,198 L1640,197 L1640,191 L1635,178 L1625,167 L1618,163 L1602,159 L1526,159 L1525,160 L1517,161 L1505,166ZM1540,201 L1548,193 L1581,193 L1584,194 L1589,199 L1590,206 L1589,207 L1582,207 L1581,208 L1545,208 L1540,206ZM998,159 L995,161 L995,281 L996,282 L1049,282 L1049,160 L1048,159ZM1059,159 L1059,162 L1114,221 L1105,232 L1062,276 L1059,280 L1059,282 L1126,282 L1150,257 L1160,266 L1174,282 L1241,282 L1241,280 L1190,226 L1187,221 L1243,163 L1244,161 L1243,159 L1178,159 L1151,187 L1125,159 L1119,159 L1118,158 L1117,159ZM865,177 L852,165 L842,161 L834,160 L833,159 L819,159 L818,158 L815,159 L749,159 L748,160 L740,161 L728,166 L715,179 L712,185 L709,196 L709,245 L713,258 L718,266 L725,273 L737,279 L749,282 L831,282 L832,281 L841,280 L853,275 L866,262 L870,254 L872,246 L873,203 L872,202 L871,190ZM765,202 L770,198 L775,196 L805,196 L806,197 L810,197 L816,202 L819,211 L819,231 L816,239 L813,242 L804,245 L777,245 L768,242 L763,236 L763,230 L762,229 L762,211ZM514,177 L508,170 L499,164 L482,159 L456,159 L455,158 L446,158 L445,159 L392,159 L375,164 L365,171 L359,178 L353,193 L353,199 L352,200 L352,240 L353,241 L354,252 L358,261 L372,275 L385,280 L395,281 L396,282 L476,282 L477,281 L483,281 L491,279 L505,272 L513,264 L517,257 L520,248 L520,242 L521,241 L521,197 L520,196 L519,188ZM408,204 L414,198 L420,196 L450,196 L457,198 L463,204 L465,209 L465,232 L463,237 L457,243 L449,245 L422,245 L414,243 L409,239 L406,231 L406,210ZM894,134 L894,158 L893,159 L877,159 L876,160 L876,196 L893,196 L894,197 L894,247 L895,248 L896,257 L901,268 L911,277 L924,282 L929,282 L930,283 L965,283 L966,282 L980,281 L982,279 L982,245 L981,244 L959,245 L954,243 L951,240 L949,234 L949,197 L950,196 L979,196 L979,160 L978,159 L950,159 L949,158 L949,122 L948,121 L924,127 L920,127 L912,130 L899,132ZM134,122 L134,281 L135,282 L191,282 L192,281 L192,230 L193,229 L223,229 L272,282 L345,282 L343,277 L338,273 L295,227 L312,223 L323,217 L333,206 L336,199 L338,191 L338,155 L336,147 L332,139 L324,130 L315,125 L306,122 L289,121 L288,120 L137,120ZM192,163 L193,162 L266,162 L271,164 L275,168 L277,173 L277,178 L275,183 L271,187 L266,189 L193,189 L192,188ZM1311,117 L1310,118 L1310,260 L1311,261 L1310,263 L1310,280 L1311,282 L1358,282 L1362,272 L1372,279 L1383,282 L1435,282 L1448,279 L1458,274 L1467,265 L1471,258 L1474,247 L1474,240 L1475,239 L1474,193 L1471,183 L1465,173 L1458,167 L1451,163 L1435,159 L1390,159 L1375,163 L1366,169 L1365,168 L1365,118 L1364,117ZM1366,200 L1373,196 L1407,196 L1413,198 L1418,203 L1420,209 L1420,232 L1419,233 L1419,237 L1415,242 L1407,245 L1373,245 L1368,243 L1365,239 L1365,202ZM995,118 L995,151 L1049,151 L1049,117 L996,117ZM533,118 L533,281 L534,282 L582,282 L583,276 L585,272 L591,277 L597,280 L605,281 L606,282 L658,282 L674,278 L684,272 L690,266 L697,251 L698,239 L699,238 L699,229 L698,228 L698,193 L697,192 L697,188 L692,177 L684,168 L673,162 L661,159 L613,159 L600,162 L589,169 L588,168 L588,118 L587,117 L534,117ZM593,197 L596,196 L630,196 L638,199 L643,206 L643,234 L641,239 L638,242 L629,245 L598,245 L591,243 L588,239 L588,203Z\"/>\n<path fill=\"#5B95C8\" fill-rule=\"evenodd\" d=\"M1143,328 L1137,334 L1136,337 L1137,342 L1140,346 L1144,348 L1150,348 L1156,343 L1157,340 L1156,333 L1150,328ZM594,328 L588,334 L588,341 L593,347 L601,348 L607,344 L609,338 L608,334 L602,328ZM1591,313 L1590,314 L1609,341 L1609,360 L1617,360 L1618,359 L1618,341 L1635,317 L1636,313 L1635,312 L1628,312 L1614,331 L1612,330 L1605,319 L1599,312 L1598,313ZM1539,312 L1537,314 L1538,321 L1551,321 L1552,322 L1552,358 L1553,360 L1561,360 L1562,359 L1562,322 L1563,321 L1576,321 L1577,320 L1577,313 L1576,312ZM1519,312 L1512,313 L1512,360 L1520,360 L1521,358 L1521,314ZM1453,312 L1452,313 L1452,360 L1460,360 L1461,359 L1461,343 L1462,342 L1469,342 L1483,360 L1492,360 L1493,359 L1481,343 L1482,341 L1487,339 L1490,336 L1492,331 L1492,324 L1489,318 L1484,314 L1477,312ZM1461,322 L1462,321 L1478,321 L1482,324 L1483,329 L1478,334 L1462,334 L1461,333ZM1391,313 L1391,347 L1394,354 L1398,358 L1405,361 L1418,361 L1424,359 L1428,356 L1432,348 L1432,313 L1431,312 L1425,312 L1423,314 L1423,346 L1419,351 L1414,353 L1408,353 L1402,349 L1400,344 L1400,313 L1399,312ZM1273,313 L1273,359 L1274,360 L1308,360 L1308,352 L1283,352 L1282,351 L1282,341 L1283,340 L1305,340 L1306,339 L1306,332 L1283,332 L1282,331 L1282,322 L1283,321 L1306,321 L1308,319 L1308,314 L1306,312 L1275,312ZM1040,313 L1040,359 L1041,360 L1048,360 L1049,359 L1049,345 L1054,341 L1071,360 L1082,360 L1081,357 L1061,335 L1081,313 L1079,312 L1071,312 L1051,331 L1049,330 L1049,313 L1048,312ZM982,312 L981,313 L981,325 L980,326 L980,345 L981,346 L981,356 L980,358 L981,360 L989,360 L990,343 L991,342 L992,343 L993,342 L998,343 L1012,360 L1021,360 L1020,356 L1010,343 L1011,341 L1017,338 L1020,333 L1021,326 L1019,320 L1013,314 L1006,312ZM989,325 L991,321 L1007,321 L1011,324 L1012,328 L1006,334 L991,334 L990,333ZM832,313 L834,322 L838,332 L838,335 L847,360 L854,360 L856,358 L865,330 L867,332 L876,359 L877,360 L884,360 L885,359 L899,315 L898,312 L891,312 L890,313 L885,327 L883,337 L880,343 L870,313 L863,312 L861,314 L854,337 L851,342 L848,336 L841,313 L839,312ZM781,312 L780,313 L780,320 L781,321 L794,321 L795,322 L795,358 L796,360 L804,360 L804,329 L805,328 L805,322 L806,321 L818,321 L820,319 L820,314 L818,312ZM731,312 L729,314 L729,355 L730,356 L730,360 L765,360 L765,353 L764,352 L740,352 L739,351 L739,341 L740,340 L762,340 L763,339 L763,333 L762,332 L740,332 L739,331 L739,322 L740,321 L763,321 L765,319 L764,313 L763,312ZM664,313 L664,359 L665,360 L672,360 L673,359 L673,330 L674,329 L698,360 L707,360 L707,313 L706,312 L698,313 L698,342 L697,343 L673,312 L666,312ZM493,312 L492,314 L508,336 L491,359 L492,360 L501,360 L510,348 L515,344 L527,360 L536,360 L537,358 L521,337 L521,334 L536,315 L536,313 L535,312 L527,312 L514,328 L501,312ZM466,312 L465,313 L465,359 L466,360 L474,360 L474,312ZM410,312 L409,313 L409,319 L413,321 L423,321 L424,322 L424,359 L425,360 L432,360 L433,359 L433,322 L435,320 L436,321 L448,320 L449,319 L449,314 L448,312ZM274,313 L274,323 L273,324 L273,358 L275,360 L282,360 L283,359 L283,336 L284,335 L288,341 L296,358 L302,358 L307,350 L311,340 L313,338 L313,336 L315,334 L316,335 L316,359 L317,360 L324,360 L325,359 L325,313 L324,312 L315,312 L303,338 L299,343 L283,312 L275,312ZM139,312 L138,313 L138,359 L139,360 L161,360 L162,359 L166,359 L172,356 L179,349 L182,343 L182,330 L179,322 L172,315 L164,312ZM148,320 L163,321 L170,326 L173,333 L173,338 L171,344 L165,350 L162,351 L148,351 L147,350 L147,321ZM1344,312 L1339,314 L1330,322 L1326,332 L1327,345 L1330,351 L1338,358 L1346,361 L1357,361 L1368,356 L1371,353 L1371,351 L1366,346 L1361,350 L1354,353 L1349,353 L1343,351 L1338,346 L1336,342 L1336,331 L1338,327 L1343,322 L1348,320 L1358,321 L1365,326 L1368,325 L1371,320 L1366,315 L1359,312 L1354,312 L1353,311ZM1237,311 L1224,313 L1220,315 L1215,322 L1215,330 L1221,337 L1230,340 L1239,341 L1244,345 L1244,348 L1240,352 L1237,353 L1230,353 L1223,350 L1220,347 L1218,347 L1214,352 L1214,354 L1227,361 L1243,360 L1247,358 L1251,354 L1253,350 L1253,341 L1247,335 L1243,333 L1227,330 L1224,327 L1224,324 L1229,320 L1237,320 L1244,323 L1246,325 L1249,323 L1251,318 L1249,316ZM929,312 L922,315 L913,325 L911,331 L911,342 L915,351 L920,356 L927,360 L931,361 L946,360 L952,357 L959,350 L962,344 L962,329 L961,326 L954,317 L947,313 L939,311ZM930,321 L933,320 L944,321 L950,326 L953,333 L952,343 L943,352 L939,353 L930,352 L923,346 L920,339 L921,330 L924,325ZM355,315 L350,320 L345,330 L346,345 L352,354 L360,359 L367,361 L379,360 L387,356 L393,350 L397,340 L397,332 L394,323 L385,314 L377,311 L364,311ZM361,322 L365,320 L376,320 L381,322 L385,326 L387,330 L387,341 L385,345 L380,350 L375,352 L366,352 L358,347 L355,342 L354,333 L357,326ZM215,313 L205,322 L202,329 L201,338 L204,348 L211,356 L219,360 L230,361 L242,357 L249,351 L253,342 L253,336 L254,335 L253,334 L253,328 L250,322 L243,315 L234,311 L221,311ZM218,322 L222,320 L233,320 L237,322 L242,327 L244,332 L244,339 L241,346 L237,350 L232,352 L223,352 L217,349 L213,345 L211,340 L211,332 L213,327Z\"/>\n</svg>";

function rhiUxEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}

function rhiUxDisplay(value, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function rhiUxLocaleCandidates(locale = "en") {
  const normalized = String(locale || "en").trim().replace(/_/g, "-").toLowerCase();
  const base = normalized.split("-")[0] || "en";
  return [...new Set([normalized, base, "en"])];
}

function rhiUxTranslate(resources = {}, key = "", { locale = "en", params = {}, fallback = "" } = {}) {
  const wanted = String(key || "");
  let template = "";
  for (const candidate of rhiUxLocaleCandidates(locale)) {
    const row = resources?.[candidate];
    if (row && Object.prototype.hasOwnProperty.call(row, wanted)) {
      template = String(row[wanted] ?? "");
      break;
    }
  }
  if (!template) template = fallback || wanted;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => rhiUxEscape(rhiUxDisplay(params?.[name], "")));
}

function rhiUxFormatNumber(value, { locale = "en", maximumFractionDigits = 2, minimumFractionDigits = 0 } = {}) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits }).format(Number(value));
}

function rhiUxFormatCurrency(value, currency = "EUR", { locale = "en", maximumFractionDigits = 2 } = {}) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, { style:"currency", currency, maximumFractionDigits }).format(Number(value));
}

function rhiUxFormatPercent(value, { locale = "en", scale = 100, maximumFractionDigits = 1 } = {}) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, { style:"percent", maximumFractionDigits }).format(Number(value) / Number(scale || 100));
}

function rhiUxFormatDateTime(value, { locale = "en", dateStyle = "medium", timeStyle = "short" } = {}) {
  if (value === undefined || value === null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(date);
}

function rhiUxStatusItem({ icon = "•", label = "", value = "—", detail = "" } = {}) {
  const iconMarkup = /^mdi:/.test(String(icon || "")) ? `<ha-icon icon="${rhiUxEscape(icon)}"></ha-icon>` : rhiUxEscape(icon);
  return `<div class="rhiUxStatusItem"><span class="rhiUxStatusIcon">${iconMarkup}</span><div class="rhiUxStatusCopy"><small>${rhiUxEscape(label)}</small><b>${rhiUxEscape(rhiUxDisplay(value))}</b>${detail ? `<em>${rhiUxEscape(detail)}</em>` : ""}</div></div>`;
}

function rhiUxStatusGrid(items = []) {
  return `<section class="rhiUxStatusGrid">${items.map(rhiUxStatusItem).join("")}</section>`;
}

function rhiUxPageHero({ eyebrow = "", title = "", description = "", image = "", imageAlt = "" } = {}) {
  return `<section class="rhiUxPageHero"><div class="rhiUxPageHeroCopy">${eyebrow ? `<small>${rhiUxEscape(eyebrow)}</small>` : ""}<h2>${rhiUxEscape(title)}</h2>${description ? `<p>${rhiUxEscape(description)}</p>` : ""}</div>${image ? `<div class="rhiUxPageHeroArt"><img src="${rhiUxEscape(image)}" alt="${rhiUxEscape(imageAlt)}"></div>` : ""}</section>`;
}

function rhiUxState({ state = "unavailable", title = "Unavailable", detail = "" } = {}) {
  return `<div class="rhiUxState" data-state="${rhiUxEscape(state)}"><b>${rhiUxEscape(title)}</b>${detail ? `<span>${rhiUxEscape(detail)}</span>` : ""}</div>`;
}

function rhiUxConclusion({ title = "", detail = "", label = "Conclusion" } = {}) {
  return `<section class="rhiUxConclusion"><div><small>${rhiUxEscape(label)}</small><h2>${rhiUxEscape(title)}</h2>${detail ? `<p>${rhiUxEscape(detail)}</p>` : ""}</div></section>`;
}

function rhiUxTechnicalFooter({ product = "", uxVersion = "", backendVersion = "", issue = "", severity = "" } = {}) {
  return `<footer class="rhiUxTechnicalFooter"><span>${rhiUxEscape(product)} UX ${rhiUxEscape(uxVersion)}</span><span>Backend ${rhiUxEscape(rhiUxDisplay(backendVersion,"Unknown"))}</span>${issue ? `<span data-severity="${rhiUxEscape(severity)}">${rhiUxEscape(issue)}</span>` : ""}</footer>`;
}

function rhiUxCompanyBrand({ ariaLabel = "Robotix.be — DomotiX · Network · Security" } = {}) {
  return `<span class="rhiUxCompanyLogo" role="img" aria-label="${rhiUxEscape(ariaLabel)}">${RHI_UX_COMPANY_LOGO_SVG}</span>`;
}

function rhiUxDomainShell({ product = "Home Intelligence", domain = "", modules = [], activeModule = "", activeItem = "", brandHtml = rhiUxCompanyBrand() } = {}) {
  const selected = modules.find(row => String(row.id || "") === String(activeModule || "")) || modules[0] || { items:[] };
  const moduleButtons = modules.map(row => {
    const active = String(row.id || "") === String(selected.id || "");
    return `<button type="button" class="rhiUxModuleTab${active ? " active" : ""}" data-rhi-module="${rhiUxEscape(row.id || "")}"${row.target ? ` data-nav="${rhiUxEscape(row.target)}"` : ""}><span>${rhiUxEscape(row.label || row.id || "")}</span></button>`;
  }).join("");
  const itemButtons = (selected.items || []).map(row => {
    const active = String(row.id || "") === String(activeItem || "");
    return `<button type="button" class="rhiUxDomainTab${active ? " active" : ""}" data-rhi-item="${rhiUxEscape(row.id || "")}"${row.target ? ` data-nav="${rhiUxEscape(row.target)}"` : ""}><span>${rhiUxEscape(row.label || row.id || "")}</span></button>`;
  }).join("");
  return `<header class="rhiUxDomainShell"><div class="rhiUxProductArea"><div class="rhiUxDomainShellTop"><div class="rhiUxDomainIdentity"><span>${rhiUxEscape(product)}</span><strong>${rhiUxEscape(domain)}</strong></div><nav class="rhiUxModuleTabs" aria-label="Modules">${moduleButtons}</nav></div><div class="rhiUxDomainShellBottom"><nav class="rhiUxDomainTabs" aria-label="${rhiUxEscape(selected.label || domain || "Domain")} navigation">${itemButtons}</nav></div></div>${brandHtml ? `<div class="rhiUxCompanyBrand">${brandHtml}</div>` : ""}</header>`;
}


function rhiUxQuickActionBar({ label = "Quick actions", actions = [] } = {}) {
  const visibleActions = actions.filter(action => action?.visible !== false);
  if (!visibleActions.length) return "";
  return `<section class="rhiUxQuickActionBar" aria-label="${rhiUxEscape(label)}"><small>${rhiUxEscape(label)}</small><div class="rhiUxQuickActions">${visibleActions.map((action,index) => {
    const disabled = action.enabled === false || action.disabled === true;
    const reason = String(action.reason || "");
    return `<button type="button" class="rhiUxQuickAction${action.primary || index === 0 ? " primary" : ""}"${action.target ? ` data-nav="${rhiUxEscape(action.target)}"` : ""}${disabled ? " disabled" : ""}${reason ? ` title="${rhiUxEscape(reason)}"` : ""}>${action.icon ? `<ha-icon icon="${rhiUxEscape(action.icon)}"></ha-icon>` : ""}<span>${rhiUxEscape(action.label || "Open")}</span></button>`;
  }).join("")}</div></section>`;
}

function rhiUxContextBar({ label = "View", controls = [], controlsId = "" } = {}) {
  if (!Array.isArray(controls) || controls.length === 0) return "";
  const labelled = label ? `<small>${rhiUxEscape(label)}</small>` : "";
  const body = controls.filter(control => control?.visible !== false).map((control,index) => {
    const attrs = [];
    if (control.value !== undefined) attrs.push(`data-value="${rhiUxEscape(control.value)}"`);
    if (control.target) attrs.push(`data-nav="${rhiUxEscape(control.target)}"`);
    if (control.pressed !== undefined) attrs.push(`aria-pressed="${control.pressed ? "true" : "false"}"`);
    if (control.enabled === false || control.disabled) attrs.push("disabled");
    if (control.reason) attrs.push(`title="${rhiUxEscape(control.reason)}"`);
    const cls = `rhiUxContextControl${control.active || control.pressed ? " active" : ""}`;
    return `<button type="button" class="${cls}" ${attrs.join(" ")}>${rhiUxEscape(control.label || control.value || `Option ${index+1}`)}</button>`;
  }).join("");
  const idAttr = controlsId ? ` aria-controls="${rhiUxEscape(controlsId)}"` : "";
  return `<section class="rhiUxContextBar" aria-label="${rhiUxEscape(label || "View controls")}"${idAttr}>${labelled}<div class="rhiUxContextControls">${body}</div></section>`;
}


function rhiUxPageTemplate({ hero = "", status = "", actions = "", context = "", content = "", className = "" } = {}) {
  return `<main class="rhiUxPage rhiUxPageStack ${rhiUxEscape(className)}">${hero}${status}${actions}${context}<section class="rhiUxPageContent">${content}</section></main>`;
}

function rhiUxAssetCardShell({ identity = "", facts = "", relationships = "", actions = "", details = "", feedback = "", className = "" } = {}) {
  const cls = ["rhiUxAssetCardShell", String(className || "").trim()].filter(Boolean).join(" ");
  const body = [
    identity ? `<div class="rhiUxAssetCardIdentity">${identity}</div>` : "",
    facts ? `<div class="rhiUxAssetCardFacts">${facts}</div>` : "",
    relationships ? `<div class="rhiUxAssetCardRelationships">${relationships}</div>` : "",
    actions ? `<div class="rhiUxAssetCardActions">${actions}</div>` : "",
    details ? `<div class="rhiUxAssetCardDetails">${details}</div>` : "",
    feedback ? `<div class="rhiUxAssetCardFeedback">${feedback}</div>` : ""
  ].join("");
  return `<article class="${rhiUxEscape(cls)}">${body}</article>`;
}

function rhiUxAssetIdentity({ eyebrow = "", title = "", subtitle = "", visual = "" } = {}) {
  return `<header class="rhiUxAssetIdentity">${visual ? `<div class="rhiUxAssetVisual">${visual}</div>` : ""}<div class="rhiUxAssetIdentityCopy">${eyebrow ? `<small>${rhiUxEscape(eyebrow)}</small>` : ""}<h2>${rhiUxEscape(title)}</h2>${subtitle ? `<p>${rhiUxEscape(subtitle)}</p>` : ""}</div></header>`;
}

function rhiUxAssetFactGrid(items = []) {
  return `<div class="rhiUxAssetFactGrid">${items.map(item => `<div class="rhiUxAssetFact"><small>${rhiUxEscape(item?.label || "")}</small><b>${rhiUxEscape(rhiUxDisplay(item?.value))}</b>${item?.detail ? `<span>${rhiUxEscape(item.detail)}</span>` : ""}</div>`).join("")}</div>`;
}

function rhiUxAssetRelationship({ label = "", value = "", detail = "", target = "" } = {}) {
  return `<div class="rhiUxAssetRelationship"><div><small>${rhiUxEscape(label)}</small><b>${rhiUxEscape(rhiUxDisplay(value))}</b>${detail ? `<span>${rhiUxEscape(detail)}</span>` : ""}</div>${target ? `<button type="button" data-nav="${rhiUxEscape(target)}">Open</button>` : ""}</div>`;
}

function rhiUxAssetDisclosure({ title = "Details", content = "", open = false } = {}) {
  return `<details class="rhiUxAssetDisclosure"${open ? " open" : ""}><summary>${rhiUxEscape(title)}</summary><div>${content}</div></details>`;
}

function rhiUxWriteFeedback({ state = "idle", message = "" } = {}) {
  if (!message) return "";
  return `<div class="rhiUxWriteFeedback" data-state="${rhiUxEscape(state)}" role="status">${rhiUxEscape(message)}</div>`;
}




const RHI_UX_NAVIGATION_STORAGE_KEY = "rhi.navigation.registry.v1";

function rhiUxReadNavigationRegistry(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(RHI_UX_NAVIGATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function rhiUxRegisterDomainNavigation({ domain = "", assetDetailTemplate = "" } = {}, storage = globalThis?.localStorage) {
  const key = String(domain || "").trim();
  const template = String(assetDetailTemplate || "").trim();
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(key)) return false;
  if (!template || !template.includes("{asset_id}")) return false;
  if (/^https?:\/\//i.test(template)) return false;
  try {
    const registry = rhiUxReadNavigationRegistry(storage);
    registry[key] = { asset_detail_template:template };
    storage?.setItem?.(RHI_UX_NAVIGATION_STORAGE_KEY, JSON.stringify(registry));
    return true;
  } catch (_) {
    return false;
  }
}

function rhiUxResolveDomainAssetNavigation(domain = "", assetId = "", storage = globalThis?.localStorage) {
  const key = String(domain || "").trim();
  const id = String(assetId || "").trim();
  if (!key || !id) return "";
  const row = rhiUxReadNavigationRegistry(storage)[key];
  const template = String(row?.asset_detail_template || "");
  if (!template.includes("{asset_id}")) return "";
  return template.replaceAll("{asset_id}", encodeURIComponent(id));
}


function rhiUxVisualPickerStyles() {
  return `
.rhiUxVisualPickerBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.44);display:grid;place-items:center;padding:20px}
.rhiUxVisualPickerPanel{width:min(920px,94vw);max-height:min(82vh,760px);overflow:hidden;background:#fff;border:1px solid var(--rhi-color-line,#e5ebf3);border-radius:20px;box-shadow:0 30px 80px rgba(15,23,42,.24);padding:16px;box-sizing:border-box;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:10px}
.rhiUxVisualPickerHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;min-height:0}
.rhiUxVisualPickerHead small{font-size:var(--rhi-font-label);font-weight:800;letter-spacing:.12em;color:#64748b}.rhiUxVisualPickerHead h3{margin:2px 0 0;font-size:20px}.rhiUxVisualPickerHead p{margin:3px 0 0;font-size:11px;color:#64748b}
.rhiUxVisualPickerFilters{display:flex;gap:6px;flex-wrap:wrap;margin:0;min-height:0}
.rhiUxVisualPickerFilters button{border:1px solid #dbe3ee;background:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer}.rhiUxVisualPickerFilters button.selected{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}
.rhiUxVisualChoiceGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:142px;gap:8px;margin:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 4px 1px;align-content:start}
.rhiUxVisualChoice{height:142px;min-height:142px;max-height:142px;display:grid;grid-template-rows:86px minmax(0,1fr);gap:6px;align-items:stretch;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:8px;cursor:pointer;overflow:hidden}.rhiUxVisualChoice:hover{border-color:#93c5fd;background:#f8fbff}.rhiUxVisualChoice.selected{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);background:#f8fbff}
.rhiUxVisualChoiceImage{width:100%;height:86px;min-width:0;min-height:86px;max-width:none;max-height:86px;display:grid;place-items:center;overflow:hidden}.rhiUxVisualChoiceImage img{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;max-height:100%;object-fit:contain;object-position:center}
.rhiUxVisualChoiceCopy{min-width:0;align-self:end}.rhiUxVisualChoiceCopy small,.rhiUxVisualChoiceCopy b,.rhiUxVisualChoiceCopy em{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhiUxVisualChoiceCopy small{font-size:var(--rhi-font-label);color:#64748b;text-transform:uppercase}.rhiUxVisualChoiceCopy b{font-size:12px;margin-top:1px}.rhiUxVisualChoiceCopy em{font-size:var(--rhi-font-small);color:#64748b;font-style:normal;margin-top:1px}
.rhiUxVisualPickerRefine{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:0}.rhiUxVisualPickerRefine label span{display:block;font-size:var(--rhi-font-label);color:#64748b;margin-bottom:3px}.rhiUxVisualPickerRefine select{width:100%;height:34px;border:1px solid #dbe3ee;border-radius:8px;background:#fff;padding:0 8px}
.rhiUxVisualPickerFooter{display:flex;align-items:center;gap:8px;margin:0;padding-top:9px;border-top:1px solid #edf1f6}.rhiUxVisualPickerSpacer{flex:1}.rhiUxVisualPickerFooter button{height:34px;border:1px solid #dbe3ee;border-radius:9px;background:#fff;padding:0 12px;font-size:var(--rhi-font-small);font-weight:700}.rhiUxVisualPickerFooter button.primary{background:#0b65ea;color:#fff;border-color:#0b65ea}.rhiUxVisualPickerFooter button:disabled{opacity:.45}
@media(max-width:900px){.rhiUxVisualChoiceGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.rhiUxVisualPickerBackdrop{padding:8px}.rhiUxVisualPickerPanel{width:96vw;max-height:88vh;padding:12px}.rhiUxVisualChoiceGrid{grid-template-columns:1fr;grid-auto-rows:116px}.rhiUxVisualChoice{height:116px;min-height:116px;max-height:116px;grid-template-columns:94px minmax(0,1fr);grid-template-rows:1fr}.rhiUxVisualChoiceImage{width:94px;height:86px;min-width:94px;max-width:94px}.rhiUxVisualChoiceCopy{align-self:center}.rhiUxVisualPickerRefine{grid-template-columns:1fr 1fr}.rhiUxVisualPickerFooter{flex-wrap:wrap}}
`;
}

function rhiUxVisualPickerShell({
  eyebrow = "Appearance",
  title = "Choose appearance",
  description = "",
  filtersHtml = "",
  choicesHtml = "",
  refineHtml = "",
  selectedHtml = "",
  resetHtml = "",
  cancelHtml = "",
  saveHtml = "",
  modal = false,
  closeHtml = ""
} = {}) {
  const panel = `<section class="rhiUxVisualPickerPanel" role="${modal ? "dialog" : "region"}"${modal ? ' aria-modal="true"' : ""}>
    <header class="rhiUxVisualPickerHead"><div><small>${rhiUxEscape(eyebrow)}</small><h3>${rhiUxEscape(title)}</h3>${description ? `<p>${rhiUxEscape(description)}</p>` : ""}</div>${closeHtml}</header>
    ${filtersHtml ? `<div class="rhiUxVisualPickerFilters">${filtersHtml}</div>` : ""}
    <div class="rhiUxVisualChoiceGrid">${choicesHtml}</div>
    ${refineHtml ? `<div class="rhiUxVisualPickerRefine">${refineHtml}</div>` : ""}
    <footer class="rhiUxVisualPickerFooter">${resetHtml}<span class="rhiUxVisualPickerSpacer"></span>${selectedHtml}${cancelHtml}${saveHtml}</footer>
  </section>`;
  return modal ? `<div class="rhiUxVisualPickerBackdrop">${panel}</div>` : panel;
}


function rhiUxVisualFilterButtons({ values = [], active = "all", allLabel = "All", attribute = "data-rhi-visual-filter" } = {}) {
  const rows = [{ value:"all", label:allLabel }, ...values.map(value => typeof value === "object" ? value : { value, label:value })];
  return rows.map(row => { const value=String(row?.value ?? ""); const label=String(row?.label ?? value); const selected=value===String(active ?? "all"); return `<button type="button" class="${selected ? "selected" : ""}" ${rhiUxEscape(attribute)}="${rhiUxEscape(value)}" aria-pressed="${selected ? "true" : "false"}">${rhiUxEscape(label)}</button>`; }).join("");
}
function rhiUxVisualChoice({ id = "", image = "", imageAlt = "", eyebrow = "", label = "", detail = "", selected = false, imageStyle = "", attributes = {} } = {}) {
  const attrs=Object.entries(attributes || {}).filter(([key])=>/^data-[a-z0-9_-]+$/i.test(String(key))).map(([key,value])=>`${rhiUxEscape(key)}="${rhiUxEscape(value)}"`).join(" "); const style=imageStyle ? ` style="${rhiUxEscape(imageStyle)}"` : "";
  return `<button type="button" class="rhiUxVisualChoice${selected ? " selected" : ""}" data-rhi-visual-choice="${rhiUxEscape(id)}" ${attrs} aria-pressed="${selected ? "true" : "false"}><span class="rhiUxVisualChoiceImage">${image ? `<img src="${rhiUxEscape(image)}" alt="${rhiUxEscape(imageAlt)}"${style}>` : ""}</span><span class="rhiUxVisualChoiceCopy">${eyebrow ? `<small>${rhiUxEscape(eyebrow)}</small>` : ""}<b>${rhiUxEscape(label)}</b>${detail ? `<em>${rhiUxEscape(detail)}</em>` : ""}</span></button>`;
}
function rhiUxVisualSelect({ label = "", value = "", options = [], placeholder = "", disabled = false, attribute = "data-rhi-visual-select" } = {}) {
  const current=String(value ?? ""); const first=placeholder ? `<option value="" ${current ? "" : "selected"} disabled>${rhiUxEscape(placeholder)}</option>` : ""; const rows=options.map(row=>typeof row==="object" ? row : {value:row,label:row}).map(row=>`<option value="${rhiUxEscape(row.value)}" ${String(row.value)===current ? "selected" : ""}>${rhiUxEscape(row.label ?? row.value)}</option>`).join(""); return `<label><span>${rhiUxEscape(label)}</span><select ${rhiUxEscape(attribute)}="1" ${disabled ? "disabled" : ""}>${first}${rows}</select></label>`;
}

function rhiUxCoreStyles() {
  return "/* RHI UX Core 1.6.3 */\n:host,.rhi-ux-root{\n  --rhi-color-primary:#1467F5;\n  --rhi-color-primary-soft:#EAF3FF;\n  --rhi-color-text:#0F172A;\n  --rhi-color-muted:#64748B;\n  --rhi-color-muted-soft:#758399;\n  --rhi-color-line:#DCE5EF;\n  --rhi-color-line-soft:#EAF0F6;\n  --rhi-color-surface:#FFFFFF;\n  --rhi-color-surface-soft:#F8FAFC;\n  --rhi-color-ok:#22C55E;\n  --rhi-color-attention:#F59E0B;\n  --rhi-color-error:#B42318;\n  --rhi-color-unknown:#94A3B8;\n\n  --rhi-font-family:var(--ha-font-family-body,Roboto,Noto,sans-serif);\n  --rhi-font-family-mono:var(--ha-font-family-code,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);\n  --rhi-font-display:clamp(29px,2.55vw,42px);\n  --rhi-font-section:clamp(18px,1.4vw,22px);\n  --rhi-font-card:15px;\n  --rhi-font-body:12.5px;\n  --rhi-font-small:11px;\n  --rhi-font-label:10.5px;\n  --rhi-font-value:13px;\n  --rhi-font-diagnostic:10px;\n  --rhi-weight-regular:400;\n  --rhi-weight-medium:500;\n  --rhi-weight-strong:600;\n  --rhi-line-height-tight:1.15;\n  --rhi-line-height-body:1.42;\n\n  --rhi-space-1:4px;\n  --rhi-space-2:7px;\n  --rhi-space-3:10px;\n  --rhi-space-4:14px;\n  --rhi-space-5:18px;\n  --rhi-space-6:24px;\n  --rhi-radius-sm:9px;\n  --rhi-radius-md:12px;\n  --rhi-radius-lg:16px;\n  --rhi-radius-xl:20px;\n  --rhi-shadow-sm:0 4px 14px rgba(21,61,115,.025);\n  --rhi-shadow-md:0 7px 20px rgba(15,35,80,.035);\n  --rhi-page-max:1640px;\n  --rhi-page-pad-x:24px;\n  --rhi-page-pad-y:14px;\n  --rhi-control-h:38px;\n  --rhi-icon-action:18px;\n  --rhi-icon-status:24px;\n  --rhi-break-phone:430px;\n  --rhi-break-tablet:760px;\n  --rhi-break-desktop:1024px;\n  --rhi-domain-accent:var(--rhi-color-primary);\n\n  color:var(--rhi-color-text);\n  font-family:var(--rhi-font-family);\n  font-size:var(--rhi-font-body);\n  font-weight:var(--rhi-weight-regular);\n  line-height:var(--rhi-line-height-body);\n}\n\n.rhiUxDomainShell{\n  --rhi-nav-active-bg:var(--rhi-color-primary-soft);\n  --rhi-nav-active-border:#CFDEF1;\n  --rhi-nav-active-text:#0F4CA4;\n  position:relative;display:grid;grid-template-columns:minmax(0,1fr) clamp(190px,23%,280px);\n  width:100%;margin:0 0 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-xl);\n  background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(249,251,254,.91));box-shadow:var(--rhi-shadow-md);overflow:hidden;\n}\n.rhiUxProductArea{min-width:0;overflow:hidden}\n.rhiUxDomainShellTop{min-height:68px;display:grid;grid-template-columns:minmax(168px,.52fr) minmax(0,1.48fr);align-items:center;gap:14px;padding:10px 22px 9px}\n.rhiUxDomainIdentity{display:grid;align-content:center;gap:2px;min-width:0;min-height:48px;padding:2px 0 0 4px}\n.rhiUxDomainIdentity span{font-size:13px;line-height:1.15;font-weight:var(--rhi-weight-regular);color:#58708F;white-space:nowrap}\n.rhiUxDomainIdentity strong{font-size:21px;line-height:1.03;letter-spacing:.045em;font-weight:var(--rhi-weight-strong);color:#0B467F;white-space:nowrap}\n.rhiUxModuleTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-width:0}\n.rhiUxModuleTab,.rhiUxDomainTab{appearance:none;border:0;background:transparent;font:inherit;color:#53647D;cursor:pointer;white-space:nowrap}\n.rhiUxModuleTab{min-height:40px;border-radius:12px;padding:8px;font-size:12px;font-weight:var(--rhi-weight-medium)}\n.rhiUxModuleTab.active{background:var(--rhi-nav-active-bg);color:var(--rhi-nav-active-text);box-shadow:inset 0 0 0 1px var(--rhi-nav-active-border),0 6px 16px rgba(15,23,42,.035)}\n.rhiUxDomainShellBottom{padding:5px 22px 7px;border-top:1px solid var(--rhi-color-line-soft);background:rgba(255,255,255,.52);min-height:46px;box-sizing:border-box}\n.rhiUxDomainTabs{display:flex;align-items:center;gap:10px;min-height:34px;overflow-x:auto;scrollbar-width:none}\n.rhiUxDomainTabs::-webkit-scrollbar{display:none}\n.rhiUxDomainTab{flex:0 0 auto;min-height:34px;border-radius:11px;padding:7px 12px;font-size:11.5px;font-weight:var(--rhi-weight-medium);color:#5F6D80}\n.rhiUxDomainTab.active{background:var(--rhi-nav-active-bg);color:var(--rhi-nav-active-text);box-shadow:inset 0 0 0 1px var(--rhi-nav-active-border)}\n.rhiUxCompanyBrand{min-width:0;border-left:1px solid var(--rhi-color-line-soft);display:grid;place-items:center;padding:10px 16px;background:linear-gradient(180deg,rgba(252,254,255,.78),rgba(247,250,253,.58))}\n.rhiUxCompanyLogo{display:block;width:min(100%,250px);max-height:116px;line-height:0;overflow:hidden}\n.rhiUxCompanyLogo svg{display:block;width:100%;height:auto;max-height:116px;object-fit:contain;object-position:center}\n\n/* Canonical page stack: visual order is invariant across domains. */\n.rhiUxPageStack{display:flex;flex-direction:column}\n.rhiUxPageStack>.rhiUxPageHero{order:1}\n.rhiUxPageStack>.rhiUxStatusGrid{order:2}\n.rhiUxPageStack>.rhiUxQuickActionBar{order:3}\n\n/* Canonical page hero: image is one background layer, never a split side panel. */\n.rhiUxPageHero{\n  position:relative;display:block;height:146px;min-height:146px;overflow:hidden;\n  border:0;border-radius:var(--rhi-radius-lg);background:#fff;box-shadow:none;margin:0;\n}\n.rhiUxPageHeroCopy{\n  position:relative;z-index:4;width:min(48%,650px);max-width:none;padding:20px 18px 18px 22px;box-sizing:border-box;\n}\n.rhiUxPageHeroCopy>small{display:none}\n.rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{\n  margin:4px 0 8px;font-size:var(--rhi-font-display);line-height:1.02;letter-spacing:-.038em;\n  color:#0B1739;font-weight:var(--rhi-weight-strong);\n}\n.rhiUxPageHeroCopy p{\n  margin:0;max-width:520px;font-size:clamp(12.5px,1.05vw,15px);line-height:var(--rhi-line-height-body);\n  color:#536781;font-weight:var(--rhi-weight-regular);\n}\n.rhiUxPageHeroArt{position:absolute;z-index:1;inset:0 0 0 28%;display:block;overflow:hidden;pointer-events:none}\n.rhiUxPageHeroArt:before{\n  content:\"\";display:block;position:absolute;z-index:2;inset:0;\n  background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.95) 8%,rgba(255,255,255,.62) 19%,rgba(255,255,255,.10) 38%,rgba(255,255,255,0) 57%);\n}\n.rhiUxPageHeroArt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 52%;transform:none}\n\n/* One canonical page status layer. */\n.rhiUxStatusGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:7px 0 0;padding:0;border:0;background:transparent;box-shadow:none}\n.rhiUxStatusItem{\n  min-width:0;min-height:68px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;\n  padding:10px 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:#fff;box-shadow:var(--rhi-shadow-md);\n}\n.rhiUxStatusIcon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:#F0F5FC;color:#355D96;font-size:18px}\n.rhiUxStatusIcon ha-icon{--mdc-icon-size:var(--rhi-icon-status)}\n.rhiUxStatusCopy{min-width:0;display:block}\n.rhiUxStatusCopy small{display:block;margin:0 0 2px;color:#476487;font-size:var(--rhi-font-label);font-weight:var(--rhi-weight-medium);line-height:1.2}\n.rhiUxStatusCopy b{display:block;margin:0 0 2px;color:var(--rhi-color-text);font-size:clamp(14px,1.12vw,17px);font-weight:var(--rhi-weight-strong);line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.rhiUxStatusCopy em{display:block;margin-top:2px;color:var(--rhi-color-muted);font-size:var(--rhi-font-small);font-style:normal;font-weight:var(--rhi-weight-regular);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n\n/* Canonical page-level quick actions. */\n.rhiUxQuickActionBar,.rhiEnergyQuickActions,.rhi-top-actions{\n  min-height:48px;padding:5px 8px;margin:7px 0 0;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);\n  background:#fff;box-shadow:var(--rhi-shadow-sm);display:flex;align-items:center;gap:7px;flex-wrap:wrap;\n}\n.rhiUxQuickActionBar>small,.rhiEnergyQuickActions>small,.rhi-top-actions-title{\n  font-size:var(--rhi-font-label);letter-spacing:.10em;text-transform:uppercase;color:#476487;\n  font-weight:var(--rhi-weight-medium);margin-right:2px;white-space:nowrap;\n}\n.rhiUxQuickActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0}\n.rhiUxQuickAction,.rhiUxQuickActionBar button,.rhiEnergyQuickActions .hiAction,.rhi-top-action{\n  height:36px;min-height:36px;border:1px solid #D6E0EB;border-radius:9px;background:#fff;color:#125DB7;\n  box-shadow:none;font:inherit;font-size:11.5px;font-weight:var(--rhi-weight-medium);padding:0 12px;\n  display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap;\n}\n.rhiUxQuickAction.primary,.rhiUxQuickActionBar button:first-of-type,.rhiEnergyQuickActions .hiAction:first-of-type,.rhi-top-action.primary{\n  background:var(--rhi-color-primary);border-color:var(--rhi-color-primary);color:#fff;\n}\n.rhiUxQuickAction:disabled,.rhiEnergyQuickActions .hiAction:disabled,.rhi-top-action:disabled{opacity:.46}\n\n/* Canonical body grammar. */\n.rhiUxDomainBody{font-family:var(--rhi-font-family);color:var(--rhi-color-text);font-size:var(--rhi-font-body);line-height:var(--rhi-line-height-body)}\n.rhiUxDomainBody button,.rhiUxDomainBody select,.rhiUxDomainBody input,.rhiUxDomainBody textarea{font-family:inherit}\n.rhiUxPanel,.rhiUxDomainBody .panel,.rhiUxDomainBody .info,.rhiUxDomainBody .summary,.rhiUxDomainBody .ov-panel{\n  border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface);box-shadow:var(--rhi-shadow-sm);\n}\n.rhiUxPanel{padding:14px 16px}\n.rhiUxDomainBody .panel h2,.rhiUxDomainBody .info h2,.rhiUxDomainBody .summary h2,.rhiUxDomainBody .ov-panel h2{\n  font-size:var(--rhi-font-section);font-weight:var(--rhi-weight-strong);line-height:var(--rhi-line-height-tight);letter-spacing:-.02em;color:var(--rhi-color-text);\n}\n.rhiUxDomainBody .panel h3,.rhiUxDomainBody .info h3,.rhiUxDomainBody .summary h3,.rhiUxDomainBody .ov-panel h3{\n  font-size:var(--rhi-font-card);font-weight:var(--rhi-weight-strong);line-height:1.2;color:var(--rhi-color-text);\n}\n.rhiUxDomainBody .panel p,.rhiUxDomainBody .info p,.rhiUxDomainBody .summary p,.rhiUxDomainBody .ov-panel p{\n  font-size:var(--rhi-font-body);font-weight:var(--rhi-weight-regular);line-height:var(--rhi-line-height-body);color:var(--rhi-color-muted);\n}\n.rhiUxDataList{display:grid;gap:6px}\n.rhiUxDataRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 10px;border:1px solid var(--rhi-color-line-soft);border-radius:var(--rhi-radius-sm);background:var(--rhi-color-surface-soft)}\n.rhiUxState{display:grid;gap:4px;padding:14px 16px;border:1px dashed var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface-soft);color:var(--rhi-color-muted)}\n.rhiUxState b{color:var(--rhi-color-text);font-size:13px}\n.rhiUxState[data-state=\"attention\"]{border-color:#F6D48C;background:#FFFBEB}\n.rhiUxState[data-state=\"error\"]{border-color:#F1B8B4;background:#FFF7F7}\n.rhiUxConclusion{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin:8px 0 0;padding:10px 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(247,250,252,.96))}\n.rhiUxConclusion small{font-size:var(--rhi-font-label);letter-spacing:.1em;text-transform:uppercase;color:var(--rhi-color-muted)}\n.rhiUxConclusion h2{font-size:var(--rhi-font-card);line-height:1.2;margin:1px 0 2px}\n.rhiUxConclusion p{font-size:var(--rhi-font-small);line-height:1.3;margin:0;color:var(--rhi-color-muted)}\n.rhiUxTechnicalFooter{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 9px;margin:6px 0 0;padding:3px 2px 0;border-top:1px solid rgba(148,163,184,.20);color:#94A3B8;font-size:9px;line-height:1.2}\n.rhiUxTechnicalFooter span+span:before{content:\"·\";margin-right:9px;color:#CBD5E1}\n.rhiUxTechnicalFooter [data-severity=\"warning\"]{color:#B7791F;font-weight:var(--rhi-weight-strong)}\n.rhiUxTechnicalFooter [data-severity=\"error\"]{color:var(--rhi-color-error);font-weight:var(--rhi-weight-strong)}\n\n@media(max-width:1180px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:18px}\n  .rhiUxPageHero{height:140px;min-height:140px}\n  .rhiUxPageHeroCopy{width:51%;padding:18px 14px 16px 18px}\n  .rhiUxPageHeroArt{inset:0 0 0 30%}\n  .rhiUxStatusItem{grid-template-columns:40px minmax(0,1fr);padding:9px 10px;min-height:66px}\n  .rhiUxStatusIcon{width:37px;height:37px}\n}\n@media(max-width:760px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:10px;--rhi-page-pad-y:9px;--rhi-font-body:12px;--rhi-font-small:10.75px}\n  .rhiUxDomainShell{grid-template-columns:1fr}.rhiUxCompanyBrand{display:none}.rhiUxDomainShellTop{grid-template-columns:1fr;padding:10px 12px}.rhiUxDomainIdentity{min-height:auto}.rhiUxDomainShellBottom{padding:7px 12px 9px}\n  .rhiUxPageHero{height:128px;min-height:128px;border-radius:14px}\n  .rhiUxPageHeroCopy{width:59%;padding:18px 9px 16px 13px}\n  .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:27px;letter-spacing:-.032em}\n  .rhiUxPageHeroCopy p{font-size:11px;line-height:1.32;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n  .rhiUxPageHeroArt{inset:0 0 0 34%}\n  .rhiUxStatusGrid{grid-template-columns:repeat(2,minmax(0,1fr))}\n  .rhiUxStatusItem{min-height:74px;grid-template-columns:34px minmax(0,1fr);gap:7px;padding:8px}\n  .rhiUxStatusIcon{width:32px;height:32px;border-radius:9px}.rhiUxStatusIcon ha-icon{--mdc-icon-size:20px}\n  .rhiUxQuickActionBar,.rhiEnergyQuickActions,.rhi-top-actions{overflow-x:auto;flex-wrap:nowrap}\n  .rhiUxQuickActionBar>small,.rhiEnergyQuickActions>small,.rhi-top-actions-title,.rhiUxQuickAction,.rhiUxQuickActionBar button,.rhiEnergyQuickActions .hiAction,.rhi-top-action{flex:0 0 auto}\n  .rhiUxConclusion{grid-template-columns:1fr}\n}\n@media(max-width:430px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:8px;--rhi-page-pad-y:8px}\n  .rhiUxPageHero{height:118px;min-height:118px}\n  .rhiUxPageHeroCopy{width:64%;padding:16px 8px 14px 11px}\n  .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:24px}\n  .rhiUxPageHeroCopy p{font-size:10.5px;-webkit-line-clamp:2}\n  .rhiUxPageHeroArt{inset:0 0 0 38%}\n  .rhiUxStatusGrid{grid-template-columns:1fr 1fr}\n}\n\n/* Optional body/section-scoped view and filter controls. */\n.rhiUxContextBar{\n  min-height:42px;padding:4px 7px;margin:0 0 8px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);\n  background:#fff;box-shadow:var(--rhi-shadow-sm);display:flex;align-items:center;gap:7px;flex-wrap:wrap;\n}\n.rhiUxContextBar>small{\n  font-size:var(--rhi-font-label);letter-spacing:.10em;text-transform:uppercase;color:#476487;font-weight:var(--rhi-weight-medium);white-space:nowrap;\n}\n.rhiUxContextControls{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.rhiUxContextControl{\n  min-height:32px;border:1px solid #D6E0EB;border-radius:9px;background:#fff;color:#355D96;font:inherit;font-size:11.5px;font-weight:var(--rhi-weight-medium);padding:0 11px;cursor:pointer;white-space:nowrap;\n}\n.rhiUxContextControl.active,.rhiUxContextControl[aria-pressed=\"true\"]{background:var(--rhi-color-primary-soft);border-color:#CFDEF1;color:#0F4CA4}\n.rhiUxContextControl:disabled{opacity:.46}\n@media(max-width:760px){.rhiUxContextBar{overflow-x:auto;flex-wrap:nowrap}.rhiUxContextBar>small,.rhiUxContextControls,.rhiUxContextControl{flex:0 0 auto}}\n\n/* Canonical cross-domain appearance picker. Domains own catalogs and persistence. */\n.rhiUxVisualPickerBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.44);display:grid;place-items:center;padding:20px}\n.rhiUxVisualPickerPanel{width:min(920px,94vw);max-height:min(82vh,760px);overflow:hidden;background:#fff;border:1px solid var(--rhi-color-line);border-radius:20px;box-shadow:0 30px 80px rgba(15,23,42,.24);padding:16px;box-sizing:border-box;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:10px}\n.rhiUxVisualPickerHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;min-height:0}\n.rhiUxVisualPickerHead small{font-size:var(--rhi-font-label);font-weight:800;letter-spacing:.12em;color:#64748b}.rhiUxVisualPickerHead h3{margin:2px 0 0;font-size:20px}.rhiUxVisualPickerHead p{margin:3px 0 0;font-size:11px;color:#64748b}\n.rhiUxVisualPickerFilters{display:flex;gap:6px;flex-wrap:wrap;margin:0;min-height:0}\n.rhiUxVisualPickerFilters button{border:1px solid #dbe3ee;background:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer}.rhiUxVisualPickerFilters button.selected{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}\n.rhiUxVisualChoiceGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:142px;gap:8px;margin:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 4px 1px;align-content:start}\n.rhiUxVisualChoice{height:142px;min-height:142px;max-height:142px;display:grid;grid-template-rows:86px minmax(0,1fr);gap:6px;align-items:stretch;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:8px;cursor:pointer;overflow:hidden}.rhiUxVisualChoice:hover{border-color:#93c5fd;background:#f8fbff}.rhiUxVisualChoice.selected{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);background:#f8fbff}\n.rhiUxVisualChoiceImage{width:100%;height:86px;min-width:0;min-height:86px;max-width:none;max-height:86px;display:grid;place-items:center;overflow:hidden}.rhiUxVisualChoiceImage img{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;max-height:100%;object-fit:contain;object-position:center}\n.rhiUxVisualChoiceCopy{min-width:0;align-self:end}.rhiUxVisualChoiceCopy small,.rhiUxVisualChoiceCopy b,.rhiUxVisualChoiceCopy em{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhiUxVisualChoiceCopy small{font-size:var(--rhi-font-label);color:#64748b;text-transform:uppercase}.rhiUxVisualChoiceCopy b{font-size:12px;margin-top:1px}.rhiUxVisualChoiceCopy em{font-size:var(--rhi-font-small);color:#64748b;font-style:normal;margin-top:1px}\n.rhiUxVisualPickerRefine{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:0}.rhiUxVisualPickerRefine label span{display:block;font-size:var(--rhi-font-label);color:#64748b;margin-bottom:3px}.rhiUxVisualPickerRefine select{width:100%;height:34px;border:1px solid #dbe3ee;border-radius:8px;background:#fff;padding:0 8px}\n.rhiUxVisualPickerFooter{display:flex;align-items:center;gap:8px;margin:0;padding-top:9px;border-top:1px solid #edf1f6}.rhiUxVisualPickerSpacer{flex:1}.rhiUxVisualPickerFooter button{height:34px;border:1px solid #dbe3ee;border-radius:9px;background:#fff;padding:0 12px;font-size:var(--rhi-font-small);font-weight:700}.rhiUxVisualPickerFooter button.primary{background:#0b65ea;color:#fff;border-color:#0b65ea}.rhiUxVisualPickerFooter button:disabled{opacity:.45}\n@media(max-width:900px){.rhiUxVisualChoiceGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:560px){.rhiUxVisualPickerBackdrop{padding:8px}.rhiUxVisualPickerPanel{width:96vw;max-height:88vh;padding:12px}.rhiUxVisualChoiceGrid{grid-template-columns:1fr;grid-auto-rows:116px}.rhiUxVisualChoice{height:116px;min-height:116px;max-height:116px;grid-template-columns:94px minmax(0,1fr);grid-template-rows:1fr}.rhiUxVisualChoiceImage{width:94px;height:86px;min-width:94px;max-width:94px}.rhiUxVisualChoiceCopy{align-self:center}.rhiUxVisualPickerRefine{grid-template-columns:1fr 1fr}.rhiUxVisualPickerFooter{flex-wrap:wrap}}\n\n\n/* Canonical page and asset composition primitives. */\n.rhiUxPage{display:block;width:100%;max-width:var(--rhi-page-max);margin:0 auto;padding:var(--rhi-page-pad-y) var(--rhi-page-pad-x);box-sizing:border-box}\n.rhiUxPageContent{display:grid;gap:var(--rhi-space-3);margin-top:var(--rhi-space-3)}\n.rhiUxAssetCardShell{display:grid;gap:var(--rhi-space-3);min-width:0;padding:12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface);box-shadow:var(--rhi-shadow-sm)}\n.rhiUxAssetCardIdentity,.rhiUxAssetCardFacts,.rhiUxAssetCardRelationships,.rhiUxAssetCardActions,.rhiUxAssetCardDetails,.rhiUxAssetCardFeedback{min-width:0}\n.rhiUxAssetCardRelationships{display:grid;gap:var(--rhi-space-2)}\n.rhiUxAssetCardActions{display:flex;align-items:center;gap:var(--rhi-space-2);flex-wrap:wrap}\n.rhiUxAssetCardDetails:empty,.rhiUxAssetCardFeedback:empty{display:none}\n.rhiUxAssetIdentity{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;min-width:0}\n.rhiUxAssetVisual{width:72px;height:58px;display:grid;place-items:center;overflow:hidden}\n.rhiUxAssetVisual img{display:block;width:100%;height:100%;object-fit:contain}\n.rhiUxAssetIdentityCopy{min-width:0}.rhiUxAssetIdentityCopy small{display:block;color:var(--rhi-color-muted);font-size:var(--rhi-font-label);text-transform:uppercase;letter-spacing:.08em}\n.rhiUxAssetIdentityCopy h2{margin:2px 0;font-size:var(--rhi-font-section);line-height:1.12}.rhiUxAssetIdentityCopy p{margin:0;color:var(--rhi-color-muted);font-size:var(--rhi-font-body)}\n.rhiUxAssetFactGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--rhi-space-2)}\n.rhiUxAssetFact{min-width:0;padding:9px 10px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface)}\n.rhiUxAssetFact small,.rhiUxAssetFact b,.rhiUxAssetFact span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.rhiUxAssetFact small{font-size:var(--rhi-font-label);color:var(--rhi-color-muted)}.rhiUxAssetFact b{margin-top:2px;font-size:13px}.rhiUxAssetFact span{margin-top:2px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxAssetRelationship{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;border:1px solid var(--rhi-color-line-soft);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface-soft)}\n.rhiUxAssetRelationship small,.rhiUxAssetRelationship b,.rhiUxAssetRelationship span{display:block}.rhiUxAssetRelationship small,.rhiUxAssetRelationship span{color:var(--rhi-color-muted);font-size:var(--rhi-font-small)}\n.rhiUxAssetDisclosure{border-top:1px solid var(--rhi-color-line-soft);padding-top:8px}.rhiUxAssetDisclosure summary{cursor:pointer;font-weight:var(--rhi-weight-medium)}\n.rhiUxAssetDisclosure>div{padding-top:8px}\n.rhiUxWriteFeedback{margin-top:6px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}.rhiUxWriteFeedback[data-state=\"success\"]{color:#15803D}.rhiUxWriteFeedback[data-state=\"error\"]{color:var(--rhi-color-error)}\n@media(max-width:760px){.rhiUxAssetCardShell{padding:10px}.rhiUxAssetFactGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:430px){.rhiUxAssetCardShell{gap:var(--rhi-space-2);padding:9px}.rhiUxAssetFactGrid{grid-template-columns:1fr 1fr}}\n";
}

// ---- src/app/localization.js ----
// Mobility product localization.
// Machine identifiers remain untranslated; only user-facing product copy belongs here.
const RHI_MOBILITY_TRANSLATIONS = Object.freeze({
  en: Object.freeze({
    "nav.mobility":"Mobility","nav.overview":"Overview","nav.vehicles":"Vehicles","nav.chargers":"Chargers",
    "nav.intelligence":"Intelligence","nav.planning":"Planning","nav.strategies":"Strategies",
    "nav.insights":"Insights","nav.history":"History","nav.log":"Activity",
    "hero.overview.title":"Mobility Overview",
    "hero.overview.description":"See whether your vehicles are ready, secure and comfortable, what is charging and where action is needed.",
    "hero.vehicles.title":"Vehicles",
    "hero.vehicles.description":"See which vehicles are ready, connected or need attention, then manage only what matters.",
    "hero.chargers.title":"Chargers",
    "hero.chargers.description":"See whether your chargers are available and working as expected, then handle exceptions.",
    "hero.planning.title":"Planning",
    "hero.planning.description":"See what is planned today and tomorrow, what is already covered and what still needs attention.",
    "planning.today":"Today",
    "planning.tomorrow":"Tomorrow",
    "planning.known_outlook":"Known home and solar outlook",
    "planning.baseline_not_schedule":"Independent baseline, not an executable plan",
    "planning.baseline_scope":"This Energy forecast covers evidenced household baseload and solar only; unknown vehicle demand and battery dispatch are excluded. It does not approve charging.",
    "planning.independent_baseline_source":"Independent Energy baseline",
    "planning.effective_baseline_source":"Effective Energy known-load outlook",
    "planning.home_baseload":"Home baseload",
    "planning.solar_forecast":"Solar forecast",
    "planning.grid_import_baseline":"Grid import (known loads)",
    "planning.grid_export_baseline":"Grid export (known loads)",
    "planning.unknown_loads":"unknown flexible loads",
    "hero.strategies.title":"Strategies",
    "hero.strategies.description":"See the configured charging intent and the policy that is currently in effect.",
    "hero.history.title":"History",
    "hero.history.description":"Review measured energy, value and mobility outcomes over time.",
    "hero.log.title":"Activity",
    "hero.log.description":"Review recent mobility events and anything that needs attention.",
    "common.status":"Status","common.trust":"Confidence","common.attention":"Attention","common.opportunity":"Opportunity",
    "common.recommended_action":"Recommended action","common.unavailable":"Unavailable","common.not_available":"Not available",
    "common.unknown":"Unknown","common.quick_actions":"Quick actions","common.open":"Open","common.details":"Details",
    "common.appearance":"Appearance","common.profile":"Profile","common.location":"Location","common.mode":"Mode",
    "common.assigned_vehicle":"Assigned vehicle","common.connected_vehicle":"Connected vehicle","common.connector":"Connector",
    "common.current_limit":"Current limit","common.actual_current":"Actual current","common.offered_current":"Offered current",
    "common.power":"Power","common.session_energy":"Session energy","common.health":"Health","common.last_update":"Last update",
    "common.technical_diagnostics":"Technical diagnostics","common.automatic":"Automatic","common.no_vehicle_assigned":"No vehicle assigned","common.not_configured":"Not configured","common.choose_appearance":"Choose appearance","common.busy":"Working…","common.no_recent_activity":"No recent activity",
    "common.no_action_needed":"No action needed","common.information_missing":"Information is not available yet.",
    "action.start_charging":"Start charging","action.stop_charging":"Stop charging","action.unlock_connector":"Unlock connector",
    "action.restart":"Restart","action.identify":"Identify","action.lock":"Lock","action.unlock":"Unlock",
    "action.activate":"Activate","action.disable":"Disable","action.climate_start":"Start climate","action.climate_stop":"Stop climate","action.refresh":"Refresh",
    "state.active":"Active","state.disabled":"Disabled","state.retired":"Retired",
    "state.status_change_unavailable":"Status cannot be changed right now",
    "feedback.appearance_not_confirmed":"The appearance change could not be confirmed.",
    "common.none":"None","common.selected":"Selected","common.brand":"Brand","common.model":"Model","common.variant":"Variant","common.finish":"Finish","common.colour":"Colour","common.save_appearance":"Save appearance","common.choose_brand":"Choose brand…","common.choose_model":"Choose model…","common.choose_variant":"Choose variant…","common.choose_finish":"Choose finish…","common.choose_colour":"Choose colour…","common.standard":"Standard","common.no_choices_published":"No choices published",
    "shell.eyebrow":"HOME INTELLIGENCE / MOBILITY","appearance.charger.eyebrow":"Appearance · Charger","appearance.charger.description":"Select the real charger, then refine brand, model, variant and finish.","appearance.vehicle.eyebrow":"Appearance · Vehicle","appearance.vehicle.description":"Select the real vehicle, then refine brand, model, variant and colour.","appearance.choose_charger":"Choose a charger","appearance.choose_vehicle":"Choose a vehicle",
    "charger.profiles":"Profiles","charger.availability":"Availability","charger.runtime":"Runtime","charger.issue":"Issue","charger.active":"Active chargers","charger.inactive":"Inactive chargers","charger.no_active":"No active chargers","charger.activate_when_needed":"Activate a charger below when needed.","charger.disabled_hidden":"Disabled chargers are hidden.","charger.manage":"Manage chargers & profiles","charger.vehicle_management":"Vehicle Management","charger.charging_plan":"Charging plan","charger.strategies":"Strategies",
    "dashboard.vehicles":"Vehicles","dashboard.vehicles_description":"Readiness first: range and energy, security, comfort, maintenance, charger relationship and direct actions.","dashboard.active_vehicles":"Active vehicles","dashboard.active_vehicles_description":"Readiness and actions first. Charger assignment and lifecycle remain Mobility-owned controls.","dashboard.inactive_vehicles":"Inactive vehicles","dashboard.inactive_vehicles_description":"Disabled vehicles stay available for deliberate reactivation and detail access.","dashboard.temporarily_unavailable":"Dashboard temporarily unavailable","dashboard.render_failed":"The frontend loaded, but the dashboard could not render the current backend contract safely.","common.configured":"configured","common.without_profile":"without profile","common.all_profiled":"All active items profiled","common.available":"available","common.connected":"connected","common.charging":"charging","common.active":"active","common.inactive":"inactive","common.disabled":"disabled","common.assigned":"assigned","common.shown":"shown","common.fault":"fault","common.faults":"faults","common.all":"All","common.sort":"Sort","common.configured_order":"Configured order","common.name":"Name","common.no_disabled":"No disabled vehicles","common.no_charger":"no charger","common.no_charger_available":"No charger currently available","common.all_assigned":"All active vehicles assigned","common.manage_vehicles_profiles":"Manage vehicles & profiles","common.charger_management":"Charger Management","common.vehicle_actions":"Vehicle actions","common.precondition":"Precondition","common.change_charger":"Change charger","dashboard.no_active":"No active vehicles.","dashboard.no_active_filter":"No active vehicles match this filter.","dashboard.no_disabled":"No disabled vehicles.","charger.no_profile_summary":"All active chargers profiled","planning.planned_today":"Planned today","planning.still_to_plan":"Still to plan","planning.vehicle_energy":"Vehicle energy","planning.attributed_value":"Attributed value","planning.energy_owned":"Energy-owned planning","planning.what_charge_when":"What will charge, and when?","planning.schedule_desc":"Only schedule and energy details explicitly published by Energy are shown. If a vehicle only participates in planning but has no schedule yet, that gap is stated directly.","planning.execution_context":"Mobility execution context","planning.can_execute":"Can the plan execute?","planning.execution_desc":"Mobility keeps charger assignment, physical connection and command readiness separate from Energy planning. A published plan is not presented as executable unless those facts exist.","planning.source":"Source","planning.vehicles_in_planning":"Vehicles in planning","planning.plan_state":"Plan state","strategy.configured_intent":"Configured intent","strategy.mobility_profiles":"Mobility energy profiles","strategy.profiles_desc":"Relevant Energy strategy profiles are shown read-only here. Profile meaning and editable strategy settings remain owned by Energy.","strategy.effective":"Effective strategy","strategy.in_effect":"What is in effect","strategy.effective_desc":"Effective policy is filtered to exact Mobility asset ids so vehicle and charger behavior is not confused with unrelated Energy domains.","strategy.no_effective":"No effective Mobility policy is currently published by Energy.","insights.charging_sessions":"Charging sessions","insights.charging_history":"Recent charging history","insights.charging_history_desc":"Energy measures charging sessions. Only physically proven vehicle identities are attributed; costs stay unknown until Energy allocates them.","insights.no_charging_sessions":"No qualified charging sessions published yet.","insights.session_source_unavailable":"Energy session history is unavailable or ambiguous.","insights.unassigned_vehicle":"Unassigned vehicle","insights.session_cost_unavailable":"Cost not allocated","insights.completed_sessions":"completed sessions in history","insights.measured_mobility":"Measured Mobility","insights.measured_energy":"Measured energy","insights.attributed_value":"Attributed value","insights.vehicle_energy_value":"Vehicle energy & value","insights.vehicle_energy_desc":"Per-vehicle energy and financial attribution come directly from Energy public UX contracts. Mobility only joins them by canonical asset id.","insights.mobility_evidence":"Mobility evidence","insights.execution_history":"Execution history","insights.execution_history_desc":"Commands, readiness transitions and vehicle/charger execution remain Mobility-owned. Energy measurements complement that history; they do not replace it.","insights.metering_contract":"Metering contract","insights.value_contract":"Value contract","insights.value_state":"Value state","common.published":"Published","activity.mobility_log":"Mobility log","activity.what_happened":"What happened?","activity.desc":"Recent vehicle, charger and command activity is shown with the asset, outcome and backend reason. Technical contract names stay out of the primary reading path.","activity.no_rows":"No activity rows are currently published.","activity.exceptions":"Exceptions","activity.what_attention":"What needs attention?","activity.no_failures":"No failed or rejected activity is currently published.","asset.not_registered":"Asset not registered","asset.not_found":"No registered Mobility asset was found for","asset.back_dashboard":"Back to Dashboard","asset.missing_id":"missing asset id","vehicle.no_charger":"No charger","charger.state_disabled":"Disabled","charger.state_unavailable":"Unavailable","charger.state_in_use":"In use","charger.state_free":"Free","charger.fact_state":"State","charger.fact_power":"Power","charger.fact_vehicle":"Vehicle","charger.fact_issue":"Issue"
  }),
  nl: Object.freeze({
    "nav.mobility":"Mobiliteit","nav.overview":"Overzicht","nav.vehicles":"Voertuigen","nav.chargers":"Laadpunten",
    "nav.intelligence":"Intelligentie","nav.planning":"Planning","nav.strategies":"Strategieën",
    "nav.insights":"Inzichten","nav.history":"Historiek","nav.log":"Activiteit",
    "hero.overview.title":"Mobiliteitsoverzicht",
    "hero.overview.description":"Zie of je voertuigen klaar, veilig en comfortabel zijn, wat er laadt en waar actie nodig is.",
    "hero.vehicles.title":"Voertuigen",
    "hero.vehicles.description":"Zie welke voertuigen klaar of verbonden zijn en welke aandacht nodig hebben. Beheer alleen wat ertoe doet.",
    "hero.chargers.title":"Laadpunten",
    "hero.chargers.description":"Zie of je laadpunten beschikbaar zijn en correct werken, en behandel alleen uitzonderingen.",
    "hero.planning.title":"Planning",
    "hero.planning.description":"Zie wat vandaag en morgen gepland is, wat al afgedekt is en wat nog aandacht nodig heeft.",
    "planning.today":"Vandaag",
    "planning.tomorrow":"Morgen",
    "planning.known_outlook":"Verwachting woning en zon",
    "planning.baseline_not_schedule":"Onafhankelijke basisprognose, geen uitvoerbaar plan",
    "planning.baseline_scope":"Deze Energy-prognose toont alleen onderbouwd basisverbruik en zonneproductie. Onbekende voertuigbehoefte en batterijaansturing zijn uitgesloten. Ze geeft geen toestemming om te laden.",
    "planning.independent_baseline_source":"Onafhankelijke Energy-basisprognose",
    "planning.effective_baseline_source":"Energy-prognose bekende lasten",
    "planning.home_baseload":"Basisverbruik woning",
    "planning.solar_forecast":"Zonneprognose",
    "planning.grid_import_baseline":"Netafname (bekende lasten)",
    "planning.grid_export_baseline":"Netinjectie (bekende lasten)",
    "planning.unknown_loads":"onbekende flexibele lasten",
    "hero.strategies.title":"Strategieën",
    "hero.strategies.description":"Zie de ingestelde laadintentie en welk beleid momenteel actief is.",
    "hero.history.title":"Historiek",
    "hero.history.description":"Bekijk gemeten energie, waarde en mobiliteitsresultaten doorheen de tijd.",
    "hero.log.title":"Activiteit",
    "hero.log.description":"Bekijk recente mobiliteitsgebeurtenissen en wat aandacht nodig heeft.",
    "common.status":"Status","common.trust":"Betrouwbaarheid","common.attention":"Aandacht","common.opportunity":"Kans",
    "common.recommended_action":"Aanbevolen actie","common.unavailable":"Niet beschikbaar","common.not_available":"Niet beschikbaar",
    "common.unknown":"Onbekend","common.quick_actions":"Snelle acties","common.open":"Openen","common.details":"Details",
    "common.appearance":"Weergave","common.profile":"Profiel","common.location":"Locatie","common.mode":"Modus",
    "common.assigned_vehicle":"Toegewezen voertuig","common.connected_vehicle":"Verbonden voertuig","common.connector":"Aansluiting",
    "common.current_limit":"Stroomlimiet","common.actual_current":"Huidige stroom","common.offered_current":"Aangeboden stroom",
    "common.power":"Vermogen","common.session_energy":"Energie deze sessie","common.health":"Status","common.last_update":"Laatste update",
    "common.technical_diagnostics":"Technische diagnose","common.automatic":"Automatisch","common.no_vehicle_assigned":"Geen voertuig toegewezen","common.not_configured":"Niet ingesteld","common.choose_appearance":"Weergave kiezen","common.busy":"Bezig…","common.no_recent_activity":"Geen recente activiteit",
    "common.no_action_needed":"Geen actie nodig","common.information_missing":"Deze informatie is nog niet beschikbaar.",
    "action.start_charging":"Laden starten","action.stop_charging":"Laden stoppen","action.unlock_connector":"Stekker ontgrendelen",
    "action.restart":"Herstarten","action.identify":"Identificeren","action.lock":"Vergrendelen","action.unlock":"Ontgrendelen",
    "action.activate":"Activeren","action.disable":"Uitschakelen","action.climate_start":"Klimaat starten","action.climate_stop":"Klimaat stoppen","action.refresh":"Vernieuwen",
    "state.active":"Actief","state.disabled":"Uitgeschakeld","state.retired":"Buiten gebruik",
    "state.status_change_unavailable":"De status kan nu niet worden aangepast",
    "feedback.appearance_not_confirmed":"De wijziging van de weergave kon niet worden bevestigd.",
    "common.none":"Geen","common.selected":"Geselecteerd","common.brand":"Merk","common.model":"Model","common.variant":"Variant","common.finish":"Afwerking","common.colour":"Kleur","common.save_appearance":"Weergave opslaan","common.choose_brand":"Kies merk…","common.choose_model":"Kies model…","common.choose_variant":"Kies variant…","common.choose_finish":"Kies afwerking…","common.choose_colour":"Kies kleur…","common.standard":"Standaard","common.no_choices_published":"Geen keuzes beschikbaar",
    "shell.eyebrow":"HOME INTELLIGENCE / MOBILITEIT","appearance.charger.eyebrow":"Weergave · Laadpunt","appearance.charger.description":"Selecteer het echte laadpunt en verfijn daarna merk, model, variant en afwerking.","appearance.vehicle.eyebrow":"Weergave · Voertuig","appearance.vehicle.description":"Selecteer het echte voertuig en verfijn daarna merk, model, variant en kleur.","appearance.choose_charger":"Kies een laadpunt","appearance.choose_vehicle":"Kies een voertuig",
    "charger.profiles":"Profielen","charger.availability":"Beschikbaarheid","charger.runtime":"Runtime","charger.issue":"Probleem","charger.active":"Actieve laadpunten","charger.inactive":"Inactieve laadpunten","charger.no_active":"Geen actieve laadpunten","charger.activate_when_needed":"Activeer hieronder een laadpunt wanneer nodig.","charger.disabled_hidden":"Uitgeschakelde laadpunten zijn verborgen.","charger.manage":"Laadpunten en profielen beheren","charger.vehicle_management":"Voertuigbeheer","charger.charging_plan":"Laadplanning","charger.strategies":"Strategieën",
    "dashboard.vehicles":"Voertuigen","dashboard.vehicles_description":"Eerst de inzetbaarheid: bereik en energie, veiligheid, comfort, onderhoud, laadrelatie en directe acties.","dashboard.active_vehicles":"Actieve voertuigen","dashboard.active_vehicles_description":"Eerst inzetbaarheid en acties. Toewijzing aan laadpunten en lifecycle blijven Mobility-controls.","dashboard.inactive_vehicles":"Inactieve voertuigen","dashboard.inactive_vehicles_description":"Uitgeschakelde voertuigen blijven beschikbaar voor bewuste heractivering en detailweergave.","dashboard.temporarily_unavailable":"Dashboard tijdelijk niet beschikbaar","dashboard.render_failed":"De frontend is geladen, maar kon het huidige backendcontract niet veilig weergeven.","common.configured":"ingesteld","common.without_profile":"zonder profiel","common.all_profiled":"Alle actieve items hebben een profiel","common.available":"beschikbaar","common.connected":"verbonden","common.charging":"aan het laden","common.active":"actief","common.inactive":"inactief","common.disabled":"uitgeschakeld","common.assigned":"toegewezen","common.shown":"getoond","common.fault":"fout","common.faults":"fouten","common.all":"Alle","common.sort":"Sorteren","common.configured_order":"Ingestelde volgorde","common.name":"Naam","common.no_disabled":"Geen uitgeschakelde voertuigen","common.no_charger":"geen laadpunt","common.no_charger_available":"Geen laadpunt momenteel beschikbaar","common.all_assigned":"Alle actieve voertuigen zijn toegewezen","common.manage_vehicles_profiles":"Voertuigen en profielen beheren","common.charger_management":"Laadpunten beheren","common.vehicle_actions":"Voertuigacties","common.precondition":"Voorverwarmen/koelen","common.change_charger":"Laadpunt wijzigen","dashboard.no_active":"Geen actieve voertuigen.","dashboard.no_active_filter":"Geen actieve voertuigen voldoen aan dit filter.","dashboard.no_disabled":"Geen uitgeschakelde voertuigen.","charger.no_profile_summary":"Alle actieve laadpunten hebben een profiel","planning.planned_today":"Vandaag gepland","planning.still_to_plan":"Nog te plannen","planning.vehicle_energy":"Voertuigenergie","planning.attributed_value":"Toegerekende waarde","planning.energy_owned":"Planning door Energy","planning.what_charge_when":"Wat laadt wanneer?","planning.schedule_desc":"Alleen planning- en energiedetails die expliciet door Energy zijn gepubliceerd worden getoond. Als een voertuig enkel aan planning deelneemt maar nog geen schema heeft, wordt dat expliciet vermeld.","planning.execution_context":"Uitvoeringscontext Mobility","planning.can_execute":"Kan de planning worden uitgevoerd?","planning.execution_desc":"Mobility houdt laadpunttoewijzing, fysieke verbinding en commandogereedheid gescheiden van Energy-planning. Een gepubliceerd plan wordt pas als uitvoerbaar getoond wanneer die feiten beschikbaar zijn.","planning.source":"Bron","planning.vehicles_in_planning":"Voertuigen in planning","planning.plan_state":"Planningsstatus","strategy.configured_intent":"Ingestelde intentie","strategy.mobility_profiles":"Energieprofielen mobiliteit","strategy.profiles_desc":"Relevante Energy-strategieprofielen worden hier alleen-lezen getoond. Betekenis en wijzigbare strategie-instellingen blijven eigendom van Energy.","strategy.effective":"Effectieve strategie","strategy.in_effect":"Wat is van kracht","strategy.effective_desc":"Effectief beleid wordt gefilterd op exacte Mobility asset-id’s zodat voertuig- en laadpuntgedrag niet met andere Energy-domeinen wordt verward.","strategy.no_effective":"Energy publiceert momenteel geen effectief Mobility-beleid.","insights.charging_sessions":"Laadsessies","insights.charging_history":"Recente laadhistoriek","insights.charging_history_desc":"Energy meet laadsessies. Alleen fysiek bewezen voertuigidentiteiten worden toegewezen; kosten blijven onbekend zolang Energy ze niet toerekent.","insights.no_charging_sessions":"Nog geen geldige laadsessies gepubliceerd.","insights.session_source_unavailable":"De Energy-laadhistoriek is niet beschikbaar of dubbelzinnig.","insights.unassigned_vehicle":"Voertuig niet toegewezen","insights.session_cost_unavailable":"Kosten niet toegerekend","insights.completed_sessions":"afgeronde sessies in historiek","insights.measured_mobility":"Gemeten mobiliteit","insights.measured_energy":"Gemeten energie","insights.attributed_value":"Toegerekende waarde","insights.vehicle_energy_value":"Voertuigenergie & waarde","insights.vehicle_energy_desc":"Energie en financiële toerekening per voertuig komen rechtstreeks uit de publieke Energy UX-contracten. Mobility koppelt ze alleen via de canonieke asset-id.","insights.mobility_evidence":"Mobility-bewijs","insights.execution_history":"Uitvoeringshistoriek","insights.execution_history_desc":"Commando’s, gereedheidstransities en voertuig-/laadpuntuitvoering blijven eigendom van Mobility. Energy-metingen vullen die historiek aan; ze vervangen ze niet.","insights.metering_contract":"Meetcontract","insights.value_contract":"Waardecontract","insights.value_state":"Waardestatus","common.published":"Gepubliceerd","activity.mobility_log":"Mobiliteitslog","activity.what_happened":"Wat is er gebeurd?","activity.desc":"Recente voertuig-, laadpunt- en commandoactiviteit wordt getoond met asset, resultaat en backendreden. Technische contractnamen blijven buiten het primaire gebruikerspad.","activity.no_rows":"Er zijn momenteel geen activiteitsregels gepubliceerd.","activity.exceptions":"Uitzonderingen","activity.what_attention":"Wat vraagt aandacht?","activity.no_failures":"Er is momenteel geen mislukte of geweigerde activiteit gepubliceerd.","asset.not_registered":"Asset niet geregistreerd","asset.not_found":"Geen geregistreerde Mobility-asset gevonden voor","asset.back_dashboard":"Terug naar dashboard","asset.missing_id":"ontbrekende asset-id","vehicle.no_charger":"Geen laadpunt","charger.state_disabled":"Uitgeschakeld","charger.state_unavailable":"Niet beschikbaar","charger.state_in_use":"In gebruik","charger.state_free":"Vrij","charger.fact_state":"Status","charger.fact_power":"Vermogen","charger.fact_vehicle":"Voertuig","charger.fact_issue":"Probleem"
  }),
  fr: Object.freeze({
    "nav.mobility":"Mobilité","nav.overview":"Vue d’ensemble","nav.vehicles":"Véhicules","nav.chargers":"Bornes",
    "nav.intelligence":"Intelligence","nav.planning":"Planification","nav.strategies":"Stratégies",
    "nav.insights":"Analyses","nav.history":"Historique","nav.log":"Activité",
    "hero.overview.title":"Vue d’ensemble de la mobilité",
    "hero.overview.description":"Voyez si vos véhicules sont prêts, sécurisés et confortables, ce qui charge et où une action est nécessaire.",
    "hero.vehicles.title":"Véhicules",
    "hero.vehicles.description":"Voyez quels véhicules sont prêts ou connectés et lesquels demandent votre attention.",
    "hero.chargers.title":"Bornes de recharge",
    "hero.chargers.description":"Voyez si vos bornes sont disponibles et fonctionnent correctement, puis traitez uniquement les exceptions.",
    "hero.planning.title":"Planification",
    "hero.planning.description":"Voyez ce qui est prévu aujourd’hui et demain, ce qui est déjà couvert et ce qui demande encore votre attention.",
    "planning.today":"Aujourd’hui",
    "planning.tomorrow":"Demain",
    "planning.known_outlook":"Prévisions du foyer et du solaire",
    "planning.baseline_not_schedule":"Prévision de référence indépendante, pas un plan exécutable",
    "planning.baseline_scope":"Cette prévision Energy couvre uniquement la consommation de base et le solaire étayés. Les besoins inconnus des véhicules et la gestion de la batterie sont exclus. Elle n’autorise pas la recharge.",
    "planning.independent_baseline_source":"Prévision de référence Energy indépendante",
    "planning.effective_baseline_source":"Prévision Energy des charges connues",
    "planning.home_baseload":"Consommation de base du foyer",
    "planning.solar_forecast":"Prévision solaire",
    "planning.grid_import_baseline":"Import réseau (charges connues)",
    "planning.grid_export_baseline":"Export réseau (charges connues)",
    "planning.unknown_loads":"charges flexibles inconnues",
    "hero.strategies.title":"Stratégies",
    "hero.strategies.description":"Voyez l’intention de charge configurée et la politique actuellement appliquée.",
    "hero.history.title":"Historique",
    "hero.history.description":"Consultez l’énergie mesurée, la valeur et les résultats de mobilité dans le temps.",
    "hero.log.title":"Activité",
    "hero.log.description":"Consultez les événements récents et ce qui demande votre attention.",
    "common.status":"État","common.trust":"Fiabilité","common.attention":"Attention","common.opportunity":"Opportunité",
    "common.recommended_action":"Action recommandée","common.unavailable":"Indisponible","common.not_available":"Non disponible",
    "common.unknown":"Inconnu","common.quick_actions":"Actions rapides","common.open":"Ouvrir","common.details":"Détails",
    "common.appearance":"Apparence","common.profile":"Profil","common.location":"Emplacement","common.mode":"Mode",
    "common.assigned_vehicle":"Véhicule attribué","common.connected_vehicle":"Véhicule connecté","common.connector":"Connecteur",
    "common.current_limit":"Limite de courant","common.actual_current":"Courant actuel","common.offered_current":"Courant proposé",
    "common.power":"Puissance","common.session_energy":"Énergie de la session","common.health":"État","common.last_update":"Dernière mise à jour",
    "common.technical_diagnostics":"Diagnostic technique","common.automatic":"Automatique","common.no_vehicle_assigned":"Aucun véhicule attribué","common.not_configured":"Non configuré","common.choose_appearance":"Choisir l’apparence","common.busy":"En cours…","common.no_recent_activity":"Aucune activité récente",
    "common.no_action_needed":"Aucune action nécessaire","common.information_missing":"Cette information n’est pas encore disponible.",
    "action.start_charging":"Démarrer la charge","action.stop_charging":"Arrêter la charge","action.unlock_connector":"Déverrouiller le connecteur",
    "action.restart":"Redémarrer","action.identify":"Identifier","action.lock":"Verrouiller","action.unlock":"Déverrouiller",
    "action.activate":"Activer","action.disable":"Désactiver","action.climate_start":"Démarrer la climatisation","action.climate_stop":"Arrêter la climatisation","action.refresh":"Actualiser",
    "state.active":"Actif","state.disabled":"Désactivé","state.retired":"Hors service",
    "state.status_change_unavailable":"L’état ne peut pas être modifié pour le moment",
    "feedback.appearance_not_confirmed":"La modification de l’apparence n’a pas pu être confirmée.",
    "common.none":"Aucun","common.selected":"Sélectionné","common.brand":"Marque","common.model":"Modèle","common.variant":"Variante","common.finish":"Finition","common.colour":"Couleur","common.save_appearance":"Enregistrer l’apparence","common.choose_brand":"Choisir une marque…","common.choose_model":"Choisir un modèle…","common.choose_variant":"Choisir une variante…","common.choose_finish":"Choisir une finition…","common.choose_colour":"Choisir une couleur…","common.standard":"Standard","common.no_choices_published":"Aucun choix disponible",
    "shell.eyebrow":"HOME INTELLIGENCE / MOBILITÉ","appearance.charger.eyebrow":"Apparence · Borne","appearance.charger.description":"Sélectionnez la borne réelle, puis affinez la marque, le modèle, la variante et la finition.","appearance.vehicle.eyebrow":"Apparence · Véhicule","appearance.vehicle.description":"Sélectionnez le véhicule réel, puis affinez la marque, le modèle, la variante et la couleur.","appearance.choose_charger":"Choisir une borne","appearance.choose_vehicle":"Choisir un véhicule",
    "charger.profiles":"Profils","charger.availability":"Disponibilité","charger.runtime":"Runtime","charger.issue":"Problème","charger.active":"Bornes actives","charger.inactive":"Bornes inactives","charger.no_active":"Aucune borne active","charger.activate_when_needed":"Activez une borne ci-dessous lorsque nécessaire.","charger.disabled_hidden":"Les bornes désactivées sont masquées.","charger.manage":"Gérer les bornes et profils","charger.vehicle_management":"Gestion des véhicules","charger.charging_plan":"Plan de charge","charger.strategies":"Stratégies",
    "dashboard.vehicles":"Véhicules","dashboard.vehicles_description":"Priorité à l’aptitude: autonomie et énergie, sécurité, confort, entretien, relation avec la borne et actions directes.","dashboard.active_vehicles":"Véhicules actifs","dashboard.active_vehicles_description":"Priorité à l’aptitude et aux actions. L’attribution des bornes et le cycle de vie restent gérés par Mobility.","dashboard.inactive_vehicles":"Véhicules inactifs","dashboard.inactive_vehicles_description":"Les véhicules désactivés restent disponibles pour une réactivation volontaire et l’accès aux détails.","dashboard.temporarily_unavailable":"Tableau de bord temporairement indisponible","dashboard.render_failed":"Le frontend est chargé, mais n’a pas pu afficher en toute sécurité le contrat backend actuel.","common.configured":"configuré","common.without_profile":"sans profil","common.all_profiled":"Tous les éléments actifs ont un profil","common.available":"disponible","common.connected":"connecté","common.charging":"en charge","common.active":"actif","common.inactive":"inactif","common.disabled":"désactivé","common.assigned":"attribué","common.shown":"affiché","common.fault":"défaut","common.faults":"défauts","common.all":"Tous","common.sort":"Trier","common.configured_order":"Ordre configuré","common.name":"Nom","common.no_disabled":"Aucun véhicule désactivé","common.no_charger":"aucune borne","common.no_charger_available":"Aucune borne actuellement disponible","common.all_assigned":"Tous les véhicules actifs sont attribués","common.manage_vehicles_profiles":"Gérer les véhicules et profils","common.charger_management":"Gestion des bornes","common.vehicle_actions":"Actions véhicule","common.precondition":"Préconditionner","common.change_charger":"Changer de borne","dashboard.no_active":"Aucun véhicule actif.","dashboard.no_active_filter":"Aucun véhicule actif ne correspond à ce filtre.","dashboard.no_disabled":"Aucun véhicule désactivé.","charger.no_profile_summary":"Toutes les bornes actives ont un profil","planning.planned_today":"Prévu aujourd’hui","planning.still_to_plan":"Reste à planifier","planning.vehicle_energy":"Énergie du véhicule","planning.attributed_value":"Valeur attribuée","planning.energy_owned":"Planification gérée par Energy","planning.what_charge_when":"Qu’est-ce qui chargera, et quand ?","planning.schedule_desc":"Seuls les détails de planification et d’énergie explicitement publiés par Energy sont affichés. Si un véhicule participe à la planification sans avoir encore de calendrier, cette lacune est indiquée directement.","planning.execution_context":"Contexte d’exécution Mobility","planning.can_execute":"Le plan peut-il être exécuté ?","planning.execution_desc":"Mobility sépare l’attribution des bornes, la connexion physique et la disponibilité des commandes de la planification Energy. Un plan publié n’est présenté comme exécutable que lorsque ces faits existent.","planning.source":"Source","planning.vehicles_in_planning":"Véhicules dans la planification","planning.plan_state":"État du plan","strategy.configured_intent":"Intention configurée","strategy.mobility_profiles":"Profils énergétiques de mobilité","strategy.profiles_desc":"Les profils de stratégie Energy pertinents sont affichés ici en lecture seule. Leur signification et les réglages modifiables restent gérés par Energy.","strategy.effective":"Stratégie effective","strategy.in_effect":"Ce qui est en vigueur","strategy.effective_desc":"La politique effective est filtrée sur les identifiants Mobility exacts afin de ne pas confondre le comportement des véhicules et bornes avec d’autres domaines Energy.","strategy.no_effective":"Aucune politique Mobility effective n’est actuellement publiée par Energy.","insights.charging_sessions":"Sessions de recharge","insights.charging_history":"Historique récent des recharges","insights.charging_history_desc":"Energy mesure les sessions de recharge. Seules les identités de véhicule physiquement confirmées sont attribuées ; les coûts restent inconnus sans allocation par Energy.","insights.no_charging_sessions":"Aucune session de recharge qualifiée publiée.","insights.session_source_unavailable":"L’historique Energy des recharges est indisponible ou ambigu.","insights.unassigned_vehicle":"Véhicule non attribué","insights.session_cost_unavailable":"Coût non attribué","insights.completed_sessions":"sessions terminées dans l’historique","insights.measured_mobility":"Mobilité mesurée","insights.measured_energy":"Énergie mesurée","insights.attributed_value":"Valeur attribuée","insights.vehicle_energy_value":"Énergie & valeur du véhicule","insights.vehicle_energy_desc":"L’énergie et l’attribution financière par véhicule proviennent directement des contrats UX publics Energy. Mobility les relie uniquement via l’identifiant d’asset canonique.","insights.mobility_evidence":"Preuves Mobility","insights.execution_history":"Historique d’exécution","insights.execution_history_desc":"Les commandes, transitions de disponibilité et l’exécution véhicule/borne restent gérées par Mobility. Les mesures Energy complètent cet historique sans le remplacer.","insights.metering_contract":"Contrat de mesure","insights.value_contract":"Contrat de valeur","insights.value_state":"État de la valeur","common.published":"Publié","activity.mobility_log":"Journal de mobilité","activity.what_happened":"Que s’est-il passé ?","activity.desc":"L’activité récente des véhicules, bornes et commandes est affichée avec l’asset, le résultat et la raison backend. Les noms techniques de contrats restent hors du parcours principal.","activity.no_rows":"Aucune ligne d’activité n’est actuellement publiée.","activity.exceptions":"Exceptions","activity.what_attention":"Qu’est-ce qui demande votre attention ?","activity.no_failures":"Aucune activité échouée ou rejetée n’est actuellement publiée.","asset.not_registered":"Asset non enregistré","asset.not_found":"Aucun asset Mobility enregistré trouvé pour","asset.back_dashboard":"Retour au tableau de bord","asset.missing_id":"identifiant d’asset manquant","vehicle.no_charger":"Aucune borne","charger.state_disabled":"Désactivé","charger.state_unavailable":"Indisponible","charger.state_in_use":"En cours d’utilisation","charger.state_free":"Libre","charger.fact_state":"État","charger.fact_power":"Puissance","charger.fact_vehicle":"Véhicule","charger.fact_issue":"Problème"
  })
});

let RHI_MOBILITY_LOCALE = "en";

function rhiMobilityLocale(hass = null) {
  const raw = hass?.locale?.language || hass?.language || RHI_MOBILITY_LOCALE || globalThis?.document?.documentElement?.lang || "en";
  return String(raw || "en").replace(/_/g,"-");
}

function rhiMobilitySetLocaleFromHass(hass = null) {
  RHI_MOBILITY_LOCALE = rhiMobilityLocale(hass);
  return RHI_MOBILITY_LOCALE;
}

function rhiMobilityT(hass, key, params = {}, fallback = "") {
  return rhiUxTranslate(RHI_MOBILITY_TRANSLATIONS, key, {
    locale:rhiMobilityLocale(hass),
    params,
    fallback
  });
}

function rhiMobilityFormatNumber(hass, value, options = {}) {
  return rhiUxFormatNumber(value,{ locale:rhiMobilityLocale(hass), ...options });
}

function rhiMobilityFormatCurrency(hass, value, currency = "EUR", options = {}) {
  return rhiUxFormatCurrency(value,currency,{ locale:rhiMobilityLocale(hass), ...options });
}

function rhiMobilityFormatPercent(hass, value, options = {}) {
  return rhiUxFormatPercent(value,{ locale:rhiMobilityLocale(hass), ...options });
}

// ---- src/app/presentation.js ----
// Shared Mobility presentation grammar.
// Owns cross-screen visual hierarchy, density, responsive modes and tab heroes.
// Domain screens keep their semantics, data ownership and actions.

const HB_MOBILITY_PAGE_HEROES = Object.freeze({
  overview: { titleKey:"hero.overview.title", descriptionKey:"hero.overview.description", fallbackTitle:"Mobility Overview", asset_key:"overview" },
  vehicles: { titleKey:"hero.vehicles.title", descriptionKey:"hero.vehicles.description", fallbackTitle:"Vehicles", asset_key:"vehicles" },
  chargers: { titleKey:"hero.chargers.title", descriptionKey:"hero.chargers.description", fallbackTitle:"Chargers", asset_key:"chargers" },
  planning: { titleKey:"hero.planning.title", descriptionKey:"hero.planning.description", fallbackTitle:"Planning", asset_key:"planning" },
  strategies: { titleKey:"hero.strategies.title", descriptionKey:"hero.strategies.description", fallbackTitle:"Strategies", asset_key:"strategies" },
  history: { titleKey:"hero.history.title", descriptionKey:"hero.history.description", fallbackTitle:"History", asset_key:"history" },
  log: { titleKey:"hero.log.title", descriptionKey:"hero.log.description", fallbackTitle:"Activity", asset_key:"log" }
});

const HB_MOBILITY_PRELOADED_HEROES = globalThis.__rhiMobilityPreloadedHeroes || (globalThis.__rhiMobilityPreloadedHeroes = new Set());

function hbMobilityPreloadHero(asset = "") {
  const src = String(asset || "").trim();
  if (!src || HB_MOBILITY_PRELOADED_HEROES.has(src) || typeof Image === "undefined") return;
  HB_MOBILITY_PRELOADED_HEROES.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  if (typeof img.decode === "function") img.decode().catch(()=>{});
}

function hbMobilityPageHero(rt, tab, options = {}) {
  const spec = HB_MOBILITY_PAGE_HEROES[tab] || HB_MOBILITY_PAGE_HEROES.overview;
  const asset = options.asset || rhiMobilityHeroAsset(options.asset_key || spec.asset_key);
  hbMobilityPreloadHero(asset);
  return rhiUxPageHero({
    eyebrow: options.eyebrow || "",
    title: options.title || rhiMobilityT(rt?.hass,spec.titleKey,{},spec.fallbackTitle),
    description: options.description || rhiMobilityT(rt?.hass,spec.descriptionKey,{},""),
    image: asset,
    imageAlt: ""
  }).replace("<img ", '<img loading="eager" decoding="async" fetchpriority="high" ');
}

function hbMobilityStatusGrid(rt, items = [], className = "") {
  const visible = items.slice(0, 4);
  const markup = rhiUxStatusGrid(visible.map(item => ({
    icon: item.icon || "mdi:information-outline",
    label: item.label || "",
    value: item.value ?? "—",
    detail: [item.sub, item.sub2].filter(Boolean).join(" · ")
  })));
  return className ? markup.replace('class="rhiUxStatusGrid"', `class="rhiUxStatusGrid ${rt?.escape ? rt.escape(className) : String(className)}"`) : markup;
}

function hbMobilityQuickActions(rt, actions = [], label = "") {
  return rhiUxQuickActionBar({
    label:label || rhiMobilityT(rt?.hass,"common.quick_actions",{},"Quick actions"),
    actions: actions.map((action,index) => ({
      label: action.label || rhiMobilityT(rt?.hass,"common.open",{},"Open"),
      target: action.path || "",
      icon: action.icon || "mdi:arrow-right",
      primary: action.primary || index === 0,
      disabled: action.disabled === true
    }))
  });
}

function hbMobilityPresentationStyles() {
  return `
    :host{
      --rhi-content-gap:8px;
      --rhi-card-gap:8px;
      color:var(--rhi-color-text);
    }
    .rhiUxPageHeroArt img{transition:none;animation:none;backface-visibility:hidden;transform:translateZ(0)}
    .vehicle-card,.charger-card,.vehicle-management-controls,.rhi-context-card{
      border-radius:var(--rhi-radius-lg);
      border-color:var(--rhi-color-line);
      box-shadow:var(--rhi-shadow-md);
    }
    .action,.cmd,.vehicle-manage-button,.ov-nav-action,.charger-appearance-action{
      min-height:var(--rhi-control-h);
      border-radius:var(--rhi-radius-sm);
      font-weight:var(--rhi-weight-medium);
    }
    .action ha-icon,.cmd ha-icon,.vehicle-manage-button ha-icon,.ov-nav-action ha-icon,.charger-appearance-action ha-icon{
      --mdc-icon-size:var(--rhi-icon-action)
    }
    .vehicle-management-bar{padding:6px;gap:6px;border-radius:var(--rhi-radius-md);box-shadow:none}
    .vehicle-filter-group{gap:4px}
    .vehicle-filter-group button,.vehicle-sort-control,.vehicle-manage-button{height:34px;min-height:34px;border-radius:9px}
    .vehicle-page-summary{gap:7px}
    .vehicle-page-summary-item{min-height:48px;border-radius:var(--rhi-radius-md);padding:7px 10px}
    .vehicle-management-controls,.charger-picker-panel{margin-top:0}
    .vehicle-workspace-list,.inactive-list,.grid{gap:var(--rhi-card-gap)}
    .rhi-context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--rhi-card-gap);margin:0 0 var(--rhi-space-2)}
    .rhi-context-card{min-width:0;background:#fff;padding:12px 14px}
    .rhi-context-card-kicker{display:flex;align-items:center;gap:7px;margin-bottom:6px;color:#355D96;font-size:var(--rhi-font-label);font-weight:var(--rhi-weight-medium);letter-spacing:.07em;text-transform:uppercase}
    .rhi-context-card-kicker ha-icon{--mdc-icon-size:18px}
    .rhi-context-card h3{margin:0 0 4px;color:var(--rhi-color-text);font-size:var(--rhi-font-card);line-height:1.18;font-weight:var(--rhi-weight-strong);letter-spacing:-.015em}
    .rhi-context-card p{margin:0;color:var(--rhi-color-muted);font-size:var(--rhi-font-body);line-height:var(--rhi-line-height-body);font-weight:var(--rhi-weight-regular)}
    .rhi-fact-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--rhi-card-gap);margin:0 0 var(--rhi-space-3)}
    .rhi-fact{min-width:0;display:grid;grid-template-columns:30px minmax(0,1fr);gap:8px;align-items:center;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:#fff;padding:9px 10px;box-shadow:none}
    .rhi-fact ha-icon{--mdc-icon-size:20px;color:#355D96}
    .rhi-fact small,.rhi-fact span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rhi-fact small{font-size:var(--rhi-font-label);color:var(--rhi-color-muted-soft);font-weight:var(--rhi-weight-medium)}
    .rhi-fact b{display:block;margin-top:2px;color:var(--rhi-color-text);font-size:14px;font-weight:var(--rhi-weight-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rhi-fact span{margin-top:2px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}
    @media(max-width:1200px) and (min-width:761px){
      .vehicle-intelligence-strip.status-top-row{
        grid-template-columns:repeat(3,minmax(0,1fr));
        grid-auto-rows:minmax(48px,auto);
        overflow:hidden;
      }
      .vehicle-intelligence-strip .intelligence-status-row{
        min-width:0;
        min-height:48px;
        overflow:hidden;
      }
      .vehicle-intelligence-strip .intelligence-status-row span,
      .vehicle-intelligence-strip .intelligence-status-row .pill{
        min-width:0;
        max-width:100%;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
    }
    @media(max-width:760px){
      .vehicle-management-bar{grid-template-columns:1fr}
      .vehicle-sort-control,.vehicle-manage-button{grid-column:auto}
      .vehicle-page-summary{grid-template-columns:repeat(2,minmax(0,1fr))}
      .vehicle-filter-group{overflow-x:auto}
      .vehicle-filter-group button{flex:0 0 auto}
      .rhi-context-grid{grid-template-columns:1fr}
      .rhi-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:430px){
      .rhi-context-card{padding:11px}
      .rhi-fact{grid-template-columns:24px minmax(0,1fr);gap:6px}
      .rhi-fact ha-icon{--mdc-icon-size:18px}
    }
  `;
}

// ---- src/app/header-and-navigation.js ----
// Mobility presentation adapter onto the shared RHI UX Core.
// Domain semantics remain owned by Mobility runtime/projections.
const UX_VERSION = "0.10.56";
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

// ---- src/domain/adapters/intelligence-model-alignment.js ----
// 06-intelligence-model-alignment.js
// R22.11.17 intelligence model alignment.
//
// R39 backend introduces domain, subdomain and asset intelligence model contracts
// (mobility.*, fleet.*, connections.*, owners.*, vehicle.*, charger.*). The UX
// consumes intelligence only through the public runtime layer. It prepares the family
// resolver to render intelligence properties and insights when published through approved public runtime contracts.

const HI_MOBILITY_INTELLIGENCE_MODEL_ALIGNMENT = Object.freeze({
  backend_model_reference: "R22.8.1.39_INTELLIGENCE_PROPERTY_MODEL",
  active_runtime_baseline: "R22.8.1.37.1 / R22.8.1.16-compatible public indexes",
  runtime_policy: "no_hard_dependency_on_r39_runtime",
  allowed_publication_path: ["vehicle_property_index", "charger_property_index", "person_property_index", "intelligence_index"],
  prepared_prefixes: {
    "mobility.": "domain intelligence, rendered only when published",
    "fleet.": "subdomain/fleet intelligence, rendered only when published",
    "connections.": "connection/charger intelligence, rendered only when published",
    "owners.": "owner/presence intelligence, rendered only when published",
    "vehicle.": "asset intelligence, existing runtime path",
    "charger.": "asset intelligence, existing runtime path"
  }
});

// ---- src/runtime/canonical-property-index.js ----
// Persistent Mobility canonical-property index.
//
// Mobility canonical property entities identify themselves with
// canonical_contract=RHI_MOBILITY_CANONICAL_PROPERTY_V1. This is the sole
// frontend property-truth contract. Aggregate Runtime V2 never backfills it.
class MobilityCanonicalPropertyIndex {
  constructor(hass = {}) {
    this.byEntity = new Map();
    this.byAsset = new Map();
    this.byAssetAndKey = new Map();
    this.stateRefs = new Map();
    this.ambiguousKeys = new Set();
    this.assetRevisions = new Map();
    this._globalRevision = 0;
    this._stateCount = 0;
    this._hassRef = null;
    this.discover(hass);
  }

  isCanonicalPropertyState(state) {
    const attrs = state?.attributes || {};
    const contract=String(attrs.canonical_contract || '').toUpperCase();
    return contract === 'RHI_MOBILITY_CANONICAL_PROPERTY_V1'
      && !!String(attrs.asset_id || '').trim()
      && !!String(attrs.property_key || '').trim();
  }

  rawRow(entityId, state) {
    if (!this.isCanonicalPropertyState(state)) return null;
    const attrs = state.attributes || {};
    const nativeState = String(state?.state ?? '').trim().toLowerCase();
    const explicitAvailability = String(attrs.availability || '').trim().toUpperCase();
    const quality = String(attrs.quality || '').trim().toUpperCase();
    const invalidState = ['unknown','unavailable','none','null',''].includes(nativeState);
    const invalidQuality = ['STALE','INVALID','UNKNOWN'].includes(quality);
    // A published availability outside the recognized states is not evidence
    // of an available physical value. Preserve known zero; fail closed on
    // unknown backend status instead of silently presenting stale truth.
    const knownAvailability = ['', 'AVAILABLE', 'UNAVAILABLE', 'STALE', 'INVALID', 'UNKNOWN'];
    const publishedValue = Object.prototype.hasOwnProperty.call(attrs,'value') ? attrs.value : state?.state;
    const invalidPublishedValue = publishedValue === null || publishedValue === undefined ||
      (typeof publishedValue === 'string' && ['unknown','unavailable','none','null',''].includes(publishedValue.trim().toLowerCase()));
    const available = !invalidState && !invalidQuality && !invalidPublishedValue &&
      knownAvailability.includes(explicitAvailability) &&
      (explicitAvailability === '' || explicitAvailability === 'AVAILABLE');
    return {
      ...attrs,
      asset_id:String(attrs.asset_id || '').trim(),
      property_key:String(attrs.property_key || '').trim(),
      availability:available ? 'AVAILABLE' : 'UNAVAILABLE',
      value:available ? publishedValue : null,
      display_name:attrs.display_name || attrs.friendly_name || '',
      _source_entity_id:String(entityId || ''),
      canonical_contract:String(attrs.canonical_contract || 'RHI_MOBILITY_CANONICAL_PROPERTY_V1').toUpperCase()
    };
  }

  _index(entityId, state) {
    const row=this.rawRow(entityId,state);
    if(!row) return;
    this.byEntity.set(entityId,row);
    if(!this.byAsset.has(row.asset_id)) this.byAsset.set(row.asset_id,[]);
    this.byAsset.get(row.asset_id).push(row);
    const compound=`${row.asset_id}::${row.property_key}`;
    const current=this.byAssetAndKey.get(compound);
    if(!current) this.byAssetAndKey.set(compound,row);
    else this.ambiguousKeys.add(compound);
    this.stateRefs.set(entityId,state);
  }

  discover(hass = {}) {
    const previousAssetIds = new Set(this.byAsset.keys());
    this.byEntity.clear();
    this.byAsset.clear();
    this.byAssetAndKey.clear();
    this.stateRefs.clear();
    this.ambiguousKeys.clear();
    const states=hass?.states || {};
    this._hassRef=hass;
    this._stateCount=Object.keys(states).length;
    for(const [entityId,state] of Object.entries(states)) this._index(entityId,state);
    this._globalRevision += 1;
    for(const assetId of new Set([...previousAssetIds,...this.byAsset.keys()]))
      this.assetRevisions.set(assetId,(this.assetRevisions.get(assetId)||0)+1);
    return this;
  }

  refresh(hass = {}) {
    const states=hass?.states || {};
    // Same-sized HA replacements can still add/remove canonical entities.
    const membershipChanged=[...this.stateRefs.keys()].some(id=>!Object.prototype.hasOwnProperty.call(states,id)) ||
      Object.entries(states).some(([id,state])=>!this.stateRefs.has(id) && this.isCanonicalPropertyState(state));
    if(Object.keys(states).length !== this._stateCount || membershipChanged) {
      this.discover(hass);
      return;
    }
    let metadataChanged=false;
    const changed=[];
    for(const [entityId,previous] of this.stateRefs.entries()) {
      const current=states[entityId];
      if(current===previous) continue;
      changed.push([entityId,current]);
      const before=this.byEntity.get(entityId);
      const after=this.rawRow(entityId,current);
      if(!after || !before ||
        before.asset_id!==after.asset_id ||
        before.property_key!==after.property_key ||
        before.component_id!==after.component_id ||
        before.section_id!==after.section_id ||
        before.visibility!==after.visibility ||
        before.render_as!==after.render_as ||
        before.presentation_role!==after.presentation_role ||
        before.presentation_family!==after.presentation_family ||
        before.presentation_surface!==after.presentation_surface ||
        before.presentation_primary!==after.presentation_primary ||
        before.presentation_technical!==after.presentation_technical ||
        before.asset_type!==after.asset_type ||
        before.asset_display_name!==after.asset_display_name ||
        before.lifecycle_status!==after.lifecycle_status) {
        metadataChanged=true;
        break;
      }
    }
    // Incremental replacement cannot safely maintain the winner of a
    // duplicated asset/property key: a changed secondary publisher would
    // otherwise overwrite byAssetAndKey while the ambiguity remains active.
    // Rebuild on changes to ambiguous keys so the index and gap evidence stay
    // consistent until the backend removes the duplicate publication.
    if (!metadataChanged && changed.some(([entityId]) => {
      const row=this.byEntity.get(entityId);
      return row && this.ambiguousKeys.has(`${row.asset_id}::${row.property_key}`);
    })) metadataChanged=true;
    if(metadataChanged) {
      this.discover(hass);
      return;
    }
    // Once all metadata has been checked, update values without losing the
    // canonical membership of any unchanged asset.
    const changedAssets=new Set();
    for(const [entityId,current] of changed) {
      const before=this.byEntity.get(entityId);
      const after=this.rawRow(entityId,current);
      this.byEntity.set(entityId,after);
      this.byAssetAndKey.set(`${after.asset_id}::${after.property_key}`,after);
      this.byAsset.set(after.asset_id,(this.byAsset.get(after.asset_id)||[]).map(row=>row._source_entity_id===entityId?after:row));
      this.stateRefs.set(entityId,current);
      changedAssets.add(after.asset_id);
    }
    if(changedAssets.size) {
      this._globalRevision += 1;
      changedAssets.forEach(assetId=>this.assetRevisions.set(assetId,(this.assetRevisions.get(assetId)||0)+1));
    }
    this._hassRef=hass;
  }

  rows(assetId = '') {
    const id=String(assetId || '').trim();
    const source=id ? [...(this.byAsset.get(id)||[])] : [...this.byEntity.values()];
    // Duplicate publication has no authoritative winner. Do not let an
    // ambiguous row leak into inventory, overview, detail or diagnostics
    // projections that consume rows() rather than row().
    return source.filter(row=>!this.ambiguousKeys.has(`${row.asset_id}::${row.property_key}`));
  }

  row(assetId='',propertyKey='') {
    const key=`${String(assetId||'')}::${String(propertyKey||'')}`;
    return this.ambiguousKeys.has(key) ? null : (this.byAssetAndKey.get(key) || null);
  }

  contractGaps() {
    return [...this.ambiguousKeys].sort().map(key=>({key,reason:'duplicate_canonical_property'}));
  }

  entityIds(assetId='') {
    const id=String(assetId||'').trim();
    return this.rows(id).map(row=>row._source_entity_id).filter(Boolean);
  }

  revision(assetId='') {
    const id=String(assetId||'').trim();
    return id ? (this.assetRevisions.get(id)||0) : this._globalRevision;
  }
}

function mobilityCanonicalPropertyIndex(hass = {}) {
  const current=HomeBrainAssetRuntime?._canonicalPropertyIndex;
  if(!current) {
    const created=new MobilityCanonicalPropertyIndex(hass);
    HomeBrainAssetRuntime._canonicalPropertyIndex=created;
    return created;
  }
  current.refresh(hass);
  return current;
}

// ---- src/runtime/ha-contract-runtime.js ----
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

// ---- src/runtime/energy-public-v2-projection.js ----
// Cross-domain Energy canonical-property projection for Mobility UX.
// Never read the retired aggregate publication or infer missing semantics.
class HomeBrainEnergyCanonicalProjection {
  constructor(hass = {}) { this.hass = hass || {}; }
  static get contractId() { return 'RHI_ENERGY_CANONICAL_PROPERTY_V2'; }
  canonicalRows() {
    const published=Object.entries(this.hass?.states || {}).flatMap(([entityId, state]) => {
      const a=state?.attributes || {};
      if(a.canonical_contract !== HomeBrainEnergyCanonicalProjection.contractId ||
         !a.asset_id || !a.property_key) return [];
      const raw=String(state?.state ?? '').trim().toLowerCase();
      const availability=String(a.availability || '').toUpperCase();
      const quality=String(a.quality || '').toUpperCase();
      const semantic=Object.hasOwn(a,'value')?a.value:state.state;
      const invalidValue=semantic===undefined || semantic===null ||
        (typeof semantic==='string' && ['unknown','unavailable','none','null',''].includes(semantic.trim().toLowerCase()));
      const valid=!['unknown','unavailable','none','null',''].includes(raw) && !invalidValue &&
        (availability === '' || availability === 'AVAILABLE') &&
        !['STALE','INVALID','UNKNOWN'].includes(quality);
      return [Object.freeze({entity_id:entityId,asset_id:String(a.asset_id),
        property_key:String(a.property_key),value:valid?semantic:null,
        availability:valid?'AVAILABLE':'UNAVAILABLE',
        presentation_family:a.presentation_family || '',
        presentation_role:a.presentation_role || '',
        presentation_surface:a.presentation_surface || '',
        // Only explicit backend metadata may bind a reading to a time period
        // or a configuration editor. Property-key substrings have no authority.
        period_id:String(a.period_id || ''),
        unit:String(a.unit || a.unit_of_measurement || ''),
        asset_display_name:String(a.asset_display_name || ''),
        friendly_name:String(a.friendly_name || a.presentation_label || ''),
        display_name:String(a.display_name || ''),
        editable:a.editable === true || a.write_supported === true})];
    });
    // No arbitrary winner when the same asset/property is published twice.
    const counts=new Map();
    for(const row of published) {
      const key=`${row.asset_id}::${row.property_key}`;
      counts.set(key,(counts.get(key)||0)+1);
    }
    return published.filter(row=>counts.get(`${row.asset_id}::${row.property_key}`)===1);
  }
  // Energy publishes D0/D1 planning totals as native metrics rather than
  // synthetic D0/D1 canonical assets. Only exact producer-owned keys qualify.
  nativeMetric(metricKey='') {
    const key=String(metricKey||'').trim();
    const matches=Object.entries(this.hass?.states||{}).filter(([,state])=>
      state?.attributes?.canonical_source==='rhi_energy.runtime' &&
      String(state?.attributes?.metric_key||'')===key);
    if(!key || matches.length!==1) return Object.freeze({available:false,value:null,
      reason:matches.length>1?'duplicate_native_energy_metric':'native_energy_metric_not_published'});
    const [entityId,state]=matches[0];
    const attrs=state?.attributes||{};
    const raw=String(state?.state??'').trim();
    const numeric=raw && !['unknown','unavailable','none','null'].includes(raw.toLowerCase()) ? Number(raw) : NaN;
    const quality=String(attrs.quality||'').trim().toUpperCase();
    const valid=String(attrs.availability||'').toUpperCase()==='AVAILABLE' &&
      Number.isFinite(numeric) && !['STALE','INVALID','UNKNOWN'].includes(quality);
    return Object.freeze({available:valid,value:valid?numeric:null,
      entity_id:entityId,unit:String(attrs.unit_of_measurement||''),
      reason:valid?'':String(attrs.reason_code||'native_energy_metric_unavailable'),
      provenance:attrs.provenance||null});
  }
  object(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value !== 'string') return {};
    try { const parsed=JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch (_) { return {}; }
  }
  rows(value) {
    if (value === undefined) return this.canonicalRows();
    if (Array.isArray(value)) return value.filter(row=>row && typeof row==='object');
    const parsed=this.object(value);
    return Object.values(parsed).filter(row=>row && typeof row==='object');
  }
  // Energy owns these revisions. Mobility's canonical property index cannot
  // invalidate a cross-domain planning/insights/strategy screen.
  revisionSignature(surface='planning') {
    const wanted=String(surface||'').toLowerCase();
    const rows=[];
    for(const [entityId,state] of Object.entries(this.hass?.states||{})) {
      const a=state?.attributes||{};
      const native=a.canonical_source==='rhi_energy.runtime' &&
        (wanted==='planning'
          ? (String(a.metric_key||'').startsWith('planning_') ||
             ['RHI_ENERGY_PLANNING_HORIZON_V1','RHI_ENERGY_BASELINE_PLANNING_HORIZON_V1'].includes(a.canonical_contract))
          : wanted==='history' || wanted==='insights'
            ? (!!String(a.metric_key||'') ||
               (a.contract_id==='RHI_ENERGY_METERING_PERIOD_V1' && a.period_id==='today'))
            : false);
      const canonical=a.canonical_contract===HomeBrainEnergyCanonicalProjection.contractId &&
        (wanted==='planning' ? a.presentation_surface==='planning' :
          wanted==='strategies' ? a.presentation_surface==='configuration' :
          a.presentation_surface==='metering' || a.presentation_surface==='value');
      if(!native && !canonical) continue;
      rows.push(`${entityId}:${state?.last_updated||''}:${state?.state??''}:${a.availability??''}`);
    }
    return rows.sort().join('|');
  }
  // Do not interpret numeric planning metrics as evidence of a complete,
  // effective horizon. The producer owns variant, provider and quality.
  planningHorizon(horizonId='D0',variant='effective') {
    const horizon=String(horizonId||'').toUpperCase();
    if(!['D0','D1'].includes(horizon) || !['effective','baseline'].includes(variant))
      return Object.freeze({published:false,available:false,status:'UNAVAILABLE',reason:'invalid_horizon_selector',details:null,metadata:null});
    const contract=variant==='effective'
      ? 'RHI_ENERGY_PLANNING_HORIZON_V1'
      : 'RHI_ENERGY_BASELINE_PLANNING_HORIZON_V1';
    const matches=Object.values(this.hass?.states||{}).filter(state=>{
      const a=state?.attributes||{};
      return a.canonical_contract===contract && a.canonical_source==='rhi_energy.runtime' &&
        a.horizon_id===horizon && a.variant===variant;
    });
    if(matches.length!==1) return Object.freeze({published:false,available:false,
      status:'UNAVAILABLE',reason:matches.length>1?'duplicate_planning_horizon':'planning_horizon_not_published',details:null,metadata:null});
    const a=matches[0].attributes;
    const details=a.details && typeof a.details==='object' && !Array.isArray(a.details)?a.details:null;
    const available=a.availability==='AVAILABLE' && a.totals_complete===true &&
      details && Array.isArray(details.buckets) &&
      (details.horizon_id===undefined || details.horizon_id===horizon);
    return Object.freeze({published:true,available:!!available,
      status:available?'AVAILABLE':String(a.availability||'UNAVAILABLE'),
      reason:available?'':String(a.reason_code||'horizon_incomplete'),
      details:available?details:null,metadata:a});
  }
  snapshot() {
    const rows=this.canonicalRows();
    return Object.freeze({available:rows.length>0,contractId:HomeBrainEnergyCanonicalProjection.contractId,
      contractVersion:HomeBrainEnergyCanonicalProjection.contractId,
      attributes:Object.freeze({properties:rows})});
  }
  section(name) {
    const wanted=String(name || '');
    return {properties:this.canonicalRows().filter(row=>row.presentation_surface===wanted)};
  }
}

// Single native canonical Energy runtime projection. No retired Public V2 alias.

// ---- src/runtime/energy-planning-projection.js ----
// Read-only cross-domain Energy Planning projection for Mobility UX.
// Energy owns effective/baseline selection, horizon quality and schedule details.
// No UI-fabricated totals, EMHASS fallback, source aliases or guessed asset join.
class HomeBrainEnergyPlanningProjection {
  constructor(hass, mobilityRuntime = null) {
    this.energy=new HomeBrainEnergyCanonicalProjection(hass);
    this.mobilityRuntime=mobilityRuntime||null;
  }
  _first(...values) {
    for(const value of values) if(value!==undefined && value!==null && value!=='') return value;
    return null;
  }
  _number(value) {
    if(value===null || value===undefined || value==='') return null;
    const number=Number(value);
    return Number.isFinite(number)?number:null;
  }
  _mobilityAssetIds() {
    try{return new Set((this.mobilityRuntime?.mobilityRegistry?.()||[])
      .map(row=>String(row?.asset_id||'')).filter(Boolean));}
    catch(_){return new Set();}
  }
  _assetId(row={}) {
    return String(this._first(row.asset_id,row.target_asset_id,
      row.flexible_asset_id,row.consumer_asset_id,row.participant_id,'')||'');
  }
  _totalsView(horizon,publication) {
    const day=horizon==='D0'?'today':'tomorrow';
    const metric=key=>this.energy.nativeMetric('planning_'+day+'_'+key);
    const raw=publication.available?publication.details||{}:{};
    // Never mix an accepted plan's totals with a free-standing metric from
    // another runtime revision. Metrics without a plan remain provisional.
    const own=key=>publication.available
      ? this._number(raw[key]) : this._number(metric(key).value);
    return Object.freeze({
      plannedKwh:own('flexible_planned_kwh'),
      stillToPlanKwh:own('flexible_still_to_plan_kwh'),
      requiredKwh:own('flexible_required_kwh'),
      gridImportKwh:publication.available?this._number(raw.grid_import_kwh):null,
      solarKwh:publication.available?this._number(raw.solar_kwh):null,
      // Numeric metric availability is not proof of an effective plan.
      state:publication.status,
      provisional:!publication.available,
      reason:publication.reason,
      raw:publication.available?raw:{}
    });
  }
  _knownDemandProjection(horizonId, effective, baseline) {
    // Energy publishes an independent, non-executable solar/home baseload view
    // inside native horizon details even when flexible demand blocks the full plan.
    // A baseline plan never becomes the selected/effective schedule here.
    const ordered = effective?.available
      ? [['effective', effective], ['baseline', baseline]]
      : [['baseline', baseline], ['effective', effective]];
    for (const [source, publication] of ordered) {
      const details = publication?.metadata?.details;
      if (!details || details.horizon_id !== horizonId) continue;
      const known = details.known_demand_projection;
      if (!known || known.basis !== 'solar_plus_home_baseload_only_no_battery_dispatch' ||
          known.execution_authorized !== false) continue;
      const keys = ['home_consumption_forecast_kwh', 'solar_forecast_kwh',
        'expected_grid_import_kwh', 'expected_grid_export_kwh'];
      const values = keys.map(key => known[key]);
      if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) continue;
      const [homeKwh, solarKwh, gridImportKwh, gridExportKwh] = values;
      // Cross-check the physical net boundary. Do not show an inconsistent
      // source projection as an independent, trustworthy baseline.
      if (Math.abs((homeKwh - solarKwh) - (gridImportKwh - gridExportKwh)) > 0.02) continue;
      const unknown = known.unknown_flexible_load_count;
      if (!Number.isInteger(unknown) || unknown < 0) continue;
      return Object.freeze({
        available:true, source, basis:known.basis,
        homeKwh, solarKwh, gridImportKwh, gridExportKwh,
        unknownFlexibleLoadCount:unknown,
        complete:known.complete === true && unknown === 0,
        isEffectiveSchedule:false, executionAuthorized:false,
        quality:'KNOWN_LOADS_ONLY'
      });
    }
    return Object.freeze({available:false,source:'',quality:'UNAVAILABLE',
      homeKwh:null,solarKwh:null,gridImportKwh:null,gridExportKwh:null,
      unknownFlexibleLoadCount:null,complete:false,
      isEffectiveSchedule:false,executionAuthorized:false});
  }
  _assetScheduleRows(publications) {
    const rows=[];
    for(const publication of publications) {
      if(!publication.available) continue;
      const details=publication.details||{};
      const horizon=publication.metadata.horizon_id;
      // Planning asset and bucket allocations are published by Energy, not
      // reconstructed from the number of hours or charger observations.
      for(const asset of Array.isArray(details.planning_assets)?details.planning_assets:[])
        if(asset && typeof asset==='object') rows.push({...asset,horizon_id:horizon});
      for(const bucket of Array.isArray(details.buckets)?details.buckets:[]) {
        if(!bucket || typeof bucket!=='object') continue;
        for(const asset of Array.isArray(bucket.asset_allocations)?bucket.asset_allocations:[])
          if(asset && typeof asset==='object') rows.push({...asset,horizon_id:horizon,
            bucket_id:bucket.bucket_id||'',window_start:bucket.start||bucket.starts_at||'',
            window_end:bucket.end||bucket.ends_at||''});
      }
    }
    const ids=this._mobilityAssetIds();
    return ids.size?rows.filter(row=>ids.has(this._assetId(row))):[];
  }
  viewModel() {
    const d0=this.energy.planningHorizon('D0','effective');
    const d1=this.energy.planningHorizon('D1','effective');
    const baselineD0=this.energy.planningHorizon('D0','baseline');
    const baselineD1=this.energy.planningHorizon('D1','baseline');
    const bothReportedAvailable=d0.available&&d1.available;
    const identityCoherent=!bothReportedAvailable || (
      !!d0.metadata?.plan_id && d0.metadata.plan_id===d1.metadata?.plan_id &&
      !!d0.metadata?.provider_id && d0.metadata.provider_id===d1.metadata?.provider_id &&
      String(d0.metadata?.requested_provider||'')===String(d1.metadata?.requested_provider||'') &&
      (!d0.metadata?.generated_at || !d1.metadata?.generated_at ||
        d0.metadata.generated_at===d1.metadata.generated_at)
    );
    // A selected optimizer cannot silently be replaced by a different
    // effective provider just because some numeric plan fields are present.
    const selection=d0.metadata||d1.metadata||{};
    const providerMismatch=!!selection.requested_provider &&
      selection.requested_provider!==selection.provider_id;
    // Both stale cross-revision horizons AND a mismatched requested provider
    // quarantine all schedule rows. The independent known-load view survives.
    const conflict=(bothReportedAvailable&&!identityCoherent)||providerMismatch;
    const quarantined=publication=>conflict ? {
      ...publication,available:false,status:'INCOMPLETE',
      reason:'effective_horizons_inconsistent',details:null
    } : publication;
    const e0=quarantined(d0),e1=quarantined(d1);
    const publications=[e0,e1];
    const today=this._totalsView('D0',e0);
    const tomorrow=this._totalsView('D1',e1);
    const bothAvailable=e0.available&&e1.available;
    const someAvailable=e0.available||e1.available;
    const anyPublished=d0.published||d1.published;
    const metadata=d0.metadata||d1.metadata||null;
    const requestedProvider=metadata?.requested_provider||'';
    const effectiveProvider=metadata?.provider_id||'';
    const providerHold=!!requestedProvider && requestedProvider!==effectiveProvider;
    const reason=conflict
      ? (providerMismatch ? String(metadata?.reason_code||'requested_provider_not_effective') : 'effective_horizons_inconsistent')
      : providerHold
        ? String(metadata?.reason_code||'requested_provider_not_effective')
        : publications.find(row=>!row.available)?.reason||'';
    const independentKnownDemand=Object.freeze({
      D0:this._knownDemandProjection('D0',d0,baselineD0),
      D1:this._knownDemandProjection('D1',d1,baselineD1)
    });
    const properties=this.energy.canonicalRows().filter(row=>row.availability==='AVAILABLE'&&
      row.presentation_surface==='planning');
    const scheduleRows=this._assetScheduleRows(publications);
    const ids=this._mobilityAssetIds();
    return Object.freeze({
      available:someAvailable,
      complete:bothAvailable,
      published:anyPublished,
      entityId:null,
      contractVersion:'RHI_ENERGY_PLANNING_HORIZON_V1',
      state:bothAvailable?'AVAILABLE':anyPublished?'INCOMPLETE':'UNAVAILABLE',
      requestedProvider,
      effectiveProvider,
      providerHold,
      reason,
      today,tomorrow,independentKnownDemand,
      horizonIdentityCoherent:identityCoherent,
      baselineAvailable:baselineD0.available||baselineD1.available,
      baselineStatus:Object.freeze({D0:baselineD0.status,D1:baselineD1.status}),
      // Baseline evidence never becomes an effective or executable plan.
      combined:Object.freeze({plannedKwh:null,stillToPlanKwh:null,
        gridImportKwh:null,solarKwh:null,state:'',raw:{}}),
      currentIntent:{},
      planningRows:properties,
      experienceRows:[],
      mobilityPlanningRows:scheduleRows,
      mobilityExperienceRows:[],
      exactIdentityJoin:ids.size>0,
      source:'rhi_energy.runtime/native_horizon',
      quality:Object.freeze({D0:d0.status,D1:d1.status})
    });
  }
}

// ---- src/runtime/energy-mobility-insights-projection.js ----
// Read-only Energy metering/value projection for Mobility Insights.
// Only Energy canonical property rows are authoritative; missing evidence fails closed.
class HomeBrainEnergyMobilityInsightsProjection {
  constructor(hass, mobilityRuntime = null) {
    this.energy = new HomeBrainEnergyCanonicalProjection(hass);
    this.mobilityRuntime = mobilityRuntime || null;
  }
  _first(...values) { for (const value of values) if (value !== undefined && value !== null && value !== "") return value; return null; }
  _number(...values) { const value=this._first(...values); if(value===null) return null; const n=Number(value); return Number.isFinite(n)?n:null; }
  _mobilityAssets() {
    try { return new Map((this.mobilityRuntime?.mobilityRegistry?.() || []).map(row=>[String(row?.asset_id || ""),row]).filter(([id])=>id)); }
    catch (_) { return new Map(); }
  }
  _assetId(row={}) { return String(this._first(row.asset_id,row.consumer_asset_id,row.child_asset_id,row.target_asset_id,row.flexible_asset_id,row.participant_id,"") || ""); }
  _assetName(assetId,row={}) {
    const mobility=this._mobilityAssets().get(assetId) || {};
    return String(this._first(row.display_name,row.asset_label,row.label,mobility.display_name,mobility.name,this.mobilityRuntime?.assetDisplayName?.(assetId),assetId) || assetId);
  }
  _meteringRows(periodId='today') {
    const mobility=this._mobilityAssets();
    const selected=String(periodId||'').toLowerCase();
    return this.energy.canonicalRows().filter(row=>row.availability==='AVAILABLE' &&
      row.presentation_surface==='metering' && row.period_id===selected &&
      row.unit==='kWh' && mobility.has(row.asset_id)).map(row=>Object.freeze({
        assetId:row.asset_id,name:this._assetName(row.asset_id),periodId,
        energyKwh:this._number(row.value),unit:'kWh',measurementState:'AVAILABLE',
        trustState:'',raw:row
      }));
  }
  _valueRows(periodId='today') {
    const mobility=this._mobilityAssets();
    const selected=String(periodId||'').toLowerCase();
    return this.energy.canonicalRows().filter(row=>row.availability==='AVAILABLE' &&
      row.presentation_surface==='value_accounting' && row.period_id===selected &&
      row.unit==='EUR' && mobility.has(row.asset_id)).map(row=>Object.freeze({
        assetId:row.asset_id,name:this._assetName(row.asset_id),periodId,
        attributedEur:this._number(row.value),energyKwh:null,state:'AVAILABLE',raw:row
      }));
  }
  _chargingSessions() {
    // The existing Energy native metering period owns charging history.
    // "today" is the single bounded HA publication of the shared persistent
    // session ledger; selecting week/month must not create duplicate sessions.
    const states=Object.entries(this.energy.hass?.states || {}).filter(([,state])=>{
      const a=state?.attributes || {};
      return a.contract_id==='RHI_ENERGY_METERING_PERIOD_V1' &&
        a.canonical_source==='rhi_energy.runtime' && a.period_id==='today';
    });
    if(states.length!==1) return Object.freeze({
      available:false,rows:[],historyCount:null,
      reason:states.length>1?'duplicate_energy_session_publication':'energy_session_publication_unavailable'
    });
    const data=states[0][1]?.attributes?.charging_sessions;
    if(!data || typeof data!=='object' || !Array.isArray(data.active) || !Array.isArray(data.recent))
      return Object.freeze({available:false,rows:[],historyCount:null,reason:'native_session_rows_invalid'});
    const number=v=>{
      if(v===null || v===undefined || v==='' || typeof v==='boolean') return null;
      const n=Number(v);return Number.isFinite(n) && n>=0?n:null;
    };
    const signedEur=v=>{
      if(v===null || v===undefined || v==='' || typeof v==='boolean')return null;
      const n=Number(v);return Number.isFinite(n)?n:null;
    };
    const instant=v=>{
      if(typeof v!=='string' || !/(Z|[+-]\d\d:\d\d)$/i.test(v))return null;
      const n=Date.parse(v);return Number.isFinite(n)?n:null;
    };
    const seen=new Set(),excluded=new Set(),rows=[];
    for(const [isActive,entries] of [[false,data.recent],[true,data.active]]) {
      for(const raw of entries) {
        if(!raw || typeof raw!=='object' || Array.isArray(raw))continue;
        const id=String(raw.session_id||'').trim();
        const chargerId=String(raw.charger_asset_id||'').trim();
        const at=instant(raw.started_at);
        if(!id || !chargerId || at===null)continue;
        // Duplicated session IDs cannot silently win by array or entity order.
        if(seen.has(id)){excluded.add(id);continue;}
        seen.add(id);
        const end=raw.finished_at==null?null:instant(raw.finished_at);
        const latest=instant(raw.last_observed_at);
        if(end!==null && end<at)continue;
        if(isActive && raw.finished_at!=null)continue;
        const vehicle=raw.attribution_quality==='PROVEN' && raw.vehicle_asset_id
          ? String(raw.vehicle_asset_id).trim():null;
        // Real import credits at negative electricity prices must survive;
        // only physical kWh is restricted to nonnegative numeric values.
        const cost=raw.cost_quality==='ALLOCATED'?signedEur(raw.cost_eur):null;
        rows.push(Object.freeze({
          sessionId:id,chargerId,vehicleId:vehicle||null,
          attributionQuality:vehicle?'PROVEN':'UNATTRIBUTED',
          status:String(raw.status||'UNKNOWN'),
          energyKwh:number(raw.energy_kwh),
          costEur:cost,costQuality:cost===null?'UNAVAILABLE':'ALLOCATED',
          quality:String(raw.quality||'UNKNOWN'),
          reason:String(raw.reason||''),
          startedAt:String(raw.started_at),finishedAt:end===null?null:String(raw.finished_at),
          lastObservedAt:latest===null?null:String(raw.last_observed_at),
          isActive,orderAt:end??latest??at
        }));
      }
    }
    const unique=rows.filter(row=>!excluded.has(row.sessionId))
      .sort((a,b)=>b.orderAt-a.orderAt || a.sessionId.localeCompare(b.sessionId));
    const count=number(data.history_count);
    return Object.freeze({available:true,rows:Object.freeze(unique),
      historyCount:count!==null&&Number.isInteger(count)?count:null,
      reason:'',source:'RHI_ENERGY_METERING_PERIOD_V1.charging_sessions'});
  }
  viewModel(periodId="today") {
    const snapshot=this.energy.snapshot();
    const metering=this.energy.canonicalRows().filter(row=>row.presentation_surface==="metering");
    const accounting=this.energy.canonicalRows().filter(row=>row.presentation_surface==="value_accounting");
    const meteringRows=this._meteringRows(periodId);
    const valueRows=this._valueRows(periodId);
    const sessions=this._chargingSessions();
    const ids=new Set([...meteringRows.map(row=>row.assetId),...valueRows.map(row=>row.assetId)]);
    const rows=[...ids].map(assetId=>{
      const m=meteringRows.find(row=>row.assetId===assetId)||null;
      const v=valueRows.find(row=>row.assetId===assetId)||null;
      return Object.freeze({assetId,name:m?.name||v?.name||this._assetName(assetId),energyKwh:m?.energyKwh??v?.energyKwh??null,measurementState:m?.measurementState||"UNAVAILABLE",trustState:m?.trustState||"",attributedEur:v?.attributedEur??null,valueState:v?.state||"",metering:m,value:v});
    });
    return Object.freeze({
      periodId:String(periodId || "today").toLowerCase(),
      meteringAvailable:snapshot.available && meteringRows.length>0,
      valueAvailable:snapshot.available && valueRows.length>0,
      meteringContractVersion:snapshot.contractVersion,
      valueContractVersion:snapshot.contractVersion,
      valueCurrency:"EUR",
      valueState:valueRows.length?"AVAILABLE":"UNAVAILABLE",
      rows,
      sessionsAvailable:sessions.available,
      recentSessions:sessions.rows,
      sessionHistoryCount:sessions.historyCount,
      sessionHistoryReason:sessions.reason,
      sessionsSource:sessions.source||null,
      totalVehicleEnergyKwh:null,
      totalAttributedEur:null,
      source:"RHI_ENERGY_CANONICAL_PROPERTY_V2.metering/value_accounting"
    });
  }
}

// ---- src/runtime/energy-mobility-strategy-projection.js ----
// Read-only Energy strategy projection for Mobility Intelligence.
// Strategy semantics stay Energy-owned. UX never classifies configured/effective
// by property-key substrings or manufactures missing effective state.
class HomeBrainEnergyMobilityStrategyProjection {
  constructor(hass, mobilityRuntime = null) {
    this.energy = new HomeBrainEnergyCanonicalProjection(hass);
    this.mobilityRuntime = mobilityRuntime || null;
  }
  _mobilityAssets() {
    try { return new Map((this.mobilityRuntime?.mobilityRegistry?.() || []).map(row=>[String(row?.asset_id || ""),row]).filter(([id])=>id)); }
    catch (_) { return new Map(); }
  }
  _assetId(row={}) { return String(row.asset_id || row.target_asset_id || row.flexible_asset_id || ""); }
  _configuredRows() {
    const mobility=this._mobilityAssets();
    // Editable configuration is an explicit Energy property capability.
    return this.energy.canonicalRows().filter(row=>
      row.availability==='AVAILABLE' &&
      row.presentation_surface==='configuration' &&
      row.presentation_family==='strategy' && row.editable === true &&
      mobility.has(row.asset_id));
  }
  _effectiveRows() {
    // Current native property publication has no independently authoritative
    // configured-versus-effective strategy role. Do not infer from key names.
    return [];
  }
  viewModel() {
    const configured=this._configuredRows();
    const effective=this._effectiveRows();
    return Object.freeze({
      profilesAvailable:false,
      configuredAvailable:configured.length>0,
      effectiveAvailable:effective.length>0,
      profileContractVersion:'RHI_ENERGY_CANONICAL_PROPERTY_V2',
      effectiveContractVersion:'RHI_ENERGY_CANONICAL_PROPERTY_V2',
      profiles:[],configured,effective,
      configuredState:configured.length?'AVAILABLE':'UNAVAILABLE',
      effectiveState:effective.length?'AVAILABLE':'UNAVAILABLE',
      source:'RHI_ENERGY_CANONICAL_PROPERTY_V2.configuration.strategy'
    });
  }
}

// ---- src/domain/models/asset-factory.js ----
// 20-asset-factory.js
// Asset factory and common asset catalog shaping.

class HomeBrainAssetFactory {
  constructor(rt) { this.rt = rt; }
  assets() { return this.rt.indexedAssets("all").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired"); }
  vehicles() { return this.rt.indexedAssets("vehicle").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired"); }
  chargers() { return this.rt.indexedAssets("charger").filter((a) => a.frontend_allowed !== false && a.lifecycle_state !== "Retired"); }
  adapterFor(asset, config = {}) {
    if (this.rt.isVehicleAsset(asset)) return new HomeBrainVehicleAdapter(this.rt, asset.asset_id.replace(/^vehicle_/, ""), { ...config, registry_entry: asset });
    if (this.rt.isChargerAsset(asset)) return new HomeBrainChargerAdapter(this.rt, asset.asset_id.replace(/^charger_/, ""), { ...config, registry_entry: asset });
    return null;
  }
}

// ---- src/domain/adapters/vehicle-adapter.js ----
// 30-vehicle-adapter.js
// Vehicle view-model adapter. Canonical V2 runtime/experience/configuration is the sole product authority; presentation remains fail-closed.
// Product semantics are rendered from named backend owners only. No fact/source
// fallback, topology inference, command matrix, or frontend family reconstruction.

class HomeBrainVehicleAdapter {
  constructor(rt, vehicleId, config) { this.rt = rt; this.id = vehicleId; this.config = config; }
  assetId() { return String(this.id || "").startsWith("vehicle_") ? String(this.id) : `vehicle_${this.id}`; }
  registryEntry() { return this.config.registry_entry || this.rt.vehicleById(this.assetId()) || this.rt.assetById(this.assetId()) || null; }
  profile() { const reg = this.registryEntry(); return reg?.profile_display_name || reg?.profile || reg?.raw?.profile_display_name || this.config.fallback_profile || "Vehicle"; }
  displayName() { const reg = this.registryEntry(); return reg?.display_name || this.config.fallback_name || "Vehicle"; }
  imageFromProfile() { const reg = this.registryEntry() || {}; return this.rt.visualImageUrl(reg, "vehicle", "hero", "vehicle_fallback"); }
  chargerImage(assetId="") {
    const reg = assetId ? (this.rt.chargerById(assetId) || this.rt.assetById(assetId) || { asset_id: assetId }) : {};
    const prop = assetId ? this.rt.propertyByCompoundKey(assetId, "charger.image_key") : null;
    const raw = prop?.value ?? this.rt.visualImageKey(reg, "image") ?? reg?.image_key ?? "";
    const visual = typeof rhiMobilityResolveChargerVisual === "function" ? rhiMobilityResolveChargerVisual(reg, raw) : null;
    return visual?.appearance?.package_file || this.rt.visualImageUrl(reg, "charger", "image", "charger_fallback");
  }

  chargerAssignmentModel() {
    const assetId = this.assetId();
    const prop = this.rt.propertyByCompoundKey(assetId, "vehicle.selected_charger");
    if (!prop) {
      return { resolved:false, property:null, writable:false, display:"N/A", value:"", editor_value:"", choices:[], allow_none:false, none_value:"" };
    }
    const editor = this.rt.propertyEditorRow(prop);
    const allowNone = editor.allow_none === true;
    const noneValue = editor.none_value ?? "";
    const rawCurrent = prop.value;
    const currentUnset = rawCurrent === undefined || rawCurrent === null || String(rawCurrent).trim() === "" || (allowNone && String(rawCurrent).trim() === String(noneValue ?? ""));
    const currentValue = currentUnset && allowNone ? String(noneValue ?? "") : String(rawCurrent ?? "").trim();
    const choices = [];
    if (allowNone) choices.push({ value:String(noneValue ?? ""), label:(this.rt?.t?.("vehicle.no_charger",{},"No charger") || "No charger"), is_none:true });
    for (const choice of (editor.choices || [])) {
      const value = String(choice?.value ?? choice?.id ?? choice?.asset_id ?? choice ?? "").trim();
      const label = String(choice?.label ?? choice?.display_name ?? choice?.name ?? (value ? this.rt.chargerLabel(value) : "")).trim();
      if (!value || choices.some((row)=>row.value === value)) continue;
      choices.push({ value, label:label || value, is_none:false });
    }
    const currentKnown = choices.some((choice)=>choice.value === String(editor.editor_value ?? currentValue));
    const display = currentUnset
      ? (allowNone ? "No charger" : "N/A")
      : (this.rt.chargerLabel(String(rawCurrent).trim()) || String(rawCurrent).trim());
    return {
      resolved:true,
      property:prop,
      writable:!editor.disabled && choices.length > 0,
      display,
      value:String(rawCurrent ?? "").trim(),
      editor_value:String(editor.editor_value ?? currentValue),
      choices,
      current_known:currentKnown,
      allow_none:allowNone,
      none_value:String(noneValue ?? "")
    };
  }

  latestActivityRows(assetId) {
    const activities = this.rt.activityRowsFor(assetId).slice(0, 3);
    const valueFor = (a) => String(a.result || a.result_code || a.activity_state || a.status || a.message || a.activity_type || a.command_key || a.command_id || "Unavailable");
    const labels = ["Latest activity", "Previous activity", "Earlier activity"];
    if (!activities.length) return [{ type:"readonly", icon:"mdi:history", label:"Latest activity", value:"Unavailable" }];
    return activities.map((a, index)=>({ type:"readonly", icon:index === 0 ? "mdi:history" : "mdi:history-clock", label:labels[index] || `Activity ${index+1}`, value:valueFor(a) }));
  }

  chargingSessionHistoryRows(assetId) {
    // This is Energy's observed session ledger, never the Mobility activity
    // feed or an inferred relationship from a configured charger assignment.
    const insights=new HomeBrainEnergyMobilityInsightsProjection(this.rt.hass,this.rt).viewModel("today");
    if(!insights.sessionsAvailable) return [{
      type:"readonly",icon:"mdi:history",label:this.rt.t("insights.charging_history",{},"Recent charging history"),
      value:this.rt.t("insights.session_source_unavailable",{},"Energy session history is unavailable or ambiguous.")
    }];
    const sessions=(insights.recentSessions||[]).filter(row=>row.vehicleId===assetId);
    if(!sessions.length)return [{
      type:"readonly",icon:"mdi:history",label:this.rt.t("insights.charging_history",{},"Recent charging history"),
      value:this.rt.t("insights.no_charging_sessions",{},"No qualified charging sessions published yet.")
    }];
    return sessions.slice(0,6).map(row=>{
      const charged=row.energyKwh===null?"—":`${row.energyKwh.toFixed(2)} kWh`;
      const cost=row.costEur===null
        ? this.rt.t("insights.session_cost_unavailable",{},"Cost not allocated")
        : `€${row.costEur.toFixed(2)}`;
      const charger=this.rt.assetDisplayName?.(row.chargerId)||row.chargerId;
      return {type:"readonly",icon:"mdi:ev-station",
        label:`${charger} · ${row.status}`,value:`${charged} · ${cost}`};
    });
  }

  productProjection({ includeIntelligence = true } = {}) {
    const assetId = this.assetId();
    const reg = this.registryEntry() || { asset_id: assetId };
    // Overview/Intelligence may consume backend conclusions. Vehicle DETAIL
    // must not request those conclusions and displays canonical properties only.
    const experience = includeIntelligence ? this.rt.vehicleExperienceProjection(assetId) : {};
    const v2Relationship = this.rt.vehicleRelationshipProjection(assetId);

    const realId = (value) => {
      const raw = String(value || "").trim();
      return raw && !["none","unknown","unavailable","null","undefined","—"].includes(raw.toLowerCase())
        ? this.rt.canonicalAssetId(raw)
        : "";
    };
    const configuredId = realId(v2Relationship.configured_charger_id);
    const effectiveId = realId(v2Relationship.effective_charger_id || configuredId);
    const physicalId = v2Relationship.observed_identity_proven === true
      ? realId(v2Relationship.physically_connected_charger_id)
      : "";
    const relationshipId = physicalId || effectiveId || configuredId;
    const chargerEntry = relationshipId ? (this.rt.chargerById(relationshipId) || this.rt.assetById(relationshipId)) : null;
    const chargerDisplay = chargerEntry?.display_name || (relationshipId ? this.rt.chargerLabel(relationshipId) : "");

    const signal = (intel = {}, label, icon, attentionStates = []) => {
      const state = String(intel?.state || "").toLowerCase();
      const summary = String(intel?.summary || "Unavailable");
      const rawReason = String(intel?.reason || "").trim();
      const reason = /^[a-z0-9]+(?:[_.:-][a-z0-9]+)+$/i.test(rawReason) ? "" : rawReason;
      return {
        resolved: !!intel && Object.keys(intel).length > 0 && !["unknown","unavailable"].includes(state),
        value: summary,
        display: summary,
        unit: "",
        state: state || "unknown",
        reason,
        source: "MOBILITY_EXPERIENCE_V2",
        label,
        icon,
        tone: attentionStates.includes(state) ? "attention" : "neutral"
      };
    };

    const range = signal(experience.range_intelligence, "Range", "mdi:road-variant", ["low"]);
    const energy = signal(experience.energy_intelligence, "Energy", "mdi:battery-charging", ["attention","low"]);
    const security = signal(experience.security_intelligence, "Security", "mdi:lock-outline", ["unsafe"]);
    const comfort = signal(experience.comfort_intelligence, "Comfort", "mdi:fan", ["attention","degraded"]);
    const maintenance = signal(experience.maintenance_intelligence, "Maintenance", "mdi:wrench-outline", ["overdue","due_soon"]);
    const chargingIntel = experience.charging_intelligence || {};
    const charging = signal(chargingIntel, "Charging", "mdi:ev-station", ["fault","blocked"]);
    charging.value = charging.display = physicalId
      ? (chargerDisplay || "Connected")
      : (configuredId ? (chargerDisplay || "Assigned charger") : String(chargingIntel.summary || "No charger"));
    charging.reason = physicalId
      ? String(chargingIntel.summary || "Connected charger")
      : (configuredId ? "Assigned charger" : String(charging.reason || chargingIntel.summary || "No charger assigned"));
    charging.detailRoute = relationshipId ? this.rt.assetDetailRoute(chargerEntry || relationshipId) : "";
    charging.detailTitle = chargerDisplay ? `Open ${chargerDisplay} details` : "Open charger details";

    const configuration = String(experience?.configuration_status?.state || "").toLowerCase();
    const dataHealth = String(experience?.runtime_data_health?.state || "").toLowerCase();
    const demand = String(experience?.charge_demand?.state || "").toLowerCase();
    const attentionRequired = configuration === "incomplete"
      || ["partial","stale","unavailable"].includes(dataHealth)
      || range.state === "low"
      || security.state === "unsafe"
      || ["overdue","due_soon"].includes(maintenance.state)
      || demand === "needed";

    const profileProperty = this.rt.semanticProperty(assetId, "asset.profile_id");
    const imageProperty = this.rt.semanticProperty(assetId, "vehicle.image_key");
    const profileId = String(profileProperty?.value ?? "").trim();
    const imageKey = String(imageProperty?.value ?? "").trim();
    // Charging execution belongs to the charger, not the vehicle. A vehicle card may
    // present the configured/effective/physical charger's charging commands as a
    // convenience, but the command keeps its charger asset_id and backend readiness.
    // This must never be used as evidence that the charger is physically connected
    // to this specific vehicle; power attribution still requires observed identity.
    const vehicleCommands = this.rt.commandActionsFor(assetId, "quick_actions");
    const chargingCommandKeys = new Set([
      "charger.command.start",
      "charger.command.start_charging",
      "charger.command.stop",
      "charger.command.stop_charging"
    ]);
    const chargerCommands = relationshipId
      ? this.rt.commandActionsFor(relationshipId, "quick_actions")
          .filter((command) => chargingCommandKeys.has(String(command?.command_key || "")))
      : [];
    const semanticCommandRole = (command) => {
      const key = String(command?.command_key || command?.command_id || "").toLowerCase();
      if (key === "charger.command.start" || key === "charger.command.start_charging") return "charging:start";
      if (key === "charger.command.stop" || key === "charger.command.stop_charging") return "charging:stop";
      return key;
    };
    const commandPreference = (command) => {
      const key = String(command?.command_key || command?.command_id || "").toLowerCase();
      if (key === "charger.command.start" || key === "charger.command.stop") return 0;
      if (key === "charger.command.start_charging" || key === "charger.command.stop_charging") return 1;
      return 0;
    };
    const commands = [...chargerCommands, ...vehicleCommands]
      .sort((a,b) => commandPreference(a) - commandPreference(b))
      .filter((command, index, rows) => {
        const executor = String(command?.physical_executor_asset_id || command?.asset_id || "");
        const role = semanticCommandRole(command);
        const key = `${executor}::${role}`;
        return rows.findIndex((candidate) => {
          const candidateExecutor = String(candidate?.physical_executor_asset_id || candidate?.asset_id || "");
          return `${candidateExecutor}::${semanticCommandRole(candidate)}` === key;
        }) === index;
      });
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
        overview_metrics: this.rt.vehicleOverviewMetricSlots(assetId),
        live_charging: this.rt.liveChargingContextForVehicle(assetId),
        ready_by: this.rt.semanticProperty(assetId, "vehicle.ready_by"),
        climate_state: this.rt.semanticProperty(assetId, "vehicle.climate_state")
      },
      configuration: {
        profile_id: profileId,
        profile_resolved: !!profileProperty,
        charge_power_control: this.rt.vehicleChargePowerControl(assetId),
        charge_power_control_model: this.rt.vehicleChargePowerControlModel(assetId)
      },
      signals: { range, energy, security, comfort, maintenance, charging },
      relationships: {
        configured_charger_id: configuredId,
        effective_charger_id: effectiveId,
        physically_connected_charger_id: physicalId,
        charger_id: relationshipId,
        charger_display_name: chargerDisplay,
        identity_proven: !!physicalId,
        source: "MOBILITY_EXPERIENCE_V2"
      },
      commands,
      attention_required: attentionRequired,
      experience,
      source_contracts: ["RHI_MOBILITY_CANONICAL_PROPERTY_V1", "MOBILITY_EXPERIENCE_V2", "MOBILITY_COMMAND_V2"]
    };
  }

  build() {
    const id = this.id;
    const assetId = this.assetId();
    const reg = this.registryEntry() || { asset_id: assetId };
    const lifecycleState = this.rt.lifecycleStatus(reg);
    const lifecycle = lifecycleState === "active" ? "Active" : lifecycleState === "disabled" ? "Disabled" : lifecycleState === "retired" ? "Retired" : "Contract gap";
    const present = lifecycleState === "active";
    const profile = this.profile();
    const display = this.displayName();

    const projection = this.productProjection({ includeIntelligence:false });
    const relationship = projection.relationships || {};
    const chargerContextId = String(
      relationship.physically_connected_charger_id
      || relationship.effective_charger_id
      || relationship.configured_charger_id
      || ""
    );
    const chargerEntry = chargerContextId ? (this.rt.chargerById(chargerContextId) || this.rt.assetById(chargerContextId)) : null;
    const chargerDisplay = String(relationship.charger_display_name || chargerEntry?.display_name || "Not available");
    const chargerDetailRoute = chargerContextId ? this.rt.assetDetailRoute(chargerEntry || chargerContextId) : "";

    const profileImage = this.imageFromProfile();
    const imageKey = String(projection.identity?.image_key || this.rt.visualImageKey(reg, "image") || reg?.image_key || "");
    const visual = typeof rhiMobilityParseVehicleVisualKey === "function" ? rhiMobilityParseVehicleVisualKey(imageKey) : null;
    const profileId = String(projection.identity?.profile_id || reg?.profile_id || reg?.raw?.profile_id || "").trim();
    const profileVisual = typeof rhiMobilityVehicleVisualForProfile === "function" ? rhiMobilityVehicleVisualForProfile(profileId) : null;
    // Persisted appearance may refine colour only inside the backend profile-owned
    // vehicle family. A stale cross-model key must never outrank canonical identity.
    const visualMatchesProfile = !profileVisual || visual?.vehicle?.id === profileVisual.id;
    const visualPackageFile = visualMatchesProfile && visual?.vehicle?.selectable !== false && visual?.vehicle?.visual_quality !== "fallback_only"
      ? String(visual?.vehicle?.package_file || "")
      : "";
    const canonicalProfilePackage = String(profileVisual?.package_file || "");
    const img = visualPackageFile || canonicalProfilePackage || profileImage;
    const imageFilter = visualMatchesProfile ? (visual?.color?.filter || "none") : "none";
    const actions = projection.commands.map((cmd, index) => ({
      label: cmd.label || this.rt.titleize(cmd.command_id || cmd.command_key),
      icon: this.rt.commandIcon(cmd), entity: cmd.intent_entity, command: cmd,
      primary: index === 0, hide: cmd.frontend_allowed === false
    }));
    const componentSections = this.rt.addRelatedAssetDetailLinks(
      this.rt.vehicleComponentDetailSections(assetId),
      { chargerDetailRoute, chargerDisplay }
    );

    // Vehicle DETAIL: five independent canonical facts. No Intelligence
    // conclusion, silent status inference, or 'charging' based on a configured
    // charger assignment. Unknown stays unknown, zero stays zero.
    const detailFact = (key, label, icon, extra = {}) => {
      const row = this.rt.canonicalPropertyValue(assetId, key);
      const resolved = row?.resolved === true;
      const display = resolved
        ? this.rt.canonicalPropertyDisplay(assetId, key, "Unavailable")
        : "Unavailable";
      return {
        label, icon, resolved,
        value:display,
        display,
        state:resolved ? "ok" : "unknown",
        reason:resolved ? "Canonical " + key : "No canonical " + key + " data",
        source:"RHI_MOBILITY_CANONICAL_PROPERTY_V1",
        tone:"neutral",
        ...extra
      };
    };
    const rangeTile=detailFact("vehicle.range_total_km","Range","mdi:road-variant");
    const chargingTile=detailFact("vehicle.charging_state","Charging","mdi:ev-station");
    const physicalCharger=String(relationship.physically_connected_charger_id || "");
    const assignedCharger=String(relationship.configured_charger_id || "");
    chargingTile.reason = physicalCharger
      ? "Observed physical charger: " + chargerDisplay
      : assignedCharger
        ? "Configured charger: " + chargerDisplay + " · physical connection unverified"
        : "No physically identified charger; vehicle charging state is source-reported only";
    if(chargingTile.resolved && ["charging","running"].includes(String(this.rt.canonicalPropertyValue(assetId,"vehicle.charging_state").value).toLowerCase()) && !physicalCharger) {
      chargingTile.value = chargingTile.display = "Reported charging · unverified";
      chargingTile.tone = "attention";
    }
    const securityTile=detailFact("vehicle.security_state","Security","mdi:lock-outline");
    const comfortTile=detailFact("vehicle.climate_state","Climate","mdi:fan");
    const maintenanceTile=detailFact("vehicle.maintenance_state","Maintenance","mdi:wrench-outline");
    const headerStatus=[rangeTile,chargingTile,securityTile,comfortTile,maintenanceTile];

    return {
      type:"vehicle", id, present, display, subtitle:profile, readiness:lifecycle,
      image:this.rt.cache(img), fallbackImage:this.rt.cache(this.rt.assetUrl("vehicles/vehicle_fallback.png")), imageOpacity:present ? 1 : 0.34, imageGray:present ? 0 : 0.25, imageFilter,
      chargerImage:this.rt.cache(this.chargerImage(chargerContextId)), chargerFallbackImage:this.rt.cache(this.rt.assetUrl("chargers/charger_fallback.png")),
      chargerDisplay, chargerDetailRoute,
      projection,
      backPath:this.config.dashboard_path || hbMobilityPath("/dashboard"), backLabel:this.config.back_label || "← Back to Dashboard", detailRoute:this.rt.detailRoute(reg), lifecycle, registryEntry:reg,
      breadcrumb:["Home", "Vehicles", display],
      status:headerStatus,
      actions,
      sections:[this.rt.lifecycleContractGapSection(assetId)].filter(Boolean).concat(componentSections).concat([
        { key:"charging_sessions",
          title:this.rt.t("insights.charging_history",{},"Recent charging history"),
          icon:"mdi:ev-station",header:"Energy · measured charging sessions",
          rows:this.chargingSessionHistoryRows(assetId),details:[] },
        { key:"activity", title:"Recent Activity", icon:"mdi:history", header:"Activity contract", rows:this.latestActivityRows(assetId), details:[] }
      ])
    };
  }
}

// ---- src/domain/adapters/charger-adapter.js ----
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

// ---- src/ui/components/vehicle-visual-picker.js ----
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

// ---- src/ui/components/charger-visual-picker.js ----
// Shared image-first charger visual picker.
// Mobility V2 owns product profile/image-key persistence; UX owns local artwork.
class HomeBrainChargerVisualPicker {
  constructor(rt) { this.rt = rt; }

  catalog() {
    return typeof rhiMobilitySelectableChargerVisualCatalog === "function"
      ? rhiMobilitySelectableChargerVisualCatalog()
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

  profileIdForCharger(charger, profileProp) {
    if (!charger) return "";
    const available = new Set((this.rt.propertyEditorChoices(profileProp) || []).map((row)=>String((row?.value ?? row) || "")));
    const candidates = Array.isArray(charger.profile_ids) ? charger.profile_ids : [];
    return candidates.find((id)=>available.has(String(id))) || "";
  }

  selection(asset = {}, draft = {}) {
    const assetId=String(asset?.asset_id || asset || "").trim();
    const imageProp=assetId ? this.rt.semanticProperty(assetId,"charger.image_key") : null;
    const profileProp=assetId ? this.rt.semanticProperty(assetId,"asset.profile_id") : null;
    const raw=String(imageProp?.value ?? this.rt.visualImageKey(asset || {},"image") ?? asset?.image_key ?? "").trim();
    const parsed=typeof rhiMobilityParseChargerVisualKey==="function" ? rhiMobilityParseChargerVisualKey(raw,assetId) : null;
    const currentProfileId=String(profileProp?.value ?? asset?.profile_id ?? asset?.raw?.profile_id ?? "").trim();
    const profileCharger=typeof rhiMobilityChargerVisualForProfile==="function" ? rhiMobilityChargerVisualForProfile(currentProfileId) : null;
    const catalog=this.catalog();
    const currentCharger=profileCharger || (parsed?.charger ? catalog.find((row)=>row.id===parsed.charger.id) || null : null);

    const brand=String(draft.brand ?? currentCharger?.brand ?? "");
    const model=String(draft.model ?? (currentCharger?.brand===brand ? currentCharger?.model : "") ?? "");
    const variants=brand && model ? this.variantsFor(brand,model,catalog) : [];
    const charger=variants.find((row)=>row.id===String(draft.variant_id || ""))
      || (currentCharger?.brand===brand && currentCharger?.model===model ? currentCharger : null)
      || null;
    const appearances=charger?.appearances || [];
    const parsedAppearance=currentCharger?.id===charger?.id ? parsed?.appearance : null;
    const appearance=appearances.find((row)=>row.id===String(draft.appearance_id || ""))
      || parsedAppearance || appearances[0] || null;
    const key=charger && appearance && typeof rhiMobilityChargerVisualKey==="function"
      ? rhiMobilityChargerVisualKey(charger.id,appearance.id)
      : "";
    const profileId=this.profileIdForCharger(charger,profileProp) || (charger?.id===currentCharger?.id ? currentProfileId : "");
    const profileChanged=!!profileId && profileId!==currentProfileId;
    const profileWritable=!!(profileProp && this.rt.isWritableProperty(profileProp));
    const imageWritable=!!(imageProp && this.rt.isWritableProperty(imageProp));
    // Appearance-only changes on the same backend identity need no profile write.
    // Changing product requires an exact supported and writable profile choice.
    const sameProduct=!!(charger && currentCharger?.id===charger.id);
    const writable=!!key && imageWritable && (!profileChanged || profileWritable)
      && (sameProduct || (!!profileId && profileWritable));

    return {
      asset_id:assetId,
      prop:imageProp,
      image_prop:imageProp,
      profile_prop:profileProp,
      raw,parsed,
      current_profile_id:currentProfileId,
      profile_id:profileId,
      profile_changed:profileChanged,
      profile_writable:profileWritable,
      image_writable:imageWritable,
      current_charger:currentCharger,
      brand,model,charger,appearance,key,writable
    };
  }

  render(asset = {}, options = {}) {
    const current=this.selection(asset,options.draft || {});
    const catalog=this.catalog();
    const brands=this.brands(catalog);
    const models=current.brand ? this.modelsForBrand(current.brand,catalog) : [];
    const variants=current.brand && current.model ? this.variantsFor(current.brand,current.model,catalog) : [];
    const appearances=current.charger?.appearances || [];
    const assetId=current.asset_id;
    const close=options.showClose===false ? "" : `<button class="vehicle-picker-close" data-charger-picker-close="${this.rt.escape(assetId)}" title="Close appearance selector"><ha-icon icon="mdi:close"></ha-icon></button>`;
    const placeholder=(label,selected)=>`<option value="" ${selected?"selected":""} disabled>${label}</option>`;

    const visibleCatalog=current.brand ? catalog.filter((row)=>row.brand===current.brand) : catalog;
    const tiles=visibleCatalog.flatMap((row)=>(row.appearances || []).map((appearance)=>{
      const active=row.id===current.charger?.id && appearance.id===current.appearance?.id;
      return rhiUxVisualChoice({id:`${row.id}:${appearance.id}`,image:appearance.package_file ? (typeof this.rt.cache==='function' ? this.rt.cache(appearance.package_file) : appearance.package_file) : "",imageAlt:[row.label,appearance.label].filter(Boolean).join(" "),label:row.label || row.model || "Charger",detail:appearance.label || row.variant || this.rt.t("common.standard",{},"Standard"),selected:active,attributes:{"data-charger-visual-choice":row.id,"data-choice-brand":row.brand || "","data-choice-model":row.model || "","data-choice-appearance":appearance.id || ""}});
    })).join("");

    const blocked=!current.writable;
    const notice=blocked
      ? `<div class="visual-picker-notice"><ha-icon icon="mdi:information-outline"></ha-icon><span>Save needs a writable image binding. Changing model also needs an allowed backend profile option.</span></div>`
      : "";

    const refineHtml=`<label><span>Brand</span><select data-charger-picker-brand="${this.rt.escape(assetId)}">
          ${placeholder("Choose brand…",!current.brand)}
          ${brands.map((brand)=>`<option value="${this.rt.escape(brand)}" ${brand===current.brand?"selected":""}>${this.rt.escape(brand)}</option>`).join("")}
        </select></label>
        <label><span>Model</span><select data-charger-picker-model="${this.rt.escape(assetId)}" ${!current.brand?"disabled":""}>
          ${placeholder("Choose model…",!current.model)}
          ${models.map((model)=>`<option value="${this.rt.escape(model)}" ${model===current.model?"selected":""}>${this.rt.escape(model)}</option>`).join("")}
        </select></label>
        <label><span>${this.rt.escape(this.rt.t("common.variant",{},"Variant"))}</span><select data-charger-picker-variant="${this.rt.escape(assetId)}" ${!current.model?"disabled":""}>
          ${placeholder(this.rt.t("common.choose_variant",{},"Choose variant…"),!current.charger)}
          ${variants.map((row)=>`<option value="${this.rt.escape(row.id)}" ${row.id===current.charger?.id?"selected":""}>${this.rt.escape(row.variant || "Standard")} · ${this.rt.escape(row.years)}</option>`).join("")}
        </select></label>
        <label><span>${this.rt.escape(this.rt.t("common.finish",{},"Finish"))}</span><select data-charger-picker-appearance="${this.rt.escape(assetId)}" ${!current.charger?"disabled":""}>
          ${placeholder(this.rt.t("common.choose_finish",{},"Choose finish…"),!current.appearance)}
          ${appearances.map((row)=>`<option value="${this.rt.escape(row.id)}" ${row.id===current.appearance?.id?"selected":""}>${this.rt.escape(row.label)}</option>`).join("")}
        </select></label>`;
    const selectedHtml=`<div class="visual-picker-selection"><small>${this.rt.escape(this.rt.t("common.selected",{},"Selected"))}</small><b>${this.rt.escape(current.charger?.label || current.charger?.model || this.rt.t("appearance.choose_charger",{},"Choose a charger"))}</b><span>${this.rt.escape(current.appearance?.label || "")}</span></div>${notice}`;
    const saveHtml=`<button class="primary vehicle-picker-save" data-charger-picker-save="${this.rt.escape(assetId)}" data-charger-profile-id="${this.rt.escape(current.profile_id)}" data-charger-key="${this.rt.escape(current.key)}" ${!current.writable?"disabled":""}><ha-icon icon="mdi:check"></ha-icon><span>${this.rt.escape(this.rt.t("common.save_appearance",{},"Save appearance"))}</span></button>`;
    const shell=rhiUxVisualPickerShell({
      eyebrow:this.rt.t("appearance.charger.eyebrow",{},"Appearance · Charger"),
      title:this.rt.t("common.choose_appearance",{},"Choose appearance"),
      description:this.rt.t("appearance.charger.description",{},"Select the real charger, then refine brand, model, variant and finish."),
      choicesHtml:tiles,
      refineHtml,
      selectedHtml,
      saveHtml,
      closeHtml:close
    });
    return `<div class="${options.context==="detail"?"detail-vehicle-picker detail-charger-picker":""}" data-charger-picker-panel="${this.rt.escape(assetId)}">${shell}</div>`;
  }
}

// ---- src/ui/components/asset-shell.js ----
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

// ---- src/ui/screens/vehicle-detail.js ----
// 60-vehicle-detail-card.js
// Vehicle detail custom card registration.

class HomeBrainVehicleAssetDetailCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      fallback_name: "Vehicle",
      fallback_profile: "Vehicle",
      fallback_image: rhiMobilityAssetUrl("vehicles/vehicle_fallback.png"),
      image_base: "",
      dashboard_path: hbMobilityPath("/dashboard"),
      resource_version: UX_VERSION,
      ...config
    };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = "";
  }

  set hass(hass) {
    this._hass = hass;
    const rt = new HomeBrainAssetRuntime(hass, this.config);
    const id = this.config.vehicle_id;
    const sig = rt.productRevisionSignature(id, [
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_POLICY_V2",
      "MOBILITY_COMMAND_V2",
      "MOBILITY_ACTIVITY_V2",
      "MOBILITY_PROFILE_CATALOG_V2",
      "MOBILITY_SUPERVISION_V2"
    ]) + "|" + new HomeBrainEnergyCanonicalProjection(hass).revisionSignature("history");
    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      const model = new HomeBrainVehicleAdapter(rt, id, this.config).build();
      new HomeBrainAssetShell(this.shadowRoot, rt).render(model);
    }
  }
  getCardSize() { return 12; }
}

// ---- src/ui/screens/charger-detail.js ----
// 70-charger-detail-card.js
// Charger detail custom card registration.

class HomeBrainChargerAssetDetailCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      fallback_name: "Charger",
      fallback_profile: "EV Charger",
      fallback_location: "Home",
      image_base: "",
      dashboard_path: hbMobilityPath("/dashboard"),
      resource_version: UX_VERSION,
      ...config
    };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = "";
  }

  set hass(hass) {
    this._hass = hass;
    const rt = new HomeBrainAssetRuntime(hass, this.config);
    const id = this.config.charger_id;
    const sig = rt.productRevisionSignature(id, [
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_EXPERIENCE_V2",
      "MOBILITY_POLICY_V2",
      "MOBILITY_COMMAND_V2",
      "MOBILITY_ACTIVITY_V2",
      "MOBILITY_PROFILE_CATALOG_V2",
      "MOBILITY_SUPERVISION_V2"
    ]);
    if (sig !== this._lastSignature) {
      this._lastSignature = sig;
      const model = new HomeBrainChargerAdapter(rt, id, this.config).build();
      new HomeBrainAssetShell(this.shadowRoot, rt).render(model);
    }
  }
  getCardSize() { return 12; }
}

if (!customElements.get("homebrain-vehicle-asset-detail-card")) {
  customElements.define("homebrain-vehicle-asset-detail-card", HomeBrainVehicleAssetDetailCard);
}
if (!customElements.get("homebrain-charger-asset-detail-card")) {
  customElements.define("homebrain-charger-asset-detail-card", HomeBrainChargerAssetDetailCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "homebrain-vehicle-asset-detail-card",
  name: "Home Brain Vehicle Asset Detail Card",
  description: "Home Brain asset detail shell with vehicle adapter."
});
window.customCards.push({
  type: "homebrain-charger-asset-detail-card",
  name: "Home Brain Charger Asset Detail Card",
  description: "Home Brain asset detail shell with charger adapter."
});

window.HomeBrainMobilityAssetsVersion = UX_VERSION;
console.info(`Home Intelligence Mobility UX bundle loaded ${UX_VERSION}; backend version is read from the Mobility release contract at runtime.`);



/**
 * Premium operational charger maintenance card.
 *
 * This card replaces the Mobility Asset Viewer in the product navigation. It is
 * not a contract/debug screen: it gives the household operator one calm view of
 * every charger, its connected vehicle, power/session state, trust/freshness and
 * safe maintenance actions. All assets come from the public asset catalog and all buttons from
 * the Mobility command index.
 */

// ---- src/ui/screens/charger-maintenance.js ----
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

// ---- src/ui/screens/mobility-dashboard.js ----
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

// ---- src/ui/screens/router.js ----
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

// ---- src/ui/screens/bootstrap.js ----
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
