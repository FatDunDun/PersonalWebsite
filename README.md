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
public/images/       素材图片库：文章正文、封面、项目引用图片
public/personal-photo/ PersonalPhoto：生活照、风景照、前台图集照片
public/videos/       素材视频库：文章正文、项目引用视频
public/personal-video/ PersonalVideo：日常 vlog、生活视频记录
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

## 如何新增素材图片

素材图片用于文章正文、文章封面或项目引用。推荐在隐藏管理页的“素材图片库”上传，也可以手动放入 `public/images/`。

文章正文插图使用 Markdown 语法：

```md
![图片说明](/images/example.png)
```

在管理页写文章时，可以点击“上传并插入图片”，系统会自动上传到 `public/images/` 并把图片语法插入到正文光标位置。

## 如何新增素材视频

素材视频用于文章正文或项目引用。推荐上传压缩后的 MP4 或 WebM，单个文件尽量控制在 50MB 以内。

在管理页写文章时，可以点击“上传并插入视频”，系统会自动上传到 `public/videos/` 并把播放器代码插入到正文光标位置。

手动写法如下：

```html
<video class="post-video" controls playsinline preload="metadata" src="/videos/my-vlog.mp4"></video>
```

如果视频较大，建议上传到 Bilibili、YouTube 或对象存储，再在文章里嵌入外链播放器，避免 GitHub Pages 加载太慢。

## 如何新增 PersonalVideo

PersonalVideo 用于日常 vlog、生活片段和前台视频页展示。推荐在隐藏管理页的 “PersonalVideo” 模块上传和维护。

如果手动维护：

1. 把视频放入 `public/personal-video/`，例如 `public/personal-video/weekend-vlog.mp4`。
2. 打开 `src/data/videos.ts`。
3. 新增一项：

```ts
{
  title: "视频标题",
  description: "视频说明",
  video: "/personal-video/weekend-vlog.mp4",
  poster: "/images/video-cover.jpg",
  date: "2026-06-09",
}
```

`poster` 是可选封面图，建议放在 `public/images/` 素材图片库里。

## 如何新增 PersonalPhoto

PersonalPhoto 用于生活照、风景照和前台图集页展示。推荐在隐藏管理页的 “PersonalPhoto” 模块上传和维护。

前台图集页只展示 `PersonalPhoto`，也就是 `src/data/gallery.ts` 中 `image` 以 `/personal-photo/` 开头的项目。`public/images/` 是素材图片库，删除或新增素材图片不会直接改变前台图集。

如果手动维护：

1. 把照片放入 `public/personal-photo/`，例如 `public/personal-photo/travel-01.jpg`。
2. 打开 `src/data/gallery.ts`。
3. 新增一项：

```ts
{
  title: "照片标题",
  description: "照片说明",
  image: "/personal-photo/travel-01.jpg",
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

文章详情页已经集成 giscus。你需要先在目标 GitHub 仓库开启 Discussions，并在 [giscus.app](https://giscus.app/) 生成配置。

线上 GitHub Pages 使用仓库变量。打开 `Settings -> Secrets and variables -> Actions -> Variables`，新增：

```bash
PUBLIC_GISCUS_REPO="owner/repo"
PUBLIC_GISCUS_REPO_ID="..."
PUBLIC_GISCUS_CATEGORY="Announcements"
PUBLIC_GISCUS_CATEGORY_ID="..."
```

这些值会在 GitHub Actions 构建时注入到 Astro。保存变量后，重新运行一次 Pages workflow 或推送一次提交，文章页底部就会显示评论区。

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
