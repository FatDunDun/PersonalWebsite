import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync(new URL("../src/utils/site.ts", import.meta.url), "utf8");
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
assert.ok(source.includes("PUBLIC_ASSET_BASE_URL"), "Expected assetUrl to use PUBLIC_ASSET_BASE_URL");
assert.ok(source.includes("/^(images|personal-photo|videos|personal-video)\\//"), "Expected assetUrl to target media roots");
assert.ok(source.includes("/^https?:\\/\\//.test(path)"), "Expected assetUrl to leave absolute URLs unchanged");

for (const file of astroFiles) {
  assert.ok(!file.includes("src={withBase(item.image)}"), "Expected item.image rendering to use assetUrl");
  assert.ok(!file.includes("src={withBase(post.data.cover)}"), "Expected post cover rendering to use assetUrl");
  assert.ok(!file.includes("poster={item.poster ? withBase(item.poster)"), "Expected video poster rendering to use assetUrl");
}

console.log("asset URL regression checks passed");
