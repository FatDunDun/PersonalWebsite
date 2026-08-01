import { spawnSync } from "node:child_process";
import { uiPresetCatalog } from "../src/ui-packs/catalog.mjs";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

for (const preset of uiPresetCatalog) {
  console.log(`\nBuilding UI ${preset.code} (${preset.id})...`);
  const result = spawnSync(npmCommand, ["run", "build"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      UI_PRESET: preset.id,
    },
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
