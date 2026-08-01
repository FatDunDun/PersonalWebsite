export const appearanceFields = Object.freeze([
  Object.freeze({
    path: "appearance.homeHero.backgroundImage",
    label: "首页主视觉",
    type: "image",
    required: true,
    assetLibrary: "personalPhotoAssets",
    placeholder: "/personal-photo/...",
    help: "只影响 UI B 的首页主视觉，不会修改其他 UI。",
  }),
  Object.freeze({
    path: "appearance.homeHero.focalPoint",
    label: "主视觉焦点",
    type: "text",
    placeholder: "center 34%",
    help: "使用 CSS background-position 写法，例如 center 34% 或 50% 28%。",
  }),
]);
