export const SITE_SETTINGS_SCHEMA_VERSION = 2;

export const SUPPORTED_APPEARANCE_FIELD_TYPES = Object.freeze([
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

export const UI_PRESET_DISPLAY_NAME_FIELD = Object.freeze({
  path: "displayName",
  label: "UI 包名称",
  type: "text",
  allowMissing: true,
  maxLength: 48,
  placeholder: "给这个 UI 起一个容易识别的名称",
  help: "只修改管理页里显示的名称，不会改变稳定 ID、版本代号或页面内容。",
});

const supportedAppearanceFieldTypes = new Set(SUPPORTED_APPEARANCE_FIELD_TYPES);
const unsafePathSegments = new Set(["__proto__", "prototype", "constructor"]);
const pathSegmentPattern = /^[A-Za-z0-9_-]+$/;

const cloneJson = (value) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pathSegments = (fieldPath) => String(fieldPath || "").split(".");

export const isSafeAppearanceFieldPath = (fieldPath) => {
  const segments = pathSegments(fieldPath);
  return (
    segments.length > 0 &&
    segments.every(
      (segment) =>
        Boolean(segment) &&
        pathSegmentPattern.test(segment) &&
        !unsafePathSegments.has(segment),
    )
  );
};

export const appearanceValueAtPath = (value, fieldPath) =>
  pathSegments(fieldPath).reduce(
    (current, key) =>
      current && Object.prototype.hasOwnProperty.call(current, key)
        ? current[key]
        : undefined,
    value,
  );

const setAppearanceValueAtPath = (value, fieldPath, nextValue) => {
  if (!isSafeAppearanceFieldPath(fieldPath)) {
    throw new Error(`不安全的 UI 参数路径：${fieldPath || "(empty)"}`);
  }

  const segments = pathSegments(fieldPath);
  let target = value;
  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(target[segment])) target[segment] = {};
    target = target[segment];
  }
  target[segments.at(-1)] = nextValue;
};

const numericMetadataError = (field) => {
  for (const key of ["min", "max", "step"]) {
    if (field[key] != null && (typeof field[key] !== "number" || !Number.isFinite(field[key]))) {
      return `${key} 必须是有限数字`;
    }
  }
  if (field.min != null && field.max != null && field.min > field.max) {
    return "min 不能大于 max";
  }
  if (field.step != null && field.step <= 0) return "step 必须大于 0";
  return "";
};

export const appearanceFieldDefinitionError = (field, options = {}) => {
  if (!isRecord(field)) return "字段定义必须是对象";
  if (!isSafeAppearanceFieldPath(field.path)) return "path 缺失或包含不安全字符";
  if (!String(field.label || "").trim()) return "label 不能为空";
  if (!supportedAppearanceFieldTypes.has(field.type)) {
    return `type \"${field.type || "missing"}\" 不受支持`;
  }
  if (field.required != null && typeof field.required !== "boolean") {
    return "required 必须是 boolean";
  }
  if (field.allowMissing != null && typeof field.allowMissing !== "boolean") {
    return "allowMissing 必须是 boolean";
  }
  if (field.required && field.allowMissing) {
    return "required 与 allowMissing 不能同时启用";
  }
  if (field.maxLength != null) {
    if (!["text", "textarea", "url"].includes(field.type)) {
      return "maxLength 只适用于文本字段";
    }
    if (!Number.isInteger(field.maxLength) || field.maxLength <= 0) {
      return "maxLength 必须是正整数";
    }
  }

  if (["number", "range"].includes(field.type)) {
    const error = numericMetadataError(field);
    if (error) return error;
  }

  if (field.type === "select") {
    if (!Array.isArray(field.options) || !field.options.length) {
      return "select 必须声明至少一个 option";
    }
    const seenValues = new Set();
    for (const option of field.options) {
      if (!isRecord(option) || typeof option.value !== "string") {
        return "select option 的 value 必须是 string";
      }
      if (!String(option.label || "").trim()) return "select option 的 label 不能为空";
      if (seenValues.has(option.value)) return "select option 的 value 不能重复";
      seenValues.add(option.value);
    }
  }

  if (["image", "video"].includes(field.type) && !field.assetLibrary) {
    return `${field.type} 必须声明 assetLibrary`;
  }
  if (["image", "video"].includes(field.type) && field.assetLibrary) {
    const library = options.mediaLibraries?.[field.assetLibrary];
    if (!library) return `assetLibrary \"${field.assetLibrary}\" 不存在`;
    if (library.kind !== field.type) {
      return `assetLibrary \"${field.assetLibrary}\" 不是${field.type === "image" ? "图片" : "视频"}素材库`;
    }
  }

  return "";
};

const isEmptyAppearanceValue = (value) =>
  value == null || (typeof value === "string" && !value.trim());

export const isAllowedAppearanceUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return false;
  if (/^(?:\/|\.\/|\.\.\/|#)/.test(url)) return true;
  return /^(?:https?:\/\/|mailto:|tel:)/i.test(url);
};

export const isMediaLibraryAssetValue = (value, publicRoot) => {
  const assetValue = String(value || "").trim();
  const root = String(publicRoot || "").replace(/\/$/, "");
  if (!assetValue || !root) return false;
  if (assetValue.startsWith(`${root}/`)) return true;
  if (!/^https?:\/\//i.test(assetValue)) return false;
  try {
    return new URL(assetValue).pathname.startsWith(`${root}/`);
  } catch {
    return false;
  }
};

export const appearanceFieldValueError = (field, value, options = {}) => {
  if (field.type === "checkbox") {
    if (typeof value !== "boolean") return "必须保存为 boolean";
    if (field.required && value !== true) return "是必填项";
    return "";
  }

  const empty = isEmptyAppearanceValue(value);
  if (field.required && empty) return "是必填项";
  if (["range", "color"].includes(field.type) && empty) {
    return "必须设置明确默认值，不能留空";
  }
  if (empty) return "";

  if (["number", "range"].includes(field.type)) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "必须保存为有限数字";
    if (field.min != null && value < field.min) return `不能小于 ${field.min}`;
    if (field.max != null && value > field.max) return `不能大于 ${field.max}`;
    return "";
  }

  if (typeof value !== "string") return "必须保存为 string";
  if (field.maxLength != null && value.length > field.maxLength) {
    return `不能超过 ${field.maxLength} 个字符`;
  }

  if (field.type === "select") {
    if (!(field.options || []).some((option) => option.value === value)) {
      return "不是有效选项";
    }
  }
  if (field.type === "color" && !/^#[0-9a-f]{6}$/i.test(value)) {
    return "必须使用 #RRGGBB 颜色格式";
  }
  if (field.type === "url" && !isAllowedAppearanceUrl(value)) {
    return "必须是站内路径、HTTP(S)、mailto 或 tel 地址";
  }
  if (["image", "video"].includes(field.type) && field.assetLibrary) {
    const library = options.mediaLibraries?.[field.assetLibrary];
    if (!library || library.kind !== field.type) {
      return "引用了无效的素材库";
    }
    if (!isMediaLibraryAssetValue(value, library.publicRoot)) {
      return `必须来自 ${library.publicRoot} 素材库`;
    }
  }

  return "";
};

export const normalizeAppearanceInputValue = (field, rawValue) => {
  if (field.type === "checkbox") return Boolean(rawValue);
  const stringValue = String(rawValue ?? "").trim();
  if (["number", "range"].includes(field.type)) {
    return stringValue ? Number(stringValue) : null;
  }
  return stringValue;
};

export const firstAppearanceImageValue = (presetSettings, fields = []) => {
  const imageField = fields.find((field) => {
    if (field.type !== "image") return false;
    const value = appearanceValueAtPath(presetSettings, field.path);
    return typeof value === "string" && Boolean(value.trim());
  });
  return imageField
    ? String(appearanceValueAtPath(presetSettings, imageField.path)).trim()
    : "";
};

const scopeName = (scopeEntry) =>
  Array.isArray(scopeEntry) ? String(scopeEntry[0] || "") : String(scopeEntry || "");

const sharedPathDescriptor = (entry) => {
  if (Array.isArray(entry)) {
    const path = String(entry[0] || "");
    return { path, label: String(entry[1] || path) };
  }
  if (isRecord(entry)) {
    const path = String(entry.path || "");
    return { path, label: String(entry.label || path) };
  }
  const path = String(entry || "");
  return { path, label: path };
};

const jsonValuesEqual = (left, right) => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => jsonValuesEqual(value, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && jsonValuesEqual(left[key], right[key]),
    )
  );
};

const shouldMergeChangedValue = ({ baseValue, remoteValue, localValue, label }) => {
  if (jsonValuesEqual(localValue, baseValue)) return false;
  if (
    !jsonValuesEqual(remoteValue, baseValue) &&
    !jsonValuesEqual(remoteValue, localValue)
  ) {
    throw new Error(
      `线上“${label}”在草稿创建后已经变化，本次没有覆盖它。请取消页面配置草稿、重新连接后再保存。`,
    );
  }
  return true;
};

export const mergeScopedSiteSettings = ({
  remoteSettings,
  localSettings,
  baseSettings = remoteSettings,
  settingsScopes,
  sharedPaths = [],
  appearanceFieldsByPreset = {},
}) => {
  if (
    !isRecord(remoteSettings) ||
    !isRecord(localSettings) ||
    !isRecord(baseSettings)
  ) {
    throw new Error("页面配置必须是对象");
  }

  const localSchemaVersion = Number(localSettings.schemaVersion || 0);
  const remoteSchemaVersion = Number(remoteSettings.schemaVersion || 0);
  if (remoteSchemaVersion > localSchemaVersion) {
    throw new Error("线上页面配置版本高于当前管理页，请刷新页面后重新保存");
  }

  const merged = cloneJson(remoteSettings);
  if (localSchemaVersion > remoteSchemaVersion) {
    merged.schemaVersion = localSchemaVersion;
    if (!isRecord(merged.ui)) merged.ui = cloneJson(localSettings.ui || {});
    if (!isRecord(merged.ui.presets)) merged.ui.presets = {};
    for (const [presetId, presetSettings] of Object.entries(localSettings.ui?.presets || {})) {
      if (!isRecord(merged.ui.presets[presetId])) {
        merged.ui.presets[presetId] = cloneJson(presetSettings);
      }
    }
    if (!merged.ui.activePreset && localSettings.ui?.activePreset) {
      merged.ui.activePreset = localSettings.ui.activePreset;
    }
  }

  const scopes = new Set((settingsScopes || []).map(scopeName).filter(Boolean));
  for (const scope of scopes) {
    if (scope === "shared") {
      for (const entry of sharedPaths.map(sharedPathDescriptor)) {
        const sharedPath = entry.path;
        if (!isSafeAppearanceFieldPath(sharedPath)) {
          throw new Error(`不安全的共享内容路径：${sharedPath || "(empty)"}`);
        }
        if (sharedPath === "ui" || sharedPath.startsWith("ui.")) {
          throw new Error("共享内容范围不能包含 UI 私有配置或上线指针");
        }
        const localValue = appearanceValueAtPath(localSettings, sharedPath);
        const shouldMerge = shouldMergeChangedValue({
          baseValue: appearanceValueAtPath(baseSettings, sharedPath),
          remoteValue: appearanceValueAtPath(remoteSettings, sharedPath),
          localValue,
          label: entry.label,
        });
        if (shouldMerge && localValue !== undefined) {
          setAppearanceValueAtPath(merged, sharedPath, cloneJson(localValue));
        }
      }
      continue;
    }

    if (!scope.startsWith("ui:")) {
      throw new Error(`未知的页面配置保存范围：${scope}`);
    }

    const presetId = scope.slice(3);
    if (!isSafeAppearanceFieldPath(presetId)) {
      throw new Error(`不安全的 UI 参数范围：${presetId || "(empty)"}`);
    }
    if (!Object.prototype.hasOwnProperty.call(appearanceFieldsByPreset, presetId)) {
      throw new Error(`UI ${presetId} 没有已注册的管理参数协议，请刷新页面后重试`);
    }
    const localPresetSettings = localSettings.ui?.presets?.[presetId];
    if (!isRecord(localPresetSettings)) {
      throw new Error(`UI ${presetId} 的本地参数不存在，请撤销草稿后重新保存`);
    }

    if (!isRecord(merged.ui)) merged.ui = {};
    if (!isRecord(merged.ui.presets)) merged.ui.presets = {};
    const remotePresetSettings = merged.ui.presets[presetId];
    const mergedPresetSettings = isRecord(remotePresetSettings)
      ? cloneJson(remotePresetSettings)
      : {};
    const basePresetSettings = isRecord(baseSettings.ui?.presets?.[presetId])
      ? baseSettings.ui.presets[presetId]
      : {};
    const latestRemotePresetSettings = isRecord(remoteSettings.ui?.presets?.[presetId])
      ? remoteSettings.ui.presets[presetId]
      : {};
    const localSettingsVersion = Number(localPresetSettings.settingsVersion || 0);
    const remoteSettingsVersion = Number(latestRemotePresetSettings.settingsVersion || 0);
    if (remoteSettingsVersion > localSettingsVersion) {
      throw new Error(`线上 UI ${presetId} 参数版本较新，请刷新页面后重新保存`);
    }

    const fields = [
      { path: "settingsVersion", label: `UI ${presetId} 配置版本` },
      ...(appearanceFieldsByPreset[presetId] || []),
    ];
    let presetChanged = false;
    for (const field of fields) {
      const localValue = appearanceValueAtPath(localPresetSettings, field.path);
      if (localValue === undefined) {
        if (field.allowMissing) continue;
        throw new Error(`UI ${presetId} 的本地参数缺少 ${field.path}`);
      }
      const shouldMerge = shouldMergeChangedValue({
        baseValue: appearanceValueAtPath(basePresetSettings, field.path),
        remoteValue: appearanceValueAtPath(latestRemotePresetSettings, field.path),
        localValue,
        label: field.label || `UI ${presetId} ${field.path}`,
      });
      if (shouldMerge && localValue !== undefined) {
        setAppearanceValueAtPath(
          mergedPresetSettings,
          field.path,
          cloneJson(localValue),
        );
        presetChanged = true;
      }
    }
    if (isRecord(remotePresetSettings) || presetChanged) {
      merged.ui.presets[presetId] = mergedPresetSettings;
    }
  }

  return merged;
};
