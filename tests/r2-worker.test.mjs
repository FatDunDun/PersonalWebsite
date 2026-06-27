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
  "Cache-Control",
  "Access-Control-Allow-Origin",
  "return json",
];

for (const snippet of requiredWorkerSnippets) {
  assert.ok(source.includes(snippet), "Expected Worker source to include " + snippet);
}

assert.ok(wrangler.includes("[[r2_buckets]]"), "Expected wrangler example to bind R2 bucket");
assert.ok(wrangler.includes("binding = \"ASSETS_BUCKET\""), "Expected R2 bucket binding name to match Worker code");

console.log("R2 Worker regression checks passed");
