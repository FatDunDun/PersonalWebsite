import { appearanceFields as classicAppearanceFields } from "./classic-a/admin.mjs";
import { appearanceFields as editorialAppearanceFields } from "./warm-editorial-b/admin.mjs";

export const uiPresetCatalog = Object.freeze([
  Object.freeze({
    id: "classic",
    code: "A",
    label: "经典沉浸版",
    description: "保留最初的通透玻璃、全景背景与细腻动态。",
    directory: "src/ui-packs/classic-a",
    contractVersion: 1,
    settingsVersion: 1,
    appearanceFields: classicAppearanceFields,
  }),
  Object.freeze({
    id: "editorial",
    code: "B",
    label: "暖调编辑版",
    description: "以暖纸张、陶土、松绿和黄铜为基调的当前版本。",
    directory: "src/ui-packs/warm-editorial-b",
    contractVersion: 1,
    settingsVersion: 1,
    appearanceFields: editorialAppearanceFields,
  }),
]);
