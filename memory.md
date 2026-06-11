# PersonalWebsite Memory

这个文件用于在上下文丢失或压缩后快速恢复项目状态。后续如果忘记项目背景，先读这个文件。

## 项目位置

```text
/Users/micylt/Desktop/PersonalWebsite
```

## 远端仓库

```text
https://github.com/FatDunDun/PersonalWebsite.git
```

GitHub Pages:

```text
https://fatdundun.github.io/PersonalWebsite/
```

隐藏管理页:

```text
/silent-orbit-7429/
```

线上管理页完整地址:

```text
https://fatdundun.github.io/PersonalWebsite/silent-orbit-7429/
```

## 技术栈

```text
Astro + TypeScript + Tailwind CSS + Markdown/MDX + GitHub Pages
```

评论系统:

```text
Waline + Vercel + Neon
```

## Git 规则

每次本地修改并准备 push 前，必须先同步远端，避免覆盖管理页在线改动：

```bash
git pull --rebase origin main
```

推荐完整流程：

```bash
git status -sb
git pull --rebase origin main
npm run build
git add .
git commit -m "描述这次改动"
git push origin main
```

Git 作者信息保持：

```bash
git config user.name FatPig
git config user.email FatDunDun@users.noreply.github.com
```

最新已知提交：

```text
0ee7b7b Add recommendations page and git guide
```

## 重要页面

```text
/                       首页
/articles/              文章列表
/articles/[slug]/       文章详情
/gallery/               PersonalPhoto 图集
/videos/                PersonalVideo 视频
/recommendations/       推荐页
/projects/              项目页
/about/                 关于页
/silent-orbit-7429/     隐藏内容管理页
```

## 内容数据位置

文章：

```text
src/content/posts/*.mdx
```

项目：

```text
src/data/projects.ts
```

推荐：

```text
src/data/recommendations.ts
```

PersonalPhoto：

```text
src/data/gallery.ts
public/personal-photo/
```

PersonalVideo：

```text
src/data/videos.ts
public/personal-video/
```

素材图片库：

```text
public/images/
```

素材视频库：

```text
public/videos/
```

## 最近新增/已完成

- 推荐页 `/recommendations/`
- 管理页新增“推荐”模块，支持新增、修改、删除、上传封面、使用素材图片库选中图
- 推荐数据文件 `src/data/recommendations.ts`
- Git 推送流程图 `docs/git-push-guide.svg`
- Waline 部署维护图 `docs/waline-guide.svg`
- Waline / Vercel / Neon 关系图 `docs/waline-vercel-neon-map.svg`
- 项目地图 `docs/project-guide.svg` 已同步推荐页说明
- 清理了旧 giscus / Cusdis 残留
- 清理了 `.DS_Store`、`.playwright-cli/`、`.astro/`、`dist/` 等本地垃圾/可再生成产物

## 注意事项

- `public/images/` 是素材库，不直接等于前台图集。
- 前台图集只展示 `src/data/gallery.ts` 中 `/personal-photo/` 路径的 PersonalPhoto。
- 推荐封面建议放到 `public/images/`。
- 本地管理页写入白名单在 `astro.config.mjs`，新增数据文件时要同步加入。
- 不要随意删除 `node_modules/`，这是本地依赖目录。
- 不要把 GitHub Token 写进项目文件。

