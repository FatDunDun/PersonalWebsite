import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync(new URL("../src/utils/site.ts", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const astroFiles = [
  "../src/layouts/BaseLayout.astro",
  "../src/pages/index.astro",
  "../src/pages/gallery/index.astro",
  "../src/pages/videos/index.astro",
  "../src/pages/recommendations/index.astro",
  "../src/pages/articles/[slug].astro",
  "../src/pages/articles/index.astro",
  "../src/pages/about.astro",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

assert.ok(source.includes("export function assetUrl"), "Expected shared assetUrl helper");
assert.ok(source.includes("/^https?:\\/\\//.test(path)"), "Expected assetUrl to leave absolute URLs unchanged");
assert.ok(source.includes("return withBase(path);"), "Expected relative media paths to keep using GitHub Pages assets");
assert.ok(!source.includes("assetBase.replace"), "Expected repository-local relative media to avoid forced R2 rewriting");

for (const file of astroFiles) {
  assert.ok(!file.includes("src={withBase(item.image)}"), "Expected item.image rendering to use assetUrl");
  assert.ok(!file.includes("src={withBase(post.data.cover)}"), "Expected post cover rendering to use assetUrl");
  assert.ok(!file.includes("poster={item.poster ? withBase(item.poster)"), "Expected video poster rendering to use assetUrl");
}

for (const file of astroFiles.slice(1, 3)) {
  assert.ok(file.includes("isPersonalPhotoImage"), "Expected homepage/gallery to accept relative or R2 personal-photo URLs");
}

assert.ok(globalCss.includes(".site-footer"), "Expected shared footer readability styles");
assert.ok(globalCss.includes("--footer-text"), "Expected footer text color to avoid low-contrast muted text on light background images");
assert.ok(!globalCss.includes("rgb(237 243 239 / 0.92)"), "Expected light-mode footer to avoid an opaque solid block over the background image");
assert.ok(globalCss.includes("rgb(237 243 239 / 0.18)"), "Expected light-mode footer to keep a light transparent wash");
assert.ok(globalCss.includes("text-shadow"), "Expected footer text to use a subtle halo for readability without opaque background");

console.log("asset URL regression checks passed");
