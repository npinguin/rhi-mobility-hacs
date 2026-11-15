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
