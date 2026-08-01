import { siteSettings } from "@/data/siteSettings";

export const siteConfig = siteSettings.site;

export const homeConfig = siteSettings.home;

export function uiPresetConfig(presetId: string) {
  return siteSettings.ui?.presets?.[presetId as keyof typeof siteSettings.ui.presets] || {};
}

export const anniversaryConfig = siteSettings.anniversary;

export const pageConfig = siteSettings.pages;

export const navItems = siteSettings.nav.filter((item) => item.visible !== false);

export function withBase(path = "/") {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  if (path === "/") return base;
  return `${base}${path.replace(/^\/+/, "")}`;
}

export function assetUrl(path = "") {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) {
    const assetBase = import.meta.env.PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
    if (!assetBase) return path;

    try {
      const source = new URL(path);
      if (!source.hostname.endsWith(".r2.dev")) return path;
      return `${assetBase}${source.pathname}${source.search}${source.hash}`;
    } catch {
      return path;
    }
  }
  return withBase(path);
}

interface ImageUrlOptions {
  width?: number;
  quality?: number;
}

const transformableImagePattern = /\.(?:avif|jpe?g|png|webp)$/i;

function imageKey(path: string) {
  try {
    const resolved = new URL(path, "https://assets.invalid");
    return resolved.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

function isR2BackedImage(originalPath: string, resolvedPath: string) {
  if (!/^https?:\/\//.test(originalPath)) return false;

  try {
    const original = new URL(originalPath);
    if (original.hostname.endsWith(".r2.dev")) return true;

    const assetBase = import.meta.env.PUBLIC_ASSET_BASE_URL;
    if (!assetBase) return false;
    const configured = new URL(assetBase);
    const resolved = new URL(resolvedPath);
    return resolved.origin === configured.origin;
  } catch {
    return false;
  }
}

export function imageUrl(path = "", options: ImageUrlOptions = {}) {
  const resolved = assetUrl(path);
  const imageApi = (
    import.meta.env.PUBLIC_IMAGE_API_URL ||
    import.meta.env.PUBLIC_MEDIA_API_URL ||
    ""
  ).replace(/\/$/, "");
  const key = imageKey(resolved);

  if (
    !imageApi ||
    !isR2BackedImage(path, resolved) ||
    !key ||
    !transformableImagePattern.test(key)
  ) return resolved;

  const width = Math.min(2560, Math.max(64, Math.round(options.width || 1280)));
  const quality = Math.min(90, Math.max(45, Math.round(options.quality || 76)));
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${imageApi}/image/${encodedKey}?w=${width}&q=${quality}`;
}

export function imageSrcSet(path = "", widths: number[] = [480, 768, 1280, 1920]) {
  return widths
    .map((width) => `${imageUrl(path, { width })} ${width}w`)
    .join(", ");
}

export function absoluteUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const base = new URL(basePath, import.meta.env.SITE);
  return new URL(path.replace(/^\/+/, ""), base).toString();
}
