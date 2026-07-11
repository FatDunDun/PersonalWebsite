import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const settingsSource = read("src/data/siteSettings.ts");
const adminSource = read("src/pages/silent-orbit-7429/index.astro");

assert.ok(settingsSource.includes('"pages": {'), "Expected site settings to define page-level copy");

const pageKeys = ["articles", "gallery", "videos", "recommendations", "about"];
const pageFiles = {
  articles: "src/pages/articles/index.astro",
  gallery: "src/pages/gallery/index.astro",
  videos: "src/pages/videos/index.astro",
  recommendations: "src/pages/recommendations/index.astro",
  about: "src/pages/about.astro",
};
const oldInlineCopy = {
  articles: ["Journal / field notes", "面向长期维护的 Markdown/MDX 文章索引。"],
  gallery: ["Frames / captured light", "以网格方式保存图片样本。"],
  videos: ["PersonalVideo / moving frames", "用短视频保存日常、旅行和 vlog 片段。"],
  recommendations: ["Taste / private index", "把长期喜欢、反复回看或想郑重推荐的书籍、影视、歌曲和游戏放在这里。"],
  about: ["Profile / archive owner", "写作、影像、前端工程和小型工具爱好者。"],
};

for (const key of pageKeys) {
  assert.ok(settingsSource.includes(`"${key}": {`), `Expected site settings to include ${key} page copy`);
  assert.ok(adminSource.includes(`data-settings-field="pages.${key}.kicker"`), `Expected admin to edit ${key} kicker`);
  assert.ok(adminSource.includes(`data-settings-field="pages.${key}.title"`), `Expected admin to edit ${key} title`);
  assert.ok(adminSource.includes(`data-settings-field="pages.${key}.description"`), `Expected admin to edit ${key} description`);

  const pageSource = read(pageFiles[key]);
  assert.ok(pageSource.includes("pageCopy"), `Expected ${pageFiles[key]} to read copy from site settings`);
  for (const text of oldInlineCopy[key]) {
    assert.ok(!pageSource.includes(text), `Expected ${pageFiles[key]} not to hard-code old page copy: ${text}`);
  }
}

assert.ok(adminSource.includes('data-section="pageCopy"'), "Expected admin sidebar to include a page copy editor section");
assert.ok(adminSource.includes('data-view="pageCopy"'), "Expected admin to render a page copy editor view");
assert.ok(adminSource.includes("栏目文案"), "Expected admin copy to name the page copy editor in Chinese");

const aboutResumeFields = [
  "pages.about.image",
  "pages.about.imageAlt",
  "pages.about.role",
  "pages.about.company",
  "pages.about.email",
  "pages.about.location",
  "aboutSummaryText",
  "aboutFocusText",
  "aboutLinksText",
];

for (const field of aboutResumeFields) {
  assert.ok(adminSource.includes(`data-settings-field="${field}"`), `Expected admin to edit about resume field ${field}`);
}

const aboutPageSource = read("src/pages/about.astro");
for (const snippet of ["pageCopy.company", "pageCopy.email", "pageCopy.summary", "pageCopy.focus", "pageCopy.links"]) {
  assert.ok(aboutPageSource.includes(snippet), `Expected about page to render editable resume data via ${snippet}`);
}
for (const staleCopy of ["关于这个网站", "这是一个从零搭建的个人网站模板", "你可以把这里替换为邮箱"]) {
  assert.ok(!aboutPageSource.includes(staleCopy), `Expected about page to avoid old hard-coded template copy: ${staleCopy}`);
}
for (const snippet of ["about-content-card", "profile-index", "profile-index__header", "profile-index__grid", "profile-index__item"]) {
  assert.ok(aboutPageSource.includes(snippet), `Expected redesigned about page to include ${snippet}`);
}
assert.ok(
  !aboutPageSource.includes('mt-6 grid gap-3 sm:grid-cols-2'),
  "Expected about page to avoid the old four-card facts grid",
);

assert.ok(
  adminSource.includes('newButton.hidden = isMediaLibrarySection(section) || section === "drafts" || section === "pageCopy";'),
  "Expected page copy section to avoid showing the global new button",
);
assert.ok(
  adminSource.includes('setCount("pageCopy", "编辑");'),
  "Expected admin sidebar counts to support page copy",
);

console.log("page copy settings checks passed");
