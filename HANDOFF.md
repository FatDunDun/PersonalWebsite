# PersonalWebsite 公开交接文档

这份文档可以安全地放在公开仓库里。它只保留协作和项目结构信息，不记录本机绝对路径、隐藏管理入口、真实部署配置或任何密钥。

## 项目概况

- 类型：纯静态 Astro 个人博客。
- 技术栈：Astro、TypeScript、Tailwind CSS、MDX、GitHub Pages。
- 内容：文章、图集、视频、推荐、项目、关于页面。
- 媒体：仓库内保留少量兜底静态资源，线上媒体推荐使用 Cloudflare R2 公共资源 URL。
- 评论：可选 Waline，通过公开构建变量启用。

## 协作规则

1. 修改前先查看工作区：

   ```bash
   git status -sb
   ```

2. 修改项目代码前先同步远端，避免在本地改完后才发现静态管理页已经产生线上内容提交：

   ```bash
   git fetch origin main
   git pull --rebase origin main
   ```

3. 不要提交这些信息：

   - GitHub Token
   - Cloudflare Token 或 Worker `ADMIN_TOKEN`
   - Waline 密钥
   - 数据库连接串
   - 本机绝对路径
   - 私有维护入口或完整管理 URL
   - 真实 `workers/media-api/wrangler.toml`

4. 真实部署配置应放在平台设置或被忽略的本地文件里。当前仓库只跟踪 Worker 源码和示例配置。

5. 这些文件或目录不应进入 Git：

   ```text
   dist/
   .astro/
   node_modules/
   *.log
   .env
   .env.local
   .DS_Store
   LOCAL_MAINTENANCE.md
   workers/media-api/wrangler.toml
   ```

## 常用命令

```bash
npm install
npm run dev
npm run test
npm run build
```

## 公开环境变量

这些值会进入静态站构建产物，必须只放公开配置，不能放密钥：

- `PUBLIC_SITE_URL`
- `PUBLIC_BASE_PATH`
- `PUBLIC_WALINE_SERVER_URL`
- `PUBLIC_ASSET_BASE_URL`
- `PUBLIC_MEDIA_API_URL`

## 目录说明

```text
src/content/posts/        文章 MDX
src/data/                 页面和内容数据
src/pages/                Astro 页面
src/components/           前台组件
public/                   公开静态资源和兜底媒体
workers/media-api/        Cloudflare Worker 媒体管理 API 源码
tests/                    回归测试和安全约束测试
```

## 私有维护信息

需要本机路径、隐藏管理入口、真实 R2 配置等信息时，请看本地未跟踪文件 `LOCAL_MAINTENANCE.md`。这个文件已加入 `.gitignore`，只应该存在于维护者本机。
