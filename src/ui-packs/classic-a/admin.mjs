export const appearanceFields = Object.freeze([
  Object.freeze({
    path: "appearance.homeHero.backgroundImage",
    label: "首页背景图",
    type: "image",
    required: true,
    assetLibrary: "personalPhotoAssets",
    placeholder: "/personal-photo/...",
    help: "只影响 UI A 的全景背景，不会修改其他 UI。",
  }),
  Object.freeze({
    path: "appearance.homeHero.focalPoint",
    label: "背景焦点",
    type: "text",
    placeholder: "center center",
    help: "使用 CSS background-position 写法，例如 center 38% 或 50% 30%。",
  }),
]);
