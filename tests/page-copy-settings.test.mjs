import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const settingsSource = read("src/data/siteSettings.ts");
const adminSource = read("src/pages/silent-orbit-7429/index.astro");
const astroConfigSource = read("astro.config.mjs");
const { uiPresetCatalog } = await import(new URL("../src/ui-packs/catalog.mjs", import.meta.url));
const { UI_PRESET_DISPLAY_NAME_FIELD } = await import(
  new URL("../src/ui-packs/settings-contract.mjs", import.meta.url)
);

const settingsMatch = settingsSource.match(/export\s+const\s+siteSettings\s*=\s*([\s\S]*);\s*$/);
assert.ok(settingsMatch, "Expected site settings to remain a parseable JSON export");
const parsedSettings = JSON.parse(settingsMatch[1]);
const uiPresetEntries = Array.isArray(uiPresetCatalog) ? uiPresetCatalog : Object.values(uiPresetCatalog);
const getByPath = (value, fieldPath) =>
  String(fieldPath || "").split(".").filter(Boolean).reduce((current, key) => current?.[key], value);
const supportedAppearanceFieldTypes = new Set([
  "text",
  "textarea",
  "select",
  "number",
  "range",
  "color",
  "url",
  "checkbox",
  "image",
  "video",
]);

assert.ok(
  uiPresetEntries.some((preset) => preset.id === parsedSettings.ui?.activePreset),
  "Expected the active UI preset to remain valid after an admin one-click deployment",
);
assert.equal(parsedSettings.schemaVersion, 2, "Expected the shared/private settings boundary to use schema version 2");
assert.ok(parsedSettings.home?.headline && parsedSettings.home?.intro, "Expected headline and intro to remain shared content");
assert.equal(
  Object.hasOwn(parsedSettings.home || {}, "heroBackgroundImage"),
  false,
  "Expected the homepage background to no longer live in shared content",
);
assert.ok(uiPresetEntries.some((preset) => preset.id === "classic"), "Expected the classic UI pack to be available to the admin");
assert.ok(uiPresetEntries.some((preset) => preset.id === "editorial"), "Expected the editorial UI pack to be available to the admin");
for (const preset of uiPresetEntries) {
  const privateSettings = parsedSettings.ui?.presets?.[preset.id];
  assert.ok(String(preset.label || "").trim(), `Expected UI ${preset.code} to keep a default fallback label`);
  assert.equal(typeof privateSettings?.displayName, "string", `Expected UI ${preset.code} to allow a private display name`);
  assert.ok(
    privateSettings.displayName.length <= UI_PRESET_DISPLAY_NAME_FIELD.maxLength,
    `Expected UI ${preset.code} display name to respect the management limit`,
  );
  assert.equal(privateSettings?.settingsVersion, preset.settingsVersion, `Expected UI ${preset.code} to own versioned private settings`);
  const packAdminSource = read(`${preset.directory}/admin.mjs`);
  assert.ok(packAdminSource.includes("appearanceFields"), `Expected UI ${preset.code} to own its admin parameter schema`);
  for (const field of preset.appearanceFields || []) {
    assert.notEqual(field.path, UI_PRESET_DISPLAY_NAME_FIELD.path, `Expected UI ${preset.code} to leave displayName to the core manager`);
    assert.ok(field.path && field.label, `Expected UI ${preset.code} admin fields to declare path and label`);
    assert.ok(supportedAppearanceFieldTypes.has(field.type), `Expected UI ${preset.code} field ${field.path} to use a supported type`);
    assert.notEqual(getByPath(privateSettings, field.path), undefined, `Expected UI ${preset.code} settings to define ${field.path}`);
    if (field.required) {
      const fieldValue = getByPath(privateSettings, field.path);
      assert.ok(
        field.type === "checkbox" ? fieldValue === true : String(fieldValue ?? "").trim(),
        `Expected required UI ${preset.code} field ${field.path} to have a value`,
      );
    }
  }
}
const isolationProbe = structuredClone(parsedSettings);
const originalSharedHome = structuredClone(isolationProbe.home);
const originalEditorialSettings = structuredClone(isolationProbe.ui.presets.editorial);
const originalActivePreset = isolationProbe.ui.activePreset;
isolationProbe.ui.presets.classic.appearance.homeHero.backgroundImage = "https://assets.example.com/classic-only.jpg";
isolationProbe.ui.presets.classic.displayName = "Custom A";
assert.deepEqual(
  isolationProbe.ui.presets.editorial,
  originalEditorialSettings,
  "Changing UI A appearance must not mutate UI B private settings",
);
assert.deepEqual(
  isolationProbe.home,
  originalSharedHome,
  "Changing one UI name or appearance must not mutate shared homepage content",
);
assert.equal(
  isolationProbe.ui.activePreset,
  originalActivePreset,
  "Renaming one UI must not switch the online preset",
);
assert.ok(
  astroConfigSource.includes('"src/data/siteSettings.ts"'),
  "Expected local content mode to allow the UI preset setting file so dev changes can trigger HMR",
);
assert.ok(
  adminSource.includes('import { uiPresetCatalog } from "@/ui-packs/catalog.mjs"'),
  "Expected the admin UI selector to use the shared preset catalog",
);
assert.ok(
  adminSource.includes("const currentBuildPreset = import.meta.env.PUBLIC_UI_PRESET || siteSettings.ui.activePreset"),
  "Expected the admin to distinguish the current build from the configured default",
);
assert.ok(
  adminSource.includes("uiPresetCatalog,\n  currentBuildPreset,"),
  "Expected the admin initial payload to include both the UI catalog and current build preset",
);
assert.equal(
  adminSource.match(/data-settings-field="ui\.activePreset"/g)?.length || 0,
  0,
  "Expected ordinary page saves to never own the online UI pointer",
);
for (const hook of [
  "data-ui-preset-manager",
  "data-ui-preset-card",
  "data-ui-preset-set-default",
  "data-ui-preset-select",
  "data-ui-current-build",
  "data-ui-appearance-manager",
  "data-ui-appearance-select",
  "data-ui-appearance-field",
  "data-save-ui-appearance",
]) {
  assert.ok(adminSource.includes(hook), `Expected the admin UI selector to include ${hook}`);
}
assert.ok(
  adminSource.includes("UI_PRESET_DISPLAY_NAME_FIELD") &&
    adminSource.includes("[UI_PRESET_DISPLAY_NAME_FIELD, ...uiPackageAppearanceFieldDefinitions(presetId)]") &&
    adminSource.includes("data-ui-preset-label") &&
    adminSource.includes("data-ui-preset-option") &&
    adminSource.includes(".displayName ||") &&
    adminSource.includes("const onlineSettings =") &&
    adminSource.includes("uiPresetLabel(onlinePreset, onlineSettings)"),
  "Expected UI names to use private displayName values with catalog fallback and separate online-state rendering",
);
const workspaceLabelSource = adminSource.match(/const uiPresetWorkspaceLabel = \([\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  workspaceLabelSource.includes("uiAppearanceFields.find(") &&
    workspaceLabelSource.includes("UI_PRESET_DISPLAY_NAME_FIELD.path") &&
    workspaceLabelSource.includes("displayNameField.value") &&
    adminSource.includes("uiPresetWorkspaceLabel(label.dataset.uiPresetLabel, displaySettings)") &&
    adminSource.includes("uiPresetWorkspaceLabel(presetId, displaySettings)") &&
    adminSource.includes("uiPresetLabel(onlinePreset, onlineSettings)"),
  "Expected unsaved UI names to preview across cards and selectors without impersonating the online label",
);
assert.ok(
  adminSource.includes("uiPresetIds.has(settings.ui?.activePreset)"),
  "Expected UI preset saves to reject values outside the shared catalog",
);
const saveSettingsSource = adminSource.match(/const saveSettings = async \(\) => \{[\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  saveSettingsSource.includes("queueSettingsChange({") && saveSettingsSource.includes('scope: "shared"'),
  "Expected shared content to queue src/data/siteSettings.ts through the existing content draft path",
);
assert.ok(
  saveSettingsSource.includes('scopeLabel: "共享内容"') &&
    !saveSettingsSource.includes("collectUiAppearanceSettings("),
  "Expected shared content saves to stay separate from UI appearance inputs",
);
const saveAppearanceSource = adminSource.match(/const saveUiAppearanceSettings = async \(\) => \{[\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  saveAppearanceSource.includes("collectUiAppearanceSettings(presetId)") &&
    saveAppearanceSource.includes("queueSettingsChange({") &&
    saveAppearanceSource.includes("validateUiAppearanceSettings(settings, presetId)") &&
    saveAppearanceSource.includes("fillUiAppearanceSettings();\n        renderUiPresetSelection();") &&
    saveAppearanceSource.includes("名称与参数") &&
    saveAppearanceSource.includes("其他 UI 未修改"),
  "Expected UI name and appearance saves to update immediately and merge only the selected private settings subtree",
);
assert.ok(
  !adminSource.includes("appearance.homeHero") &&
    adminSource.includes("uiAppearanceFieldDefinitions(presetId)") &&
    adminSource.includes("validateUiAppearanceControls(presetId)") &&
    adminSource.includes("appearanceFieldValueError(field, value, { mediaLibraries })") &&
    adminSource.includes("normalizeAppearanceInputValue(") &&
    adminSource.includes("firstAppearanceImageValue(") &&
    adminSource.includes('applyUiAppearanceMediaValue(videoValue, pick, "video")'),
  "Expected the admin to use the shared settings contract for each UI package without a fixed hero contract",
);
assert.ok(
  !saveSettingsSource.includes("state.uiAppearanceDirty") &&
    !saveAppearanceSource.includes("state.sharedSettingsDirty") &&
    saveSettingsSource.includes("fillSharedSettings()") &&
    saveAppearanceSource.includes("fillUiAppearanceSettings()"),
  "Expected shared and package-specific inputs to be saveable independently without mutual dirty-state lockout",
);
assert.ok(
  adminSource.includes("const queueSettingsChange = ({ content, scope, scopeLabel") &&
    adminSource.includes("const settingsScopes = Array.from(scopes.entries())") &&
    adminSource.includes('scope: `ui:${presetId}`'),
  "Expected multiple settings saves to merge into one accurately labelled settings-file draft",
);
const connectSource = adminSource.match(/const connect = async \(\) => \{[\s\S]*?\n      \};/)?.[0] || "";
const clearTokenSource = adminSource.match(/const clearToken = async \(\) => \{[\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  connectSource.includes("captureSettingsInputState()") &&
    connectSource.includes("restoreSettingsInputState(settingsInputState)") &&
    connectSource.includes("hasPendingContentWork") &&
    connectSource.includes("loadMediaLibrariesSafely()") &&
    connectSource.includes("allPendingMedia().length"),
  "Expected credential connection to preserve drafts while still refreshing content for media-only work",
);
assert.ok(
  clearTokenSource.includes("hasUnsavedWork") && clearTokenSource.includes("当前内容没有重新加载"),
  "Expected credential clearing to avoid discarding unsaved inputs or queued drafts",
);
const mergeSettingsSource = adminSource.match(/const mergeQueuedSettingsWithRemote = \([\s\S]*?\n      \};/)?.[0] || "";
const syncPendingSource = adminSource.match(/const syncPendingChanges = async \([\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  mergeSettingsSource.includes("const sharedPaths = settingsFields.map((field)") &&
    mergeSettingsSource.includes("const appearanceFieldsByPreset = Object.fromEntries(") &&
    mergeSettingsSource.includes("[UI_PRESET_DISPLAY_NAME_FIELD, ...(preset.appearanceFields || [])]") &&
    mergeSettingsSource.includes("return mergeScopedSiteSettings({") &&
    mergeSettingsSource.includes("baseSettings,") &&
    mergeSettingsSource.includes("settingsScopes,") &&
    mergeSettingsSource.includes("sharedPaths,") &&
    mergeSettingsSource.includes("appearanceFieldsByPreset,"),
  "Expected queued settings to use the tested shared contract for scoped three-way merges",
);
assert.ok(
  syncPendingSource.includes("getFile(SETTINGS_PATH, parentSha)") &&
    syncPendingSource.includes("mergeQueuedSettingsWithRemote({") &&
    syncPendingSource.includes("if (!file.settingsScopes?.length)") &&
    syncPendingSource.includes("baseSettings: state.original.settings") &&
    syncPendingSource.includes("restoreSettingsInputState(settingsInputState)"),
  "Expected settings sync to merge against the exact latest parent commit and preserve unknown future fields",
);
const removePendingSource = adminSource.match(/const removePendingChange = \(id\) => \{[\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  removePendingSource.includes("captureSettingsInputState()") &&
    removePendingSource.includes("restoreSettingsInputState(settingsInputState)") &&
    removePendingSource.includes("尚未保存的页面配置输入仍然保留"),
  "Expected cancelling a settings draft to preserve newer unsaved shared or UI inputs",
);
const selectSectionSource = adminSource.match(/const selectSection = \(section\) => \{[\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  adminSource.includes("const cancelPendingMediaPickOutside = (section) =>") &&
    selectSectionSource.includes("cancelPendingMediaPickOutside(section)") &&
    selectSectionSource.includes("未修改任何字段"),
  "Expected leaving a media picker to cancel its stale target instead of writing into another UI preset",
);
assert.ok(
  !adminSource.includes("uiAppearanceBackground(") &&
    adminSource.includes('if (item.path === SETTINGS_PATH) return "";'),
  "Expected non-image settings drafts to avoid calling a removed fixed-hero preview helper",
);
assert.ok(
  adminSource.includes('field.dataset.uiAppearanceMissing === "true"') &&
    adminSource.includes("delete field.dataset.uiAppearanceMissing") &&
    adminSource.includes("appearanceFieldValueError(field, value, { mediaLibraries })"),
  "Expected future optional native controls to keep stable values and use shared typed validation",
);
const setDefaultUiPresetSource = adminSource.match(/const setDefaultUiPreset = async \(presetId\) => \{[\s\S]*?\n      \};/)?.[0] || "";
assert.ok(
  setDefaultUiPresetSource.includes("uiPresetIds.has(presetId)") &&
    setDefaultUiPresetSource.includes("const remoteFile = await getFile(SETTINGS_PATH)") &&
    setDefaultUiPresetSource.includes('readExportedValue(fromBase64(remoteFile.content), "siteSettings")') &&
    setDefaultUiPresetSource.includes('setByPath(deploymentSettings, "ui.activePreset", presetId)') &&
    setDefaultUiPresetSource.includes("await putFile({") &&
    setDefaultUiPresetSource.includes("content: toBase64(serializedSettings)") &&
    setDefaultUiPresetSource.includes("sha: remoteFile.sha") &&
    !setDefaultUiPresetSource.includes("queueContentChange({") &&
    !setDefaultUiPresetSource.includes("syncPendingChanges(") &&
    !setDefaultUiPresetSource.includes("collectSettings()") &&
    !setDefaultUiPresetSource.includes("collectUiAppearanceSettings(") &&
    !setDefaultUiPresetSource.includes("saveSettings()"),
  "Expected one-click UI deployment to update only the latest remote preset through a SHA-guarded single-file commit",
);
assert.ok(
  setDefaultUiPresetSource.includes("state.pendingChanges.files.some((item) => item.path === SETTINGS_PATH)") &&
    setDefaultUiPresetSource.includes("避免改变草稿内容") &&
    setDefaultUiPresetSource.includes("state.sharedSettingsDirty || state.uiAppearanceDirty"),
  "Expected quick UI switching to stop when a page-settings draft already exists",
);
assert.ok(
  adminSource.includes("data-ui-preset-default-badge") &&
    adminSource.includes("data-ui-preset-build-badge") &&
    adminSource.includes("一键部署上线 UI") &&
    adminSource.includes("uiPresetDeploying") &&
    adminSource.includes('setAttribute("aria-busy", String(deploying))') &&
    adminSource.includes("其他草稿不会一起发布") &&
    adminSource.includes("GitHub Pages 重建"),
  "Expected one-click UI deployment to expose online/build state, publishing lock, isolation, and deployment timing",
);

assert.ok(settingsSource.includes('"pages": {'), "Expected site settings to define page-level copy");

const pageKeys = ["articles", "gallery", "videos", "recommendations", "about"];
const pageFiles = {
  articles: "src/pages/articles/index.astro",
  gallery: "src/pages/gallery/index.astro",
  videos: "src/pages/videos/index.astro",
  recommendations: "src/pages/recommendations/index.astro",
  about: "src/pages/about.astro",
};
const contractPageFiles = {
  articles: "ArticlesIndex.astro",
  gallery: "Gallery.astro",
  videos: "Videos.astro",
  recommendations: "Recommendations.astro",
  about: "About.astro",
};
const oldInlineCopy = {
  articles: ["Journal / field notes", "面向长期维护的 Markdown/MDX 文章索引。"],
  gallery: ["Frames / captured light", "以网格方式保存图片样本。"],
  videos: ["PersonalVideo / moving frames", "用短视频保存日常、旅行和 vlog 片段。"],
  recommendations: ["Taste / private index", "把长期喜欢、反复回看或想郑重推荐的书籍、影视、歌曲和游戏放在这里。"],
  about: ["Profile / archive owner", "写作、影像、前端工程和小型工具爱好者。"],
};

for (const key of pageKeys) {
  assert.ok(settingsSource.includes(`"${key}": {`), `Expected site settings to include ${key} page copy`);
  assert.ok(adminSource.includes(`data-settings-field="pages.${key}.kicker"`), `Expected admin to edit ${key} kicker`);
  assert.ok(adminSource.includes(`data-settings-field="pages.${key}.title"`), `Expected admin to edit ${key} title`);
  assert.ok(adminSource.includes(`data-settings-field="pages.${key}.description"`), `Expected admin to edit ${key} description`);

  const pageSource = read(pageFiles[key]);
  assert.ok(pageSource.includes('import BaseLayout from "@/layouts/BaseLayout.astro"'), `Expected ${pageFiles[key]} to keep the shared route shell`);
  assert.ok(
    pageSource.includes(`@ui-pack/pages/${contractPageFiles[key]}`),
    `Expected ${pageFiles[key]} to delegate rendering to the active UI pack`,
  );
  assert.ok(pageSource.includes("pageCopy"), `Expected ${pageFiles[key]} to keep editable SEO copy`);

  for (const preset of uiPresetEntries) {
    const packPagePath = `${preset.directory}/pages/${contractPageFiles[key]}`;
    const packPageSource = read(packPagePath);
    assert.ok(packPageSource.includes("pageCopy"), `Expected ${packPagePath} to render shared page copy`);
    for (const text of oldInlineCopy[key]) {
      assert.ok(!packPageSource.includes(text), `Expected ${packPagePath} not to hard-code old page copy: ${text}`);
    }
  }
}

assert.ok(adminSource.includes('data-section="pageCopy"'), "Expected admin sidebar to include a page copy editor section");
assert.ok(adminSource.includes('data-view="pageCopy"'), "Expected admin to render a page copy editor view");
assert.ok(adminSource.includes("栏目文案"), "Expected admin copy to name the page copy editor in Chinese");

const aboutResumeFields = [
  "pages.about.image",
  "pages.about.imageAlt",
  "pages.about.role",
  "pages.about.company",
  "pages.about.email",
  "pages.about.location",
  "aboutSummaryText",
  "aboutFocusText",
  "aboutLinksText",
];

for (const field of aboutResumeFields) {
  assert.ok(adminSource.includes(`data-settings-field="${field}"`), `Expected admin to edit about resume field ${field}`);
}

for (const preset of uiPresetEntries) {
  const aboutPagePath = `${preset.directory}/pages/About.astro`;
  const aboutPageSource = read(aboutPagePath);
  for (const snippet of ["pageCopy.company", "pageCopy.email", "pageCopy.summary", "pageCopy.focus", "pageCopy.links"]) {
    assert.ok(aboutPageSource.includes(snippet), `Expected ${aboutPagePath} to render editable resume data via ${snippet}`);
  }
  for (const staleCopy of ["关于这个网站", "这是一个从零搭建的个人网站模板", "你可以把这里替换为邮箱"]) {
    assert.ok(!aboutPageSource.includes(staleCopy), `Expected ${aboutPagePath} to avoid old hard-coded template copy: ${staleCopy}`);
  }
}

const editorialPreset = uiPresetEntries.find((preset) => preset.id === "editorial");
assert.ok(editorialPreset, "Expected the editorial preset to keep its dedicated about-page visual baseline");
const editorialAboutPagePath = `${editorialPreset.directory}/pages/About.astro`;
const editorialAboutPageSource = read(editorialAboutPagePath);
for (const snippet of ["about-content-card", "profile-index", "profile-index__header", "profile-index__grid", "profile-index__item"]) {
  assert.ok(editorialAboutPageSource.includes(snippet), `Expected ${editorialAboutPagePath} to include ${snippet}`);
}
assert.ok(
  !editorialAboutPageSource.includes('mt-6 grid gap-3 sm:grid-cols-2'),
  `Expected ${editorialAboutPagePath} to avoid the old four-card facts grid`,
);

assert.ok(
  adminSource.includes('newButton.hidden = isMediaLibrarySection(section) || section === "drafts" || section === "pageCopy";'),
  "Expected page copy section to avoid showing the global new button",
);
assert.ok(
  adminSource.includes('setCount("pageCopy", "编辑");'),
  "Expected admin sidebar counts to support page copy",
);

console.log("page copy settings checks passed");
