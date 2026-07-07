import { existsSync, readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const adminSource = read("src/pages/silent-orbit-7429/index.astro");
const astroConfig = read("astro.config.mjs");
const workerSource = read("workers/media-api/src/index.ts");
const handoff = read("HANDOFF.md");
const memory = read("memory.md");
const gitignore = read(".gitignore");

assert.ok(!adminSource.includes("data-remember-token"), "Admin tokens should not offer persistent browser storage");
assert.ok(!adminSource.includes("localStorage.getItem(TOKEN_KEY)"), "GitHub token should not be read from localStorage");
assert.ok(!adminSource.includes("localStorage.getItem(MEDIA_TOKEN_KEY)"), "Media token should not be read from localStorage");
assert.ok(!adminSource.includes("localStorage.setItem(TOKEN_KEY"), "GitHub token should not be written to localStorage");
assert.ok(!adminSource.includes("localStorage.setItem(MEDIA_TOKEN_KEY"), "Media token should not be written to localStorage");
assert.ok(!adminSource.includes("Function(`"), "Admin data parsing should not evaluate repository content");
assert.ok(adminSource.includes("JSON.parse"), "Admin data parsing should use data parsing rather than code execution");

assert.ok(astroConfig.includes("LOCAL_CONTENT_API_TOKEN"), "Local content API should require an explicit dev token");
assert.ok(astroConfig.includes("LOCAL_CONTENT_API_ENABLED"), "Local content API should be behind an explicit opt-in flag");
assert.ok(astroConfig.includes("Forbidden"), "Local content API should reject requests without its local token");
assert.ok(astroConfig.includes("Payload is too large"), "Local content API should reject oversized request bodies");

assert.ok(!workerSource.includes('env.ALLOWED_ORIGIN || "*"'), "Worker CORS should not default to wildcard origin");
assert.ok(workerSource.includes("originAllowed"), "Worker should verify request Origin");
assert.ok(workerSource.includes('"Vary": "Origin"'), "Worker CORS responses should vary by Origin");

for (const file of [handoff, memory]) {
  assert.ok(!file.includes("/Users/micylt/Desktop/PersonalWebsite"), "Public handoff docs should not expose local absolute paths");
  assert.ok(!file.includes("/silent-orbit-7429"), "Public handoff docs should not expose the hidden admin route");
  assert.ok(!file.includes("https://fatdundun.github.io/PersonalWebsite/silent-orbit-7429/"), "Public handoff docs should not expose the full admin URL");
  assert.ok(file.includes("公开") || file.includes("安全"), "Public markdown handoff docs should be written in Chinese");
}

assert.ok(gitignore.includes("LOCAL_MAINTENANCE.md"), "Private local maintenance notes should be ignored by Git");

for (const path of ["public/.DS_Store", "dist/.DS_Store"]) {
  assert.ok(!existsSync(new URL(`../${path}`, import.meta.url)), `${path} should not exist in publishable trees`);
}

console.log("security hardening checks passed");
