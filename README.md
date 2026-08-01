# Personal Website

一个从 0 搭建的现代个人网站，技术栈为 Astro + TypeScript + Tailwind CSS，支持 Markdown/MDX 文章、图集瀑布流、视频页、项目页、推荐页、关于页、深色模式、SEO 和 GitHub Pages 自动部署。

## 技术栈

- Astro：静态站点生成与页面路由
- TypeScript：类型约束与数据结构
- Tailwind CSS：样式系统
- MDX：文章内容管理
- Waline：匿名留言、表情和文章反应评论系统
- GitHub Pages：静态网站托管
- Cloudflare R2：图片和视频对象存储
- Cloudflare Worker：隐藏管理页的媒体上传、删除和素材库 API

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
  data/              图集、视频、项目和推荐数据
  layouts/           页面布局
  pages/             路由页面
  styles/            全局样式
public/images/       本地开发兜底素材图片库。线上推荐改用 R2
public/personal-photo/ 本地开发兜底 PersonalPhoto。线上推荐改用 R2
public/videos/       本地开发兜底素材视频库。线上推荐改用 R2
public/personal-video/ 本地开发兜底 PersonalVideo。线上推荐改用 R2
.github/workflows/   GitHub Pages 部署流程
workers/media-api/   Cloudflare Worker：R2 媒体管理 API
```

## 推荐发布架构

这个项目推荐使用：

```text
GitHub Pages：托管静态博客
GitHub 仓库：保存 Astro 代码、文章 MDX 和 data/*.ts 内容数据
Cloudflare R2：保存图片、视频、封面图
Cloudflare CDN：通过自定义域名加速 R2 媒体
Cloudflare Worker：给隐藏管理页提供安全的媒体上传、删除、列表 API
```

隐藏管理页会使用两个 token：

- `GitHub Token`：写文章、图集、推荐、站点设置，并提交到 GitHub main 分支。
- `Media Token`：调用 Cloudflare Worker，把图片和视频上传到 R2 或从 R2 删除。

这样日常发文流程就是：打开隐藏管理页，写文章，上传图片/视频，点击“同步全部改动”。媒体会进入 R2，内容会进入 GitHub，GitHub Pages 会自动重新构建。

## 配置 Cloudflare R2 媒体 API

1. 在 Cloudflare R2 建好 bucket。
2. 给 bucket 绑定公开访问域名，例如：

```text
https://assets.example.com
```

3. 复制 `workers/media-api/wrangler.example.toml` 为 `workers/media-api/wrangler.toml`，把下面几项改成自己的值：

```toml
name = "personalwebsite-media-api"

[vars]
ASSET_BASE_URL = "https://assets.example.com"
ALLOWED_ORIGIN = "https://your-name.github.io"

[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "your-r2-bucket-name"
```

4. 给 Worker 设置 secret：

```bash
wrangler secret put ADMIN_TOKEN
```

5. 部署 Worker 后，你会得到一个 API 地址，例如：

```text
https://personalwebsite-media-api.your-account.workers.dev
```

6. 在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions -> Variables` 新增：

```bash
PUBLIC_ASSET_BASE_URL="https://assets.example.com"
PUBLIC_MEDIA_API_URL="https://personalwebsite-media-api.your-account.workers.dev"
PUBLIC_IMAGE_API_URL="https://personalwebsite-media-api.your-account.workers.dev"
```

`PUBLIC_ASSET_BASE_URL` 用于前台加载图片和视频，`PUBLIC_MEDIA_API_URL` 用于隐藏管理页连接 Worker。`PUBLIC_IMAGE_API_URL` 可单独指定公开图片变体服务；不配置时会自动复用 `PUBLIC_MEDIA_API_URL`。

Worker 的公开 `/image/<R2 key>?w=<宽度>&q=<质量>` 路由会按展示宽度输出自动格式的 WebP/AVIF，并保留 R2 原文件作为唯一源文件。JPG、PNG、WebP、AVIF 会生成边缘缓存变体，SVG、GIF 和视频仍直接读取原资源。

## 如何新增文章

在 `src/content/posts/` 下新增 `.md` 或 `.mdx` 文件，例如：

```md
---
title: "我的新文章"
description: "这是一段用于 SEO 和列表页展示的摘要。"
publishDate: 2026-06-08
cover: "/personal-photo/hero.png"
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

素材图片用于文章正文、文章封面或项目引用。推荐在隐藏管理页的“素材图片库”上传。配置 R2 后，图片会上传到 R2；没有配置 R2 时，仍会写入 `public/images/`。

文章正文插图使用 Markdown 语法：

```md
![图片说明](/images/example.png)
```

在管理页写文章时，可以点击“上传并插入图片”，系统会自动上传到素材库并把图片语法插入到正文光标位置。

## 如何新增素材视频

素材视频用于文章正文或项目引用。推荐上传压缩后的 MP4 或 WebM，单个文件尽量控制在 50MB 以内。

在管理页写文章时，可以点击“上传并插入视频”，系统会自动上传到素材库并把播放器代码插入到正文光标位置。

手动写法如下：

```html
<video class="post-video" controls playsinline preload="metadata" src="/videos/my-vlog.mp4"></video>
```

如果视频较大，建议使用 R2 对象存储，避免 GitHub 仓库和 GitHub Pages 构建产物膨胀。

## 如何新增 PersonalVideo

PersonalVideo 用于日常 vlog、生活片段和前台视频页展示。推荐在隐藏管理页的 “PersonalVideo” 模块上传和维护。

如果手动维护：

1. 通过隐藏管理页上传视频。配置 R2 后，视频会进入 `/personal-video/` 对应的 R2 key；没有配置 R2 时，可以手动放入 `public/personal-video/`。
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

前台图集页只展示 `PersonalPhoto`，也就是 `src/data/gallery.ts` 中 `image` 以 `/personal-photo/` 开头的项目。`/images/` 是文章和推荐使用的素材图片库，删除或新增素材图片不会直接改变前台图集。

如果手动维护：

1. 通过隐藏管理页上传照片。配置 R2 后，照片会进入 `/personal-photo/` 对应的 R2 key；没有配置 R2 时，可以手动放入 `public/personal-photo/`。
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

## 如何新增推荐

推荐页用于整理喜欢的书籍、影视、歌曲、游戏和其他内容。推荐在隐藏管理页的 “推荐” 模块维护，也可以手动编辑 `src/data/recommendations.ts`。

推荐封面建议放在 `public/images/` 素材图片库里。

```ts
{
  title: "推荐名称",
  category: "book",
  creator: "作者 / 导演 / 歌手 / 厂商",
  year: "2026",
  description: "为什么推荐它。",
  image: "/images/recommendation-cover.jpg",
  link: "https://...",
  rating: "9.5",
  tags: ["文学", "私藏"],
}
```

`category` 建议使用 `book`、`film`、`music`、`game` 或 `other`。

## 配置 Waline 评论

文章详情页已经集成 Waline。Waline 支持昵称匿名留言、邮箱、个人链接、表情和文章反应，评论数据存放在你部署的 Waline 服务里。

项目里有两张图解：[docs/waline-guide.svg](docs/waline-guide.svg) 整理了 Waline 的部署步骤、维护入口和静态页面能评论的运行原理；[docs/waline-vercel-neon-map.svg](docs/waline-vercel-neon-map.svg) 解释 Waline、Vercel、Neon 分别是什么，以及它们和博客之间的关系。

先按照 [Waline 官方文档](https://waline.js.org/guide/get-started/) 部署服务。推荐使用 Vercel + 免费数据库方案。部署完成后，你会得到一个 Waline 服务地址，例如：

```bash
https://your-waline.vercel.app
```

线上 GitHub Pages 使用仓库变量。打开 `Settings -> Secrets and variables -> Actions -> Variables`，新增：

```bash
PUBLIC_WALINE_SERVER_URL="https://your-waline.vercel.app"
```

这些值会在 GitHub Actions 构建时注入到 Astro。保存变量后，重新运行一次 Pages workflow 或推送一次提交，文章页底部就会显示 Waline 留言区。

本地可以创建 `.env` 文件保存这些值，`.env` 已加入 `.gitignore`，不会被提交。

## 部署到 GitHub Pages

如果你想练习手动把本地改动推送到 GitHub，可以看这张图：[docs/git-push-guide.svg](docs/git-push-guide.svg)。

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
