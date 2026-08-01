import { strict as assert } from "node:assert";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uiPresetCatalog } from "../src/ui-packs/catalog.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const uiPacksRoot = path.join(projectRoot, "src/ui-packs");
const buildAllSource = readFileSync(path.join(projectRoot, "scripts/build-ui-packs.mjs"), "utf8");
const catalogSource = readFileSync(path.join(uiPacksRoot, "catalog.mjs"), "utf8");

const requiredPackFiles = [
  "manifest.ts",
  "admin.mjs",
  "Head.astro",
  "SiteShell.astro",
  "styles.css",
  "pages/Home.astro",
  "pages/ArticlesIndex.astro",
  "pages/ArticleDetail.astro",
  "pages/Gallery.astro",
  "pages/Videos.astro",
  "pages/Recommendations.astro",
  "pages/Projects.astro",
  "pages/About.astro",
];

const publicRouteFiles = new Map([
  ["src/pages/index.astro", "Home"],
  ["src/pages/articles/index.astro", "ArticlesIndex"],
  ["src/pages/articles/[slug].astro", "ArticleDetail"],
  ["src/pages/gallery/index.astro", "Gallery"],
  ["src/pages/videos/index.astro", "Videos"],
  ["src/pages/recommendations/index.astro", "Recommendations"],
  ["src/pages/projects/index.astro", "Projects"],
  ["src/pages/about.astro", "About"],
]);

const sourceExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

const normalizePath = (value) => value.split(path.sep).join("/");
const settingsSource = readFileSync(path.join(projectRoot, "src/data/siteSettings.ts"), "utf8");
const settingsMatch = settingsSource.match(/export\s+const\s+siteSettings\s*=\s*([\s\S]*);\s*$/);
assert.ok(settingsMatch, "Site settings must remain a parseable JSON export");
const siteSettings = JSON.parse(settingsMatch[1]);

const walkFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });

const importSpecifiers = (source) => {
  const matches = [];
  const importPattern =
    /(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(importPattern)) {
    matches.push(match[1] || match[2]);
  }

  return matches;
};

assert.ok(uiPresetCatalog.length >= 2, "At least the A and B UI packs must remain registered");
assert.ok(
  buildAllSource.includes("for (const preset of uiPresetCatalog)") &&
    buildAllSource.includes("UI_PRESET: preset.id"),
  "The all-pack build must automatically include every catalog entry, including future UI packs",
);

const catalogIds = uiPresetCatalog.map((preset) => preset.id);
const catalogCodes = uiPresetCatalog.map((preset) => preset.code);
const catalogDirectories = uiPresetCatalog.map((preset) =>
  normalizePath(path.normalize(preset.directory)),
);

assert.equal(
  new Set(catalogIds).size,
  catalogIds.length,
  "Every UI pack catalog ID must be unique",
);
assert.equal(
  new Set(catalogCodes).size,
  catalogCodes.length,
  "Every user-facing UI version code must be unique",
);
for (const code of catalogCodes) {
  assert.match(code, /^[A-Z][A-Z0-9-]*$/, `UI version code "${code}" must remain a stable uppercase label`);
}
assert.equal(
  new Set(catalogDirectories).size,
  catalogDirectories.length,
  "Every UI pack catalog directory must be unique",
);

const registeredDirectoryNames = [];

for (const preset of uiPresetCatalog) {
  const packDirectory = path.resolve(projectRoot, preset.directory);
  const relativeToUiRoot = path.relative(uiPacksRoot, packDirectory);

  assert.ok(
    relativeToUiRoot && !relativeToUiRoot.startsWith("..") && !path.isAbsolute(relativeToUiRoot),
    `UI pack "${preset.id}" must live inside src/ui-packs`,
  );
  assert.ok(
    existsSync(packDirectory) && statSync(packDirectory).isDirectory(),
    `UI pack "${preset.id}" directory must exist`,
  );
  assert.ok(String(preset.label || "").trim(), `UI pack "${preset.id}" must keep a default fallback label`);

  registeredDirectoryNames.push(normalizePath(relativeToUiRoot));

  for (const relativeFile of requiredPackFiles) {
    assert.ok(
      existsSync(path.join(packDirectory, relativeFile)),
      `UI pack "${preset.id}" is missing ${relativeFile}`,
    );
  }

  const manifestSource = readFileSync(path.join(packDirectory, "manifest.ts"), "utf8");
  assert.match(
    manifestSource,
    new RegExp(`\\bid\\s*:\\s*["']${preset.id}["']`),
    `UI pack "${preset.id}" manifest must keep the catalog ID`,
  );
  assert.match(
    manifestSource,
    new RegExp(`\\bcode\\s*:\\s*["']${preset.code}["']`),
    `UI pack "${preset.id}" manifest must keep the catalog version code`,
  );
  assert.ok(
    manifestSource.includes(`label: "${preset.label}"`),
    `UI pack "${preset.id}" manifest must keep the catalog fallback label`,
  );
  assert.match(
    manifestSource,
    new RegExp(`\\bsettingsVersion\\s*:\\s*${preset.settingsVersion}`),
    `UI pack "${preset.id}" manifest must keep the catalog settings version`,
  );
  assert.equal(
    siteSettings.ui?.presets?.[preset.id]?.settingsVersion,
    preset.settingsVersion,
    `UI pack "${preset.id}" must own a versioned private settings tree`,
  );
  const appearancePaths = (preset.appearanceFields || []).map((field) => field.path);
  assert.ok(
    !appearancePaths.includes("displayName"),
    `UI pack "${preset.id}" must leave the reserved displayName field to the shared manager`,
  );
  assert.equal(
    new Set(appearancePaths).size,
    appearancePaths.length,
    `UI pack "${preset.id}" appearance field paths must be unique`,
  );
  const adminSchemaSource = readFileSync(path.join(packDirectory, "admin.mjs"), "utf8");
  assert.ok(
    catalogSource.includes(`./${normalizePath(relativeToUiRoot)}/admin.mjs`),
    `UI pack "${preset.id}" catalog entry must source admin fields from its own admin.mjs`,
  );
  for (const appearancePath of appearancePaths) {
    assert.ok(
      adminSchemaSource.includes(appearancePath),
      `UI pack "${preset.id}" admin.mjs must own field ${appearancePath}`,
    );
  }

  const packSourceFiles = walkFiles(packDirectory).filter((file) =>
    sourceExtensions.has(path.extname(file)),
  );
  const otherPackDirectories = uiPresetCatalog
    .filter((otherPreset) => otherPreset.id !== preset.id)
    .map((otherPreset) => normalizePath(path.normalize(otherPreset.directory)));

  for (const sourceFile of packSourceFiles) {
    const source = readFileSync(sourceFile, "utf8");
    const sourceLabel = normalizePath(path.relative(projectRoot, sourceFile));

    assert.doesNotMatch(
      source,
      /(?:from\s+|import\s*\()\s*["'](?:@ui-pack\/|@\/(?:components|styles|ui-packs)\/|src\/ui-packs\/)/,
      `${sourceLabel} must keep visual components and styles inside its own UI pack`,
    );

    for (const otherDirectory of otherPackDirectories) {
      assert.ok(
        !normalizePath(source).includes(otherDirectory),
        `${sourceLabel} must not reference another UI pack directory (${otherDirectory})`,
      );
    }

    if (source.includes("uiPresetConfig(")) {
      assert.ok(
        source.includes("uiPresetConfig(manifest.id)"),
        `${sourceLabel} must resolve private settings through its own manifest.id`,
      );
    }

    for (const specifier of importSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue;

      const resolvedImport = path.resolve(path.dirname(sourceFile), specifier);
      const relativeImport = path.relative(packDirectory, resolvedImport);
      assert.ok(
        relativeImport && !relativeImport.startsWith("..") && !path.isAbsolute(relativeImport),
        `${sourceLabel} has a relative import outside its own UI pack: ${specifier}`,
      );
    }
  }

  const siteShellSource = readFileSync(path.join(packDirectory, "SiteShell.astro"), "utf8");
  assert.match(
    siteShellSource,
    /import\s+["']\.\/styles\.css["']/,
    `UI pack "${preset.id}" must load its own styles.css from SiteShell`,
  );

  for (const pageName of publicRouteFiles.values()) {
    const pageSource = readFileSync(
      path.join(packDirectory, `pages/${pageName}.astro`),
      "utf8",
    );
    assert.doesNotMatch(
      pageSource,
      /BaseLayout|getStaticPaths/,
      `UI pack "${preset.id}" page ${pageName} must stay a route-free view`,
    );
  }
}

const onDiskPackDirectories = readdirSync(uiPacksRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

assert.deepEqual(
  registeredDirectoryNames.sort(),
  onDiskPackDirectories,
  "Every UI pack directory must be registered exactly once in catalog.mjs",
);

for (const [relativeRoute, pageName] of publicRouteFiles) {
  const routePath = path.join(projectRoot, relativeRoute);
  assert.ok(existsSync(routePath), `Stable public route file is missing: ${relativeRoute}`);

  const routeSource = readFileSync(routePath, "utf8");
  const expectedUiImport = `@ui-pack/pages/${pageName}.astro`;
  const uiImports = importSpecifiers(routeSource).filter((specifier) =>
    specifier.startsWith("@ui-pack/"),
  );

  assert.ok(
    uiImports.includes(expectedUiImport),
    `${relativeRoute} must access ${pageName} through @ui-pack`,
  );
  assert.equal(
    uiImports.length,
    1,
    `${relativeRoute} must have exactly one UI view import`,
  );
  assert.doesNotMatch(
    routeSource,
    /src\/ui-packs|classic-a|warm-editorial-b/,
    `${relativeRoute} must not address a concrete UI pack`,
  );
  assert.doesNotMatch(
    routeSource,
    /\bclass(?::list)?=/,
    `${relativeRoute} must not contain pack-specific visual markup`,
  );
  assert.doesNotMatch(
    routeSource,
    /<style(?:\s|>)/,
    `${relativeRoute} must not contain pack-specific CSS`,
  );
}

const baseLayoutPath = path.join(projectRoot, "src/layouts/BaseLayout.astro");
const baseLayoutSource = readFileSync(baseLayoutPath, "utf8");
const baseLayoutUiImports = importSpecifiers(baseLayoutSource).filter((specifier) =>
  specifier.startsWith("@ui-pack/"),
);

assert.deepEqual(
  baseLayoutUiImports.sort(),
  ["@ui-pack/Head.astro", "@ui-pack/SiteShell.astro", "@ui-pack/manifest"].sort(),
  "BaseLayout may access UI code only through the active pack head, shell, and manifest aliases",
);
assert.doesNotMatch(
  baseLayoutSource,
  /src\/ui-packs|classic-a|warm-editorial-b|@\/styles\/global\.css|heroBackground|homeConfig/,
  "BaseLayout must not bind itself to a concrete pack or shared visual stylesheet",
);

console.log("UI pack isolation checks passed");
