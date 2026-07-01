import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync(new URL("../workers/media-api/src/index.ts", import.meta.url), "utf8");
const wrangler = readFileSync(new URL("../workers/media-api/wrangler.example.toml", import.meta.url), "utf8");

const requiredWorkerSnippets = [
  "interface Env",
  "ASSETS_BUCKET",
  "ADMIN_TOKEN",
  "ASSET_BASE_URL",
  "handleUpload",
  "handleList",
  "handleDelete",
  "handleCreateFolder",
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

assert.ok(wrangler.includes("[[r2_buckets]]"), "Expected wrangler example to bind R2 bucket");
assert.ok(wrangler.includes("binding = \"ASSETS_BUCKET\""), "Expected R2 bucket binding name to match Worker code");

console.log("R2 Worker regression checks passed");
