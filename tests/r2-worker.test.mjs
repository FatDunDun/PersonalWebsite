import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync(new URL("../workers/media-api/src/index.ts", import.meta.url), "utf8");
const wrangler = readFileSync(new URL("../workers/media-api/wrangler.example.toml", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("../src/pages/silent-orbit-7429/index.astro", import.meta.url), "utf8");

const requiredWorkerSnippets = [
  "interface Env",
  "ASSETS_BUCKET",
  "ADMIN_TOKEN",
  "ASSET_BASE_URL",
  "handleUpload",
  "handleList",
  "handleDelete",
  "handleCreateFolder",
  "handleImage",
  'url.pathname.startsWith("/image/")',
  "acceptedImageFormat",
  'accept.includes("image/avif")',
  'accept.includes("image/webp")',
  'fit: "scale-down"',
  "normalizeFolderKey",
  "Cache-Control",
  "Access-Control-Allow-Origin",
  "return json",
];

for (const snippet of requiredWorkerSnippets) {
  assert.ok(source.includes(snippet), "Expected Worker source to include " + snippet);
}

assert.ok(
  source.includes('delimiter: "/"') && source.includes("delimitedPrefixes"),
  "Expected Worker list endpoint to expose immediate R2 subfolders",
);

assert.ok(
  source.includes('url.pathname === "/media/folder"') &&
    source.includes('request.method === "POST"') &&
    source.includes('contentType: "application/x-directory"'),
  "Expected Worker to support creating R2 folder placeholders",
);

assert.ok(
  source.includes("normalizePrefix") &&
    source.includes("normalizeMediaPath") &&
    source.includes("rootFromMediaPath"),
  "Expected Worker to allow safe nested media prefixes under allowed roots",
);

const recommendationUploadRoot = adminSource.match(
  /\$\("\[data-recommendation-image-file\]"\)[\s\S]*?uploadImages\(\[file\],\s*\{[\s\S]*?publicRoot:\s*"\/([^"/]+)"/,
)?.[1];
const workerMediaRoots = JSON.parse(source.match(/const MEDIA_ROOTS = (\[[^;]+\]);/)?.[1] || "[]");
assert.equal(recommendationUploadRoot, "recommendation-assets", "Expected admin recommendation uploads to use their dedicated R2 root");
assert.ok(
  workerMediaRoots.includes(recommendationUploadRoot),
  "Expected Worker to allow the R2 root used by admin recommendation cover uploads",
);

assert.ok(wrangler.includes("[[r2_buckets]]"), "Expected wrangler example to bind R2 bucket");
assert.ok(wrangler.includes("binding = \"ASSETS_BUCKET\""), "Expected R2 bucket binding name to match Worker code");
assert.ok(
  source.indexOf('url.pathname.startsWith("/image/")') < source.indexOf("originAllowed(request, env)"),
  "Expected transformed images to be publicly readable without the admin token",
);

console.log("R2 Worker regression checks passed");
