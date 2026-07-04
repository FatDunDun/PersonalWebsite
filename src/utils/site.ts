import { siteSettings } from "@/data/siteSettings";

export const siteConfig = siteSettings.site;

export const homeConfig = siteSettings.home;

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
  if (/^https?:\/\//.test(path)) return path;
  return withBase(path);
}

export function absoluteUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const base = new URL(basePath, import.meta.env.SITE);
  return new URL(path.replace(/^\/+/, ""), base).toString();
}
