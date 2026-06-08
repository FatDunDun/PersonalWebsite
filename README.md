# Personal Website

一个从 0 搭建的现代个人网站，技术栈为 Astro + TypeScript + Tailwind CSS，支持 Markdown/MDX 文章、图集瀑布流、项目页、关于页、深色模式、SEO 和 GitHub Pages 自动部署。

## 技术栈

- Astro：静态站点生成与页面路由
- TypeScript：类型约束与数据结构
- Tailwind CSS：样式系统
- MDX：文章内容管理
- giscus：文章评论系统
- GitHub Pages：静态网站托管

## 本地开发

```bash
npm install
npm run dev
```

开发服务器启动后，在浏览器打开终端输出的本地地址，通常是 `http://localhost:4321`。

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`。

## 目录结构

```text
src/
  components/        通用组件
  content/posts/     Markdown/MDX 文章
  data/              图集和项目数据
  layouts/           页面布局
  pages/             路由页面
  styles/            全局样式
public/images/       静态图片资源
.github/workflows/   GitHub Pages 部署流程
```

## 如何新增文章

在 `src/content/posts/` 下新增 `.md` 或 `.mdx` 文件，例如：

```md
---
title: "我的新文章"
description: "这是一段用于 SEO 和列表页展示的摘要。"
publishDate: 2026-06-08
cover: "/images/hero.png"
tags: ["Astro", "写作"]
---

这里开始写正文。
```

文件名会成为文章 URL。例如 `src/content/posts/my-note.mdx` 会生成 `/articles/my-note/`。

如果文章还不想发布，可以加：

```md
draft: true
```

## 如何新增图片

1. 把图片放入 `public/images/`，例如 `public/images/travel-01.jpg`。
2. 打开 `src/data/gallery.ts`。
3. 新增一项：

```ts
{
  title: "图片标题",
  description: "图片说明",
  image: "/images/travel-01.jpg",
  height: "tall",
}
```

`height` 可选值建议使用 `tall`、`wide` 或 `medium`，页面会根据它调整卡片比例。

## 如何新增项目

打开 `src/data/projects.ts`，新增一项：

```ts
{
  name: "项目名称",
  year: "2026",
  description: "项目简介",
  tags: ["Astro", "TypeScript"],
  link: "https://github.com/your-name/your-repo",
}
```

## 配置 giscus 评论

文章详情页已经集成 giscus。你需要先在目标 GitHub 仓库开启 Discussions，并在 [giscus.app](https://giscus.app/) 生成配置，然后在 GitHub Pages 的仓库变量或本地 `.env` 中设置：

```bash
PUBLIC_GISCUS_REPO="owner/repo"
PUBLIC_GISCUS_REPO_ID="..."
PUBLIC_GISCUS_CATEGORY="Announcements"
PUBLIC_GISCUS_CATEGORY_ID="..."
```

本地可以创建 `.env` 文件保存这些值，`.env` 已加入 `.gitignore`，不会被提交。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，并把本项目推送到 `main` 分支。
2. 打开仓库的 `Settings -> Pages`。
3. 在 `Build and deployment` 中选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动运行构建并部署。

默认配置会在 GitHub Actions 中根据仓库名自动设置 Astro 的 `base` 路径，适合部署到 `https://用户名.github.io/仓库名/`。

如果你部署到用户主页仓库，例如 `用户名.github.io`，可在仓库变量中设置：

```bash
PUBLIC_BASE_PATH="/"
PUBLIC_SITE_URL="https://用户名.github.io"
```

如果你使用自定义域名，也建议设置：

```bash
PUBLIC_SITE_URL="https://你的域名"
PUBLIC_BASE_PATH="/"
```

## 常用命令

```bash
npm run dev      # 本地开发
npm run build    # 生产构建
npm run preview  # 本地预览构建产物
```
