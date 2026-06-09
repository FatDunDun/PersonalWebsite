export const siteConfig = {
  name: "Micy 的数字花园",
  title: "Micy 的数字花园 | 写作、影像与项目",
  description:
    "一个使用 Astro、TypeScript 和 Tailwind CSS 构建的现代个人网站，记录文章、图集、视频、项目和个人介绍。",
  author: "Micy",
  ogImage: "/images/hero.png",
};

export const anniversaryConfig = {
  label: "When Begin",
  title: "和西伯利亚无敌飞天棒棒猪已经在一起",
  startAt: "2024-01-20T20:00:00+08:00",
};

export const navItems = [
  { href: "/", label: "首页" },
  { href: "/articles/", label: "文章" },
  { href: "/gallery/", label: "图集" },
  { href: "/videos/", label: "视频" },
  { href: "/projects/", label: "项目" },
  { href: "/about/", label: "关于" },
];

export function withBase(path = "/") {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  if (path === "/") return base;
  return `${base}${path.replace(/^\/+/, "")}`;
}

export function absoluteUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const base = new URL(basePath, import.meta.env.SITE);
  return new URL(path.replace(/^\/+/, ""), base).toString();
}
