import { strict as assert } from "node:assert";
import {
  UI_PRESET_DISPLAY_NAME_FIELD,
  appearanceFieldDefinitionError,
  appearanceFieldValueError,
  firstAppearanceImageValue,
  isSafeAppearanceFieldPath,
  mergeScopedSiteSettings,
  normalizeAppearanceInputValue,
} from "../src/ui-packs/settings-contract.mjs";

const mediaLibraries = {
  personalPhotoAssets: { kind: "image", publicRoot: "/personal-photo" },
  personalVideoAssets: { kind: "video", publicRoot: "/personal-video" },
};

const futureFields = [
  {
    path: "appearance.landing.heroVideo",
    label: "开场视频",
    type: "video",
    required: true,
    assetLibrary: "personalVideoAssets",
  },
  {
    path: "appearance.layout.columns",
    label: "内容列数",
    type: "number",
    min: 1,
    max: 6,
    step: 1,
  },
  {
    path: "appearance.motion.enabled",
    label: "启用动效",
    type: "checkbox",
  },
  {
    path: "appearance.motion.intensity",
    label: "动效强度",
    type: "range",
    min: 0,
    max: 1,
    step: 0.1,
  },
  {
    path: "appearance.palette.accent",
    label: "强调色",
    type: "color",
  },
  {
    path: "appearance.layout.mode",
    label: "布局模式",
    type: "select",
    options: [
      { label: "堆叠", value: "stack" },
      { label: "散点", value: "scatter" },
    ],
  },
  {
    path: "appearance.links.profile",
    label: "资料链接",
    type: "url",
  },
];
const futureEditableFields = [UI_PRESET_DISPLAY_NAME_FIELD, ...futureFields];

assert.equal(
  appearanceFieldDefinitionError(UI_PRESET_DISPLAY_NAME_FIELD, { mediaLibraries }),
  "",
  "Expected every UI package to share a valid optional display-name field",
);
assert.equal(
  normalizeAppearanceInputValue(UI_PRESET_DISPLAY_NAME_FIELD, "  My UI F  "),
  "My UI F",
);
assert.equal(appearanceFieldValueError(UI_PRESET_DISPLAY_NAME_FIELD, ""), "");
assert.match(
  appearanceFieldValueError(UI_PRESET_DISPLAY_NAME_FIELD, "名".repeat(49)),
  /不能超过 48/,
);

for (const field of futureFields) {
  assert.equal(
    appearanceFieldDefinitionError(field, { mediaLibraries }),
    "",
    `Expected future field ${field.path} to be valid without a homeHero contract`,
  );
}
assert.match(
  appearanceFieldDefinitionError(
    { path: "appearance.hero.image", label: "Hero", type: "image" },
    { mediaLibraries },
  ),
  /assetLibrary/,
  "Expected image and video fields to declare their own media library",
);
assert.match(
  appearanceFieldDefinitionError(
    { path: "appearance.__proto__.polluted", label: "Unsafe", type: "text" },
    { mediaLibraries },
  ),
  /不安全/,
  "Expected unsafe private-setting paths to be rejected",
);
assert.equal(
  isSafeAppearanceFieldPath("appearance..tone"),
  false,
  "Expected empty path segments to be rejected instead of aliasing another field",
);

const futureValues = {
  "appearance.landing.heroVideo": "https://media.example.com/personal-video/intro.mp4",
  "appearance.layout.columns": 4,
  "appearance.motion.enabled": true,
  "appearance.motion.intensity": 0.6,
  "appearance.palette.accent": "#4a766d",
  "appearance.layout.mode": "scatter",
  "appearance.links.profile": "/about/",
};
for (const field of futureFields) {
  assert.equal(
    appearanceFieldValueError(field, futureValues[field.path], { mediaLibraries }),
    "",
    `Expected future field value ${field.path} to validate`,
  );
}
assert.equal(normalizeAppearanceInputValue(futureFields[1], "5"), 5);
assert.equal(normalizeAppearanceInputValue(futureFields[2], false), false);
assert.equal(normalizeAppearanceInputValue(futureFields[3], "0.8"), 0.8);
assert.match(appearanceFieldValueError(futureFields[3], 1.2), /不能大于/);
assert.match(appearanceFieldValueError(futureFields[4], "red"), /#RRGGBB/);
assert.match(appearanceFieldValueError(futureFields[5], "unknown"), /有效选项/);
assert.match(appearanceFieldValueError(futureFields[6], "javascript:alert(1)"), /必须是站内路径/);
assert.match(
  appearanceFieldValueError(
    futureFields[0],
    "/personal-photo/not-a-video.jpg",
    { mediaLibraries },
  ),
  /personal-video/,
);

const remoteSettings = {
  schemaVersion: 2,
  ui: {
    activePreset: "editorial",
    presets: {
      classic: { displayName: "Classic", settingsVersion: 1, appearance: { untouched: "A" } },
      editorial: { displayName: "Editorial", settingsVersion: 1, appearance: { untouched: "B" } },
      future: {
        displayName: "Future UI",
        settingsVersion: 1,
        appearance: {
          landing: { heroVideo: "/personal-video/old.mp4" },
          layout: { columns: 2, mode: "stack" },
          motion: { enabled: false, intensity: 0.2 },
          palette: { accent: "#335544" },
          links: { profile: "/old-profile/" },
          unknownFutureNode: { keep: true },
        },
      },
      empty: {
        settingsVersion: 1,
        unknownFutureNode: { keep: true },
      },
    },
  },
  home: { headline: "remote headline", unknownShared: "keep" },
  futureTopLevel: { keep: true },
};
const localSettings = structuredClone(remoteSettings);
localSettings.ui.presets.future.displayName = "Future Custom";
localSettings.ui.presets.empty.displayName = "Name Only F";
localSettings.ui.presets.future.appearance.landing.heroVideo = "/personal-video/new.mp4";
localSettings.ui.presets.future.appearance.layout.columns = 5;
localSettings.ui.presets.future.appearance.layout.mode = "scatter";
localSettings.ui.presets.future.appearance.motion.enabled = true;
localSettings.ui.presets.future.appearance.motion.intensity = 0.8;
localSettings.ui.presets.future.appearance.palette.accent = "#4a766d";
localSettings.ui.presets.future.appearance.links.profile = "/about/";
localSettings.home.headline = "local headline";

const mergedFutureOnly = mergeScopedSiteSettings({
  remoteSettings,
  localSettings,
  settingsScopes: [["ui:future", "UI F 参数"]],
  sharedPaths: ["home.headline"],
  appearanceFieldsByPreset: { future: futureEditableFields },
});
assert.equal(mergedFutureOnly.ui.activePreset, "editorial");
assert.deepEqual(mergedFutureOnly.ui.presets.classic, remoteSettings.ui.presets.classic);
assert.deepEqual(mergedFutureOnly.ui.presets.editorial, remoteSettings.ui.presets.editorial);
assert.equal(mergedFutureOnly.home.headline, "remote headline");
assert.equal(mergedFutureOnly.home.unknownShared, "keep");
assert.equal(mergedFutureOnly.futureTopLevel.keep, true);
assert.equal(mergedFutureOnly.ui.presets.future.displayName, "Future Custom");
assert.equal(mergedFutureOnly.ui.presets.future.appearance.landing.heroVideo, "/personal-video/new.mp4");
assert.equal(mergedFutureOnly.ui.presets.future.appearance.layout.columns, 5);
assert.equal(mergedFutureOnly.ui.presets.future.appearance.layout.mode, "scatter");
assert.equal(mergedFutureOnly.ui.presets.future.appearance.motion.enabled, true);
assert.equal(mergedFutureOnly.ui.presets.future.appearance.motion.intensity, 0.8);
assert.equal(mergedFutureOnly.ui.presets.future.appearance.palette.accent, "#4a766d");
assert.equal(mergedFutureOnly.ui.presets.future.appearance.links.profile, "/about/");
assert.equal(mergedFutureOnly.ui.presets.future.appearance.unknownFutureNode.keep, true);

const mergedSharedOnly = mergeScopedSiteSettings({
  remoteSettings,
  localSettings,
  settingsScopes: [["shared", "共享内容"]],
  sharedPaths: ["home.headline"],
  appearanceFieldsByPreset: { future: futureEditableFields },
});
assert.equal(mergedSharedOnly.home.headline, "local headline");
assert.deepEqual(mergedSharedOnly.ui, remoteSettings.ui);

const mergedEmptyPreset = mergeScopedSiteSettings({
  remoteSettings,
  localSettings,
  settingsScopes: [["ui:empty", "UI Empty 参数"]],
  appearanceFieldsByPreset: { empty: [UI_PRESET_DISPLAY_NAME_FIELD] },
});
assert.equal(mergedEmptyPreset.ui.presets.empty.displayName, "Name Only F");
assert.equal(mergedEmptyPreset.ui.presets.empty.settingsVersion, 1);
assert.equal(mergedEmptyPreset.ui.presets.empty.unknownFutureNode.keep, true);
assert.throws(
  () => mergeScopedSiteSettings({
    remoteSettings,
    localSettings,
    settingsScopes: [["ui:__proto__", "Unsafe UI"]],
    appearanceFieldsByPreset: { __proto__: [] },
  }),
  /不安全的 UI 参数范围/,
);

const sharedConflictBase = structuredClone(remoteSettings);
const sharedConflictRemote = structuredClone(sharedConflictBase);
const sharedConflictLocal = structuredClone(sharedConflictBase);
sharedConflictRemote.home.headline = "remote concurrent headline";
sharedConflictLocal.home.headline = "local concurrent headline";
assert.throws(
  () => mergeScopedSiteSettings({
    remoteSettings: sharedConflictRemote,
    localSettings: sharedConflictLocal,
    baseSettings: sharedConflictBase,
    settingsScopes: [["shared", "共享内容"]],
    sharedPaths: [{ path: "home.headline", label: "首页大标题" }],
  }),
  /草稿创建后已经变化/,
  "Expected a concurrent edit to the same shared field to stop instead of overwriting remote data",
);

const uiConflictBase = structuredClone(remoteSettings);
const uiConflictRemote = structuredClone(uiConflictBase);
const uiConflictLocal = structuredClone(uiConflictBase);
uiConflictRemote.ui.presets.future.appearance.layout.columns = 3;
uiConflictLocal.ui.presets.future.appearance.layout.columns = 6;
assert.throws(
  () => mergeScopedSiteSettings({
    remoteSettings: uiConflictRemote,
    localSettings: uiConflictLocal,
    baseSettings: uiConflictBase,
    settingsScopes: [["ui:future", "UI F 参数"]],
    appearanceFieldsByPreset: { future: futureEditableFields },
  }),
  /草稿创建后已经变化/,
  "Expected a concurrent edit to the same UI-private field to stop",
);

const nameConflictBase = structuredClone(remoteSettings);
const nameConflictRemote = structuredClone(nameConflictBase);
const nameConflictLocal = structuredClone(nameConflictBase);
nameConflictRemote.ui.presets.future.displayName = "Remote F";
nameConflictLocal.ui.presets.future.displayName = "Local F";
assert.throws(
  () => mergeScopedSiteSettings({
    remoteSettings: nameConflictRemote,
    localSettings: nameConflictLocal,
    baseSettings: nameConflictBase,
    settingsScopes: [["ui:future", "UI F 名称与参数"]],
    appearanceFieldsByPreset: { future: futureEditableFields },
  }),
  /草稿创建后已经变化/,
  "Expected concurrent display-name edits to stop instead of overwriting remote data",
);

const disjointBase = structuredClone(remoteSettings);
const disjointRemote = structuredClone(disjointBase);
const disjointLocal = structuredClone(disjointBase);
disjointRemote.ui.presets.future.displayName = "Remote Rename";
disjointLocal.ui.presets.future.appearance.layout.columns = 4;
const mergedDisjointChanges = mergeScopedSiteSettings({
  remoteSettings: disjointRemote,
  localSettings: disjointLocal,
  baseSettings: disjointBase,
  settingsScopes: [["ui:future", "UI F 名称与参数"]],
  appearanceFieldsByPreset: { future: futureEditableFields },
});
assert.equal(mergedDisjointChanges.ui.presets.future.displayName, "Remote Rename");
assert.equal(mergedDisjointChanges.ui.presets.future.appearance.layout.columns, 4);

const legacyBase = structuredClone(remoteSettings);
delete legacyBase.ui.presets.future.displayName;
const legacyRemote = structuredClone(legacyBase);
const legacyLocal = structuredClone(legacyBase);
legacyLocal.ui.presets.future.appearance.layout.columns = 4;
const mergedLegacySettings = mergeScopedSiteSettings({
  remoteSettings: legacyRemote,
  localSettings: legacyLocal,
  baseSettings: legacyBase,
  settingsScopes: [["ui:future", "UI F 参数"]],
  appearanceFieldsByPreset: { future: futureEditableFields },
});
assert.equal(mergedLegacySettings.ui.presets.future.appearance.layout.columns, 4);
assert.equal(Object.hasOwn(mergedLegacySettings.ui.presets.future, "displayName"), false);

const resetNameLocal = structuredClone(remoteSettings);
resetNameLocal.ui.presets.future.displayName = "";
const mergedResetName = mergeScopedSiteSettings({
  remoteSettings,
  localSettings: resetNameLocal,
  baseSettings: remoteSettings,
  settingsScopes: [["ui:future", "UI F 名称"]],
  appearanceFieldsByPreset: { future: futureEditableFields },
});
assert.equal(mergedResetName.ui.presets.future.displayName, "");
assert.equal(mergedResetName.ui.activePreset, remoteSettings.ui.activePreset);

const newerRemote = structuredClone(remoteSettings);
newerRemote.ui.presets.future.settingsVersion = 2;
assert.throws(
  () => mergeScopedSiteSettings({
    remoteSettings: newerRemote,
    localSettings,
    settingsScopes: [["ui:future", "UI F 参数"]],
    appearanceFieldsByPreset: { future: futureEditableFields },
  }),
  /参数版本较新/,
);

const newerSchemaRemote = structuredClone(remoteSettings);
newerSchemaRemote.schemaVersion = 3;
assert.throws(
  () => mergeScopedSiteSettings({
    remoteSettings: newerSchemaRemote,
    localSettings,
    baseSettings: remoteSettings,
    settingsScopes: [["shared", "共享内容"]],
    sharedPaths: ["home.headline"],
  }),
  /配置版本高于当前管理页/,
);

assert.equal(
  firstAppearanceImageValue(
    { appearance: { cover: "/personal-photo/cover.jpg" } },
    [{ path: "appearance.cover", label: "Cover", type: "image", assetLibrary: "personalPhotoAssets" }],
  ),
  "/personal-photo/cover.jpg",
);
assert.equal(firstAppearanceImageValue(localSettings.ui.presets.future, futureFields), "");

console.log("settings contract checks passed");
