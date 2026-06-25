import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");

const requiredActions = [
  "actions/checkout@v7",
  "actions/setup-node@v6",
  "actions/configure-pages@v6",
  "actions/upload-pages-artifact@v5",
  "actions/deploy-pages@v5",
];

for (const action of requiredActions) {
  assert.ok(workflow.includes(action), "Expected deploy workflow to use " + action);
}

const deprecatedActions = [
  "actions/checkout@v4",
  "actions/setup-node@v4",
  "actions/configure-pages@v5",
  "actions/upload-pages-artifact@v3",
  "actions/deploy-pages@v4",
];

for (const action of deprecatedActions) {
  assert.ok(!workflow.includes(action), "Deploy workflow should avoid Node 20 action runtime warning from " + action);
}

assert.ok(workflow.includes("node-version: 22"), "Project build should continue using Node 22");

console.log("deploy workflow action version checks passed");
