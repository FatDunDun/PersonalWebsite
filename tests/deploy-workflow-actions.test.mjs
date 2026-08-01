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
assert.match(
  workflow,
  /on:\s*\n\s+push:\s*\n\s+branches:\s*\[main\]/,
  "A UI preset commit to main must trigger the Pages workflow",
);
assert.ok(
  workflow.includes("run: npm test"),
  "Pages deployment must verify every registered UI pack before building",
);
assert.match(
  workflow,
  /^\s*run: npm run build:ui-packs\s*$/m,
  "Pages deployment must compile every registered UI pack",
);
assert.match(
  workflow,
  /^\s*run: npm run build\s*$/m,
  "Pages deployment must build the preset selected in siteSettings",
);
assert.ok(
  workflow.indexOf("run: npm run build:ui-packs") < workflow.indexOf("run: npm run build\n"),
  "The selected UI must be rebuilt after all-pack verification so it remains the deployment artifact",
);
assert.ok(
  !workflow.includes("UI_PRESET:"),
  "Production deploy must not override the UI preset selected in siteSettings",
);

console.log("deploy workflow action version checks passed");
