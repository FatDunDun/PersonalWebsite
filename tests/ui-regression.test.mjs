import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const adminSource = readFileSync(new URL("../src/pages/silent-orbit-7429/index.astro", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("../src/components/Footer.astro", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

assert.ok(!adminSource.includes("分享图路径"), "Admin settings should not show the unused share image path field");
assert.ok(!adminSource.includes('data-settings-field="site.ogImage"'), "Admin settings should not edit site.ogImage");

const footerMutedText = footerSource.match(/text-\[var\(--muted\)\]/g) || [];
assert.equal(footerMutedText.length, 0, "Footer small text should use the same foreground color as the site name");

assert.ok(
  footerSource.includes("text-[var(--foreground)]"),
  "Footer should explicitly use foreground text color for light mode readability",
);

assert.ok(homeSource.includes("projectYearLabel"), "Home works section should summarize the project timeline");
assert.ok(homeSource.includes("projectTagHighlights"), "Home works section should surface project tags in the left panel");
assert.ok(homeSource.includes("作品索引"), "Home works section should give the large left panel a clear information role");
assert.ok(
  homeSource.includes('md:grid-cols-[0.66fr_1.34fr]'),
  "Home works section should give more space to project cards than the left intro panel",
);

console.log("ui regression checks passed");
