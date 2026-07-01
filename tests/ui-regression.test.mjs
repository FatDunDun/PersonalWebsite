import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const adminSource = readFileSync(new URL("../src/pages/silent-orbit-7429/index.astro", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("../src/components/Footer.astro", import.meta.url), "utf8");
const headerSource = readFileSync(new URL("../src/components/Header.astro", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");

assert.ok(!adminSource.includes("分享图路径"), "Admin settings should not show the unused share image path field");
assert.ok(!adminSource.includes('data-settings-field="site.ogImage"'), "Admin settings should not edit site.ogImage");

const footerMutedText = footerSource.match(/text-\[var\(--muted\)\]/g) || [];
assert.equal(footerMutedText.length, 0, "Footer small text should use the same foreground color as the site name");

assert.ok(
  footerSource.includes("text-[var(--foreground)]"),
  "Footer should explicitly use foreground text color for light mode readability",
);

assert.ok(
  headerSource.includes("{siteConfig.author}") && !headerSource.includes("hidden font-mono text-sm tracking-wide sm:inline"),
  "Header author name should stay visible on mobile instead of hiding below the sm breakpoint",
);

assert.ok(!homeSource.includes("projectYearLabel"), "Home works section should not add maintenance-like timeline filler");
assert.ok(!homeSource.includes("projectTagHighlights"), "Home works section should not add tag filler to solve layout");
assert.ok(!homeSource.includes("作品索引"), "Home works section should not add extra explanatory content just to fill space");
assert.ok(!homeSource.includes("pieces"), "Home works section should not show object counts as filler content");
assert.ok(!homeSource.includes('md:grid-cols-[0.52fr_1.48fr]'), "Home works section should not use a separate left intro card");
assert.ok(
  homeSource.includes("data-home-works") && homeSource.includes("data-home-works-list"),
  "Home works section should be one unified panel with the project list beneath the heading",
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
