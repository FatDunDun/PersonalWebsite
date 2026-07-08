# PersonalWebsite 公开记忆

这份记忆文件可以安全地保留在公开仓库中。它用于说明项目长期维护原则，但不保存私有路径、隐藏管理入口、真实部署配置或密钥。

## 项目定位

这是一个纯静态 Astro 个人博客，部署目标是 GitHub Pages。项目保留静态博客的简单性，不引入自管服务器。

## 技术栈

```text
Astro + TypeScript + Tailwind CSS + MDX + GitHub Pages
```

## 内容位置

```text
src/content/posts/        文章
src/data/projects.ts      项目
src/data/recommendations.ts 推荐
src/data/gallery.ts       图集数据
src/data/videos.ts        视频数据
src/data/siteSettings.ts  站点和页面配置
public/                   公开静态资源和兜底媒体
```

## 维护规则

1. 修改前检查工作区。
2. 修改项目代码前先同步远端：先执行 `git fetch origin main`，确认分支关系；如远端有新提交，先用 `git pull --rebase origin main` 整合，再开始改代码。不要等到 push 前才拉远端。
3. 修改安全相关逻辑后运行测试和构建。
4. 公开仓库只保存公开信息。
5. 私有维护信息只放在本机忽略文件 `LOCAL_MAINTENANCE.md`。

## 不应提交的信息

- 本机绝对路径
- 隐藏管理入口和完整管理 URL
- GitHub Token
- Cloudflare Worker `ADMIN_TOKEN`
- Waline 密钥
- 数据库连接串
- 真实 `workers/media-api/wrangler.toml`
- `.env` / `.env.local`
- `.DS_Store`

## 发布前检查

```bash
git status -sb
git fetch origin main
git pull --rebase origin main
npm run test
npm run build
git status -sb
```

## 近期安全约束

- 管理页输入的 GitHub Token 和 Media Token 只保存在会话级浏览器存储里，不做长期保存。
- 本地内容写入 API 默认关闭，启用时必须配置本地 token。
- Worker CORS 不默认允许所有来源。
- `public/` 和 `dist/` 中不能出现 `.DS_Store`。
