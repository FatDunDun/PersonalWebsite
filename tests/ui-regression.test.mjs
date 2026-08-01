import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const adminSource = read("src/pages/silent-orbit-7429/index.astro");
const homeRouteSource = read("src/pages/index.astro");
const { uiPresetCatalog } = await import(new URL("../src/ui-packs/catalog.mjs", import.meta.url));
const uiPresetEntries = Array.isArray(uiPresetCatalog) ? uiPresetCatalog : Object.values(uiPresetCatalog);
const editorialPreset = uiPresetEntries.find((preset) => preset.id === "editorial");

assert.ok(!adminSource.includes("分享图路径"), "Admin settings should not show the unused share image path field");
assert.ok(!adminSource.includes('data-settings-field="site.ogImage"'), "Admin settings should not edit site.ogImage");
assert.ok(editorialPreset, "Expected the editorial preset to keep its dedicated visual regression baseline");

assert.ok(
  homeRouteSource.includes('import Home from "@ui-pack/pages/Home.astro"') &&
    homeRouteSource.includes('import BaseLayout from "@/layouts/BaseLayout.astro"'),
  "Home route should delegate visual structure to the active UI pack",
);

const footerSource = read(`${editorialPreset.directory}/components/Footer.astro`);
const headerSource = read(`${editorialPreset.directory}/components/Header.astro`);
const homeSource = read(`${editorialPreset.directory}/pages/Home.astro`);

const footerMutedText = footerSource.match(/text-\[var\(--muted\)\]/g) || [];
assert.equal(footerMutedText.length, 0, "Editorial footer small text should use the same foreground color as the site name");
assert.ok(footerSource.includes("text-[var(--foreground)]"), "Editorial footer should keep explicit light-mode readability");
assert.ok(
  headerSource.includes("{siteConfig.author}") && !headerSource.includes("hidden font-mono text-sm tracking-wide sm:inline"),
  "Editorial header author name should stay visible on mobile",
);

assert.ok(!homeSource.includes("projectYearLabel"), "Editorial home should not add maintenance-like timeline filler");
assert.ok(!homeSource.includes("projectTagHighlights"), "Editorial home should not add tag filler to solve layout");
assert.ok(!homeSource.includes("作品索引"), "Editorial home should not add extra explanatory content just to fill space");
assert.ok(!homeSource.includes("pieces"), "Editorial home should not show object counts as filler content");
assert.ok(!homeSource.includes('md:grid-cols-[0.52fr_1.48fr]'), "Editorial home should not use a separate left intro card");
assert.ok(
  homeSource.includes("data-home-works") && homeSource.includes("data-home-works-list"),
  "Editorial works section should remain one unified panel",
);

assert.ok(
  !adminSource.includes("color: var(--background);"),
  "Admin buttons should not use the page background color as button text color",
);
assert.ok(
  adminSource.includes(".orbit-button:disabled"),
  "Admin buttons should define disabled text color instead of falling back to the browser default",
);
assert.ok(
  adminSource.includes(".dark .orbit-button-primary"),
  "Admin primary buttons should keep explicit contrast in dark mode",
);
assert.ok(adminSource.includes('const ARTICLE_IMAGE_ASSETS_PATH = "public/article-assets"'), "Admin should store article images in public/article-assets");
assert.ok(adminSource.includes('const ARTICLE_VIDEO_ASSETS_PATH = "public/article-videos"'), "Admin should store article videos in public/article-videos");
assert.ok(adminSource.includes('const PERSONAL_PHOTO_PATH = "public/personal-photo"'), "Admin should keep homepage photos in public/personal-photo");
assert.ok(adminSource.includes('const PERSONAL_VIDEO_PATH = "public/personal-video"'), "Admin should keep homepage videos in public/personal-video");
assert.ok(adminSource.includes('const RECOMMENDATION_ASSETS_PATH = "public/recommendation-assets"'), "Admin should store recommendation covers separately");
assert.ok(adminSource.includes('const SITE_ASSETS_PATH = "public/site-assets"'), "Admin should store site-level assets separately");
assert.ok(!adminSource.includes('const IMAGES_PATH = "public/images"'), "Admin should not use public/images as a mixed asset bucket");
assert.ok(!adminSource.includes('const VIDEOS_PATH = "public/videos"'), "Admin should not use public/videos as a generic article video bucket");

console.log("ui regression checks passed");
