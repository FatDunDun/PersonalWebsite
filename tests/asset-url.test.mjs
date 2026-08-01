import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const source = read("src/utils/site.ts");
const { uiPresetCatalog } = await import(new URL("../src/ui-packs/catalog.mjs", import.meta.url));
const uiPresetEntries = Array.isArray(uiPresetCatalog) ? uiPresetCatalog : Object.values(uiPresetCatalog);
const routeContracts = {
  "src/pages/index.astro": "Home.astro",
  "src/pages/gallery/index.astro": "Gallery.astro",
  "src/pages/videos/index.astro": "Videos.astro",
  "src/pages/recommendations/index.astro": "Recommendations.astro",
  "src/pages/articles/[slug].astro": "ArticleDetail.astro",
  "src/pages/articles/index.astro": "ArticlesIndex.astro",
  "src/pages/about.astro": "About.astro",
};

assert.ok(source.includes("export function assetUrl"), "Expected shared assetUrl helper");
assert.ok(source.includes("/^https?:\\/\\//.test(path)"), "Expected assetUrl to leave absolute URLs unchanged");
assert.ok(source.includes("return withBase(path);"), "Expected relative media paths to keep using GitHub Pages assets");
assert.ok(
  source.includes('source.hostname.endsWith(".r2.dev")'),
  "Expected stored R2 URLs to use the configured asset CDN when available",
);
assert.ok(source.includes("export function imageUrl"), "Expected a shared responsive image URL helper");
assert.ok(source.includes("PUBLIC_IMAGE_API_URL"), "Expected the dedicated image delivery endpoint to be configurable");
assert.ok(source.includes("PUBLIC_MEDIA_API_URL"), "Expected the media Worker to be the image endpoint fallback");
assert.ok(source.includes("export function imageSrcSet"), "Expected responsive image srcset generation");
assert.ok(source.includes("export function uiPresetConfig"), "Expected UI packs to resolve their own private settings");
assert.ok(
  source.includes("if (!/^https?:\\/\\//.test(originalPath)) return false;"),
  "Expected repository-local fallback images to stay on the static site",
);

for (const [routePath, contractPage] of Object.entries(routeContracts)) {
  const routeSource = read(routePath);
  assert.ok(routeSource.includes(`@ui-pack/pages/${contractPage}`), `Expected ${routePath} to delegate to ${contractPage}`);
}

for (const preset of uiPresetEntries) {
  const packFiles = [
    `${preset.directory}/Head.astro`,
    `${preset.directory}/SiteShell.astro`,
    ...Object.values(routeContracts).map((contractPage) => `${preset.directory}/pages/${contractPage}`),
  ];
  for (const path of packFiles) {
    const file = read(path);
    assert.ok(!file.includes("src={withBase(item.image)}"), `Expected ${path} item images to use assetUrl`);
    assert.ok(!file.includes("src={withBase(post.data.cover)}"), `Expected ${path} post covers to use assetUrl`);
    assert.ok(!file.includes("poster={item.poster ? withBase(item.poster)"), `Expected ${path} video posters to use assetUrl`);
  }

  for (const contractPage of ["Home.astro", "Gallery.astro"]) {
    const path = `${preset.directory}/pages/${contractPage}`;
    assert.ok(read(path).includes("isPersonalPhotoImage"), `Expected ${path} to accept relative or R2 personal-photo URLs`);
  }
}

const classicHome = read("src/ui-packs/classic-a/pages/Home.astro");
const classicGallery = read("src/ui-packs/classic-a/pages/Gallery.astro");
const classicHead = read("src/ui-packs/classic-a/Head.astro");
const classicShell = read("src/ui-packs/classic-a/SiteShell.astro");
const editorialHome = read("src/ui-packs/warm-editorial-b/pages/Home.astro");
const editorialHead = read("src/ui-packs/warm-editorial-b/Head.astro");
const baseLayout = read("src/layouts/BaseLayout.astro");
assert.ok(classicHome.includes("imageUrl(") && classicHome.includes("srcset="), "Expected UI A homepage images to use R2 variants");
assert.ok(classicGallery.includes("imageUrl(") && classicGallery.includes("sizes="), "Expected UI A gallery images to be responsive");
assert.ok(
  classicHead.includes("uiPresetConfig(manifest.id)") && classicHead.includes('rel="preload"'),
  "Expected UI A to own its private hero preload",
);
assert.ok(
  classicShell.includes("uiPresetConfig(manifest.id)") && classicShell.includes("--exhibition-bg"),
  "Expected UI A shell to own its private page background",
);
assert.ok(
  editorialHome.includes("uiPresetConfig(manifest.id)") &&
    editorialHome.includes("optimizedHeroImage") &&
    editorialHome.includes("--home-hero-position"),
  "Expected UI B to own its private homepage visual",
);
assert.ok(
  editorialHead.includes("uiPresetConfig(manifest.id)") &&
    editorialHead.includes("imageUrl(heroImage, { width: 1920, quality: 78 })") &&
    editorialHead.includes('rel="preload"'),
  "Expected UI B to preload the same optimized R2 hero variant it renders",
);
assert.ok(
  !baseLayout.includes("heroBackground") && !baseLayout.includes('manifest.id === "classic"'),
  "Expected BaseLayout to stay neutral about every UI pack's private assets",
);

console.log("asset URL regression checks passed");
