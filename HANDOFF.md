# PersonalWebsite Handoff

最后更新：2026-06-16

这份文档用于新的 Codex / AI 对话窗口快速接手本项目。新窗口无需回读旧聊天记录，先读本文件即可继续工作。

## 项目概况

- 项目路径：`/Users/micylt/Desktop/PersonalWebsite`
- 远端仓库：`https://github.com/FatDunDun/PersonalWebsite.git`
- GitHub Pages：`https://fatdundun.github.io/PersonalWebsite/`
- 隐藏管理页：`/silent-orbit-7429/`
- 线上管理页：`https://fatdundun.github.io/PersonalWebsite/silent-orbit-7429/`
- 技术栈：Astro + TypeScript + Tailwind CSS + MDX + GitHub Pages
- 评论系统：Waline + Vercel + Neon
- 当前核心定位：文艺 + 技术气质的个人数字花园，包含文章、图集、视频、推荐、项目、关于和隐藏内容管理页。

## 必须遵守的协作规则

1. 修改项目前，先看 `git status -sb`。
2. 准备 push 前，必须先同步远端：

   ```bash
   git pull --rebase origin main
   ```

   如果有本地未提交改动，先 stash：

   ```bash
   git stash push -u -m codex-work
   git pull --rebase origin main
   git stash pop
   ```

3. 原因：用户可能会通过线上管理页直接提交文章、图片、视频或配置。如果本地不先拉最新，push 会覆盖用户在线修改。
4. 提交作者必须使用：

   ```bash
   git -c user.name=FatPig -c user.email=FatDunDun@users.noreply.github.com commit -m "提交信息"
   ```

   不要使用或显示用户真实姓名。

5. 除非用户明确要求，否则不要主动 push。用户说“可以 push / 推 GitHub / 发布”时再推。
6. 不要把 GitHub Token、Waline 密钥、数据库连接串写进项目文件。
7. 后台管理页设计目标是：输入 GitHub Token 后，可以在任意 PC 上直接修改内容并提交到 GitHub main。

## 常用命令

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4321
npm run build
git status -sb
git pull --rebase origin main
git add <files>
git -c user.name=FatPig -c user.email=FatDunDun@users.noreply.github.com commit -m "描述"
git push origin main
```

## 重要环境变量

GitHub Actions / GitHub Pages 构建时会用到：

- `PUBLIC_SITE_URL`
- `PUBLIC_BASE_PATH`
- `PUBLIC_WALINE_SERVER_URL`

`PUBLIC_WALINE_SERVER_URL` 用于 Waline 评论。没有它时文章页会显示评论配置提示，不会加载 Waline。

## 页面路由

- `/`：首页
- `/articles/`：文章列表
- `/articles/[slug]/`：文章详情
- `/gallery/`：PersonalPhoto 图集，只展示 `/personal-photo/` 里的生活照片
- `/videos/`：PersonalVideo 视频记录，只展示 `/personal-video/` 里的日常视频
- `/recommendations/`：推荐页，展示书籍、影视、音乐、游戏等
- `/projects/`：项目页
- `/about/`：关于页
- `/silent-orbit-7429/`：隐藏内容管理页

## 目录地图

```text
src/components/
  Header.astro              顶部导航
  Footer.astro              页脚
  ThemeToggle.astro         深色模式按钮
  CursorField.astro         鼠标跟随数学线条动效
  AnniversaryTimer.astro    纪念日计时
  WalineComments.astro      文章评论区，已做懒加载

src/layouts/
  BaseLayout.astro          全站基础布局、SEO、OG、背景动效

src/pages/
  index.astro               首页
  about.astro               关于页
  articles/index.astro      文章列表页
  articles/[slug].astro     文章详情页
  gallery/index.astro       图集页
  videos/index.astro        视频页
  recommendations/index.astro 推荐页
  projects/index.astro      项目页
  silent-orbit-7429/index.astro 隐藏管理页

src/content/posts/
  *.mdx                     文章内容

src/data/
  siteSettings.ts           站点、首页、导航、纪念日等可配置内容
  projects.ts               项目数据
  recommendations.ts        推荐数据
  gallery.ts                PersonalPhoto 图集数据
  videos.ts                 PersonalVideo 数据

public/images/
  素材图片库：给文章、项目、推荐封面引用，不直接进入前台图集

public/personal-photo/
  PersonalPhoto：前台图集使用的生活照片

public/videos/
  素材视频库：给文章正文或项目引用

public/personal-video/
  PersonalVideo：前台视频页使用的日常视频

docs/
  project-guide.svg
  git-push-guide.svg
  waline-guide.svg
  waline-vercel-neon-map.svg

.github/workflows/deploy.yml
  GitHub Pages 自动部署
```

## 内容管理后台

入口：`/silent-orbit-7429/`

功能模块：

- 文章：增删改查、封面上传、正文插入图片、正文插入视频
- 项目：增删改查
- 推荐：增删改查、封面上传、使用素材图
- PersonalPhoto：生活照片卡片增删改查，图片保存到 `public/personal-photo/`
- PersonalVideo：日常视频卡片增删改查，视频保存到 `public/personal-video/`
- 素材图片库：用于文章、推荐、项目引用，保存到 `public/images/`
- 素材视频库：用于文章或项目引用，保存到 `public/videos/`
- 页面配置：站点标题、描述、作者、首页文案、按钮、导航、纪念日等，写入 `src/data/siteSettings.ts`

后台提交逻辑：

- 用户输入 GitHub Token 后，管理页通过 GitHub Contents API 直接写入 `main` 分支。
- 每次保存会成为一次 Git commit。
- GitHub Actions 随后自动部署 Pages。
- 当前管理页没有真正启用“本地写入模式”。`astro.config.mjs` 里仍有 `localContentApi()` 历史开发辅助中间件，但管理页主逻辑是 `github` / `readonly`。

GitHub Token 要求：

- Fine-grained token
- Repository 选择 `FatDunDun/PersonalWebsite`
- Contents 权限：Read and write
- 不要把 Token 存进代码仓库

## 媒体上传限制

已在 `src/pages/silent-orbit-7429/index.astro` 中实现前端拦截：

- 图片：`JPG / PNG / WebP / AVIF`，最大 `8MB`
- 视频：`MP4 / WebM / MOV`，最大 `50MB`

目的：

- 避免 Git 仓库快速膨胀
- 避免 GitHub Pages 线上加载过慢
- 避免浏览器不支持的格式进入内容数据

如果用户未来要上传更大的 vlog，建议不要继续放 Git 仓库，改用对象存储或视频平台链接。

## 评论系统

当前使用 Waline。

相关文件：

- `src/components/WalineComments.astro`
- `src/pages/articles/[slug].astro`

实现要点：

- `PUBLIC_WALINE_SERVER_URL` 存在时启用 Waline。
- 评论区已做懒加载：滚动到评论区附近或点击“加载留言”才加载 Waline CSS 和 JS。
- Waline 服务部署在 Vercel。
- 评论数据保存在 Neon 数据库。
- 博客本身仍是静态站，互动能力来自外部 Waline 服务。

不要恢复 giscus / Cusdis。此前已经评估过：

- giscus 依赖 GitHub 登录，不适合匿名/多身份评论需求。
- Cusdis 默认需要审核，功能太轻，表情等体验不够。

## 前台展示逻辑

素材库和前台展示是分开的：

- `public/images/` 只是素材图片库，不直接展示到 `/gallery/`。
- `/gallery/` 只展示 `src/data/gallery.ts` 中 `image` 以 `/personal-photo/` 开头的项目。
- `public/videos/` 是素材视频库，不直接展示到 `/videos/`。
- `/videos/` 展示 `src/data/videos.ts` 中的 PersonalVideo。

推荐页：

- 数据来自 `src/data/recommendations.ts`
- 分类包括 `book`、`film`、`music`、`game`、`other`
- 外链已设置 `target="_blank"` 和 `rel="noopener noreferrer"`

项目页：

- 数据来自 `src/data/projects.ts`
- 外链已设置新标签打开

首页：

- 主要文案来自 `src/data/siteSettings.ts`
- 展示最近文章、PersonalPhoto、项目、推荐和纪念日计时

## 样式与设计方向

当前视觉方向：

- 文艺 + 技术
- 类“手稿 / 档案 / 数字花园”
- 背景有网格和轻量数学线条动效
- 避免默认模板感
- 图片保持原色，不再默认黑白滤镜

主要样式文件：

- `src/styles/global.css`
- `src/layouts/BaseLayout.astro`
- 各页面 Astro 文件里的 Tailwind class

如果要整体改风格，优先从：

1. `src/styles/global.css`
2. `src/layouts/BaseLayout.astro`
3. `src/pages/index.astro`
4. 各子页面对应 `src/pages/*`

## GitHub Pages 部署

工作流文件：`.github/workflows/deploy.yml`

部署逻辑：

- push 到 `main`
- GitHub Actions 安装依赖
- 构建 Astro 静态站
- 发布到 GitHub Pages

Astro base/path 逻辑在 `astro.config.mjs`：

- GitHub Actions 中根据仓库名自动设置 base 为 `/PersonalWebsite`
- 本地 dev 通常是 `/`
- 页面链接要用 `withBase()`，不要手写 GitHub Pages base

相关工具：

- `src/utils/site.ts` 提供 `withBase()`、`absoluteUrl()`、站点配置导出

## 最近关键提交

```text
c0e95c6 FatPig Optimize media uploads and comments
36bff44 FatPig 优化全站管理页配置
4c3aadd FatPig Unify editorial art direction across pages
```

`c0e95c6` 做了：

- Waline 评论区懒加载
- 项目页、推荐页、首页项目外链新标签打开
- 管理页上传图片/视频格式和体积限制

## 已知注意点

- `.DS_Store`、`dist/`、`.astro/`、`node_modules/` 都不应提交。`.gitignore` 已配置。
- 本地可能有生成产物或系统文件，提交前务必看 `git status -sb` 和 `git diff --stat`。
- `memory.md` 是早期记忆文件，有些“最新提交”信息可能过期；以后优先读本 `HANDOFF.md`。
- 如果改了隐藏管理页里的数据文件路径或新增内容类型，要同步检查管理页 GitHub API 读写逻辑。
- 如果改了站点路由，要检查 `siteSettings.nav`、Header/Footer、README 和管理页配置项是否需要同步。
- 如果改了评论系统，要考虑静态站的交互能力来自外部服务，不要把服务端逻辑写进 GitHub Pages。

## 新窗口接手建议流程

```bash
cd /Users/micylt/Desktop/PersonalWebsite
sed -n '1,260p' HANDOFF.md
git status -sb
git pull --rebase origin main
npm install
npm run build
```

如果用户要求改代码：

1. 先确认任务是否会影响管理页和前台页两边。
2. 如果新增内容类型，前台页面和隐藏管理页通常都要同步适配。
3. 改完跑 `npm run build`。
4. 用户明确要求 push 时，先同步远端，再提交并推送。

