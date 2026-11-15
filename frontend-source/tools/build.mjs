import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { buildMobilityVisualManifest } from './visual-manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const pkg = readJson('../custom_components/rhi_mobility/manifest.json');
const sourceManifest = readJson('src/manifest.json');

const srcRoot = path.join(root, 'src');
const modules = sourceManifest.modules.map((rel) => path.posix.join('src', rel));
const missing = modules.filter((rel) => !fs.existsSync(path.join(root, rel)));
if (missing.length) throw new Error(`Missing build inputs: ${missing.join(', ')}`);

const distRoot = path.join(root, 'dist');
const out = path.join(distRoot, 'rhi-mobility-ux.js');
const checksumPath = path.join(distRoot, 'rhi-mobility-ux.js.sha256');
const packageManifestPath = path.join(distRoot, 'PACKAGE_MANIFEST.json');

fs.mkdirSync(distRoot, { recursive: true });

const banner = `/**\n * Robotix Home Intelligence Mobility UX v${pkg.version}\n * GENERATED FILE - DO NOT EDIT.\n * License: GPL-3.0-only\n */\n\n`;
const rawBody = modules
  .map((rel) => `// ---- ${rel} ----\n${fs.readFileSync(path.join(root, rel), 'utf8').trim()}`)
  .join('\n\n');

let body = rawBody;

const versionPlaceholder = '"__RHI_UX_VERSION__"';
if (!body.includes(versionPlaceholder)) throw new Error('UX version build placeholder not found');
body = body.replace(versionPlaceholder, JSON.stringify(pkg.version));

fs.writeFileSync(out, banner + body + '\n');
const runtimeDigest = crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
fs.writeFileSync(checksumPath, `${runtimeDigest}  rhi-mobility-ux.js\n`);

const assetSource = path.join(srcRoot, sourceManifest.assets_root);
const assetDist = path.join(distRoot, 'assets');
fs.rmSync(assetDist, { recursive: true, force: true });
fs.mkdirSync(assetDist, { recursive: true });

const assetCategories = fs.readdirSync(assetSource, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const category of assetCategories) {
  fs.cpSync(path.join(assetSource, category), path.join(assetDist, category), { recursive: true });
}

const visualManifest = buildMobilityVisualManifest(root, pkg.version);
fs.writeFileSync(path.join(assetDist, 'metadata/mobility-visual-manifest.json'), JSON.stringify(visualManifest, null, 2) + '\n');

function packageFiles(dir, base = dir) {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rows.push(...packageFiles(absolute, base));
      continue;
    }
    if (!entry.isFile()) continue;
    const relative = path.relative(base, absolute).split(path.sep).join('/');
    if (relative === 'PACKAGE_MANIFEST.json') continue;
    const bytes = fs.readFileSync(absolute);
    rows.push({
      path: relative,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex')
    });
  }
  return rows;
}

const packageManifest = {
  schema_version: 1,
  product: 'rhi_mobility',
  bundle_filename: 'rhi-mobility-ux.js',
  version: pkg.version,
  source_manifest_schema: sourceManifest.schema_version,
  hacs_package_root: 'dist',
  hacs_filename: 'rhi-mobility-ux.js',
  assets_root: 'assets',
  asset_categories: assetCategories,
  runtime_sha256: runtimeDigest,
  files: packageFiles(distRoot)
};
fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2) + '\n');

console.log(
  `Built ${modules.length} modules -> ${path.relative(root, out)}, checksum ${runtimeDigest}; ` +
  `packaged ${assetCategories.length} asset categories under dist/assets`
);
