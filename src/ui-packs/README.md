# UI Pack contract

UI Pack 只负责页面结构和视觉表达。文章、图集、视频、推荐、项目和站点文案始终读取共享数据源；背景图、焦点、首屏视频、色彩与布局参数等纯外观配置保存在 `siteSettings.ui.presets.<presetId>`，每个 UI 各自拥有一棵私有配置子树。

## 隔离与修改边界

每个 UI Pack 都是一套可以独立演进的完整界面，而不是共享样式上的一组配色。默认修改范围必须遵守：

| 需求 | 允许修改的 UI 目录 |
| --- | --- |
| 优化 A / `classic` | 仅 `src/ui-packs/classic-a/**` |
| 优化 B / `editorial` | 仅 `src/ui-packs/warm-editorial-b/**` |
| 优化未来的新版本 | 仅该版本自己的 `src/ui-packs/<pack>/**` |

除非用户明确要求进行跨版本的基础设施或内容变更，优化某个 UI 时不得：

- 修改、复用或导入另一个 UI Pack 的页面、组件、样式和装饰素材；
- 修改其他 UI Pack，即使两个版本目前有相似结构；
- 修改 `src/content`、共享 `src/data`、用户媒体目录或已有素材；
- 改动 `/`、`/articles/`、`/articles/[slug]/`、`/gallery/`、`/videos/`、`/recommendations/`、`/projects/`、`/about/` 等稳定公开路由；
- 改动 `src/pages/silent-orbit-7429/index.astro` 管理控制台及其同步逻辑；
- 把 UI 特定的 DOM、组件或 CSS 放回共享路由、共享 layout 或全局组件目录。

管理页修改共享标题、简介和栏目内容时会影响全部 UI；修改“UI 专属外观”时只能合并所选 `ui.presets.<presetId>` 子树，不得覆盖其他 UI 的配置。媒体库本身共享，但“某个 UI 选择哪张图作为背景”属于私有外观。

公共路由只通过 `@ui-pack` 构建别名访问活动 UI Pack。Pack 内可以读取 `src/content`、`src/data`、`src/utils` 和 `public` 的共享内容，但 UI 组件之间只能使用本 Pack 内的相对路径。明暗模式和活动 UI Pack 是两个独立概念，不得用同一个状态或存储键。

新增 UI Pack 时，可以在自己的目录之外做注册所必需的最小改动，例如向 `catalog.mjs` 和管理页选项中增加元数据；这不授权顺便调整既有 Pack、共享内容或稳定路由。若用户明确要求修改共享合同，必须同时构建并验证所有已注册 Pack。

## 必需文件

每个注册到 `catalog.mjs` 的 UI Pack 必须包含：

```text
<pack>/
  manifest.ts
  admin.mjs
  Head.astro
  SiteShell.astro
  styles.css
  pages/
    Home.astro
    ArticlesIndex.astro
    ArticleDetail.astro
    Gallery.astro
    Videos.astro
    Recommendations.astro
    Projects.astro
    About.astro
```

`manifest.ts` 至少导出与 catalog 一致且长期稳定的 `manifest.id`、版本代号 `manifest.code`、默认回退名称 `manifest.label`、`contractVersion` 和 `settingsVersion`。A/B/F 等代号不能复用或随意改名：

```ts
export const manifest = {
  id: "f",
  code: "F",
  label: "UI F",
  description: "这一套界面的说明。",
  contractVersion: 1,
  settingsVersion: 1,
} as const;
```

管理员可把自定义名称保存到 `siteSettings.ui.presets.<id>.displayName`。它只是在管理页里使用的可变别名；为空或旧配置缺失时回退到 catalog / manifest 的 `label`。改名不会改变稳定 `id`、A/B/F 版本代号、目录、构建别名、共享内容或 `ui.activePreset`，不同 UI 可以使用相同名称，因为管理页始终同时显示版本代号。名称会先进入该 UI 的页面配置草稿，完成同步后才成为线上名称。

`Head.astro` 负责这个包自己的预加载、字体或其他 `<head>` 资源；共享 `BaseLayout` 不得识别具体 UI ID。包内的 `admin.mjs` 导出 `appearanceFields`，Catalog 只引用它，不在中央管理页重复声明字段。新 UI 可以注册完全不同的字段结构，也可以完全不声明专属参数。

管理页会自动给每个 UI 提供“UI 包名称”字段，再按该包协议动态生成其他控件。目前支持 `text`、`textarea`、`select`、`number`、`range`、`color`、`url`、`checkbox`、`image` 和 `video`。图片与视频字段可以通过 `assetLibrary` 指向相应 R2 素材库；数字保存为 number，开关保存为 boolean。是否必填由该字段自己的 `required` 决定，不存在全局强制的“首页背景图”。因此一个没有任何外观参数的 F 仍然可以改名；一个没有传统 Hero 的 F 也可以这样声明：

构建校验和管理页真实保存都复用 `settings-contract.mjs`：同一套规则负责字段路径、类型、素材库和值校验，也负责同步前的 base / remote / local 三方合并。同步只写入本次明确保存的共享字段或 `ui:<id>` 字段；如果同一个字段在草稿创建后也被线上修改，会停止提交而不是静默覆盖。其他 UI、未来字段和未知配置节点会原样保留。

```js
export const appearanceFields = Object.freeze([
  Object.freeze({
    path: "appearance.landing.heroVideo",
    label: "开场视频",
    type: "video",
    assetLibrary: "personalVideoAssets",
  }),
  Object.freeze({
    path: "appearance.layout.columns",
    label: "内容列数",
    type: "number",
    min: 1,
    max: 6,
    step: 1,
  }),
  Object.freeze({
    path: "appearance.motion.enabled",
    label: "启用动效",
    type: "checkbox",
  }),
]);
```

`SiteShell.astro` 负责该 UI Pack 的样式导入、Header、主内容容器和 Footer，并通过 `<slot />` 接收页面模板。共享的 `BaseLayout.astro` 负责 `<html>`、SEO、主题初始化和 body，不应在 UI Pack 内重复。

八个 `pages/*.astro` 文件是内容片段，不得再包裹 `BaseLayout`。除文章详情外，它们直接读取共享内容源；`ArticleDetail.astro` 必须接收：

```ts
interface Props {
  post: CollectionEntry<"posts">;
}
```

动态文章路径只由 `src/pages/articles/[slug].astro` 生成。

## 新增一个 UI Pack

1. 在 `src/ui-packs/` 下建立新目录，并按上面的树创建完整骨架。
2. 使用共享数据和 URL 工具实现页面；装饰性素材可放在该 pack 自己的目录，用户内容不得复制。
3. 在包内 `admin.mjs` 声明该 UI 自己的管理参数，并在 `catalog.mjs` 注册稳定 ID、展示信息、目录、版本及该字段导出。
4. 在 `siteSettings.ui.presets.<id>` 初始化该包的 `displayName`、`settingsVersion` 私有树，并为 `admin.mjs` 声明的每个字段提供同类型默认值；没有专属外观参数时保留 `displayName` 和 `settingsVersion` 即可。
5. 在管理页选择新 ID，或先用 `UI_PRESET=<id>` 本地预览。
6. 运行 `node tests/ui-pack-isolation.test.mjs`、`npm run check:ui-packs`、该 pack 的构建命令、`npm test` 和 Pages 环境构建。

生产构建通过 `@ui-pack` alias 只载入一个 pack，因此不同 pack 可以拥有完全不同的全局布局和 CSS。管理页的 UI 卡片会单独提交 `siteSettings.ui.activePreset`，不会连带发布其他内容草稿；如果已有页面配置草稿，快速切换会先阻止提交。新 UI 在 GitHub Pages 下一次静态构建完成后生效。
