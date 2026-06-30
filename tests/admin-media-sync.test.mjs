import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync(new URL("../src/pages/silent-orbit-7429/index.astro", import.meta.url), "utf8");

const requiredSnippets = [
  "pendingMedia",
  "pendingChanges",
  "data-sync-media",
  "data-sync-all",
  "queueMediaUploads",
  "queueMediaDeletes",
  "queueContentChange",
  "queueDeleteChange",
  "syncPendingChanges",
  "beforeunload",
  "syncPendingMedia",
  "createGitBlob",
  "createGitTree",
  "createGitCommit",
  "updateBranchRef",
  "data-image-select",
  "data-video-select",
  "MEDIA_API_URL",
  "mediaApiUpload",
  "mediaApiDelete",
  "mediaStorageMode",
  "loadMediaLibrariesSafely",
  "loadContentFiles",
  "mediaContentValue",
  "mediaUrlFromPublicPath",
  "mergeMediaAssets",
  "prepareEmptyEditors",
  "isPersonalPhotoValue",
  "articleAssets",
  "personalPhotoAssets",
  "personalVideoAssets",
  "data-section=\"images\"",
  "data-section-group=\"articleAssets\"",
  "data-section-group=\"gallery\"",
  "data-section-group=\"personalVideos\"",
  "data-media-grid=\"personalPhotoAssets\"",
  "data-media-grid=\"personalVideoAssets\"",
  "PERSONAL_PHOTO",
  "PERSONAL_VIDEO",
  "PERSONAL_PHOTO_ASSETS",
  "PERSONAL_VIDEO_ASSETS",
  "ARTICLE_ASSETS",
  "PERSONAL_PHOTO_ENTRIES",
  "PERSONAL_VIDEO_ENTRIES",
  "ARTICLE_IMAGE_ASSETS",
  "ARTICLE_VIDEO_ASSETS",
];

for (const snippet of requiredSnippets) {
  assert.ok(source.includes(snippet), "Expected admin page to include " + snippet);
}

const requiredUiSnippets = [
  "orbit-workbench",
  "exhibition-panel",
  "literary-title",
  "exhibition-kicker",
  "quiet-card",
  "orbit-stage",
];

for (const snippet of requiredUiSnippets) {
  assert.ok(source.includes(snippet), "Expected admin page to share homepage UI language via " + snippet);
}

assert.ok(
  source.includes('message: `Sync media assets: ${summary}`'),
  "Expected pending media sync to use one summary commit message",
);

assert.ok(
  source.includes('message: `Sync site updates: ${summary}`'),
  "Expected full admin sync to use one summary commit message",
);

assert.ok(
  source.includes("const gitUploads = uploads.filter((item) => !usesRemoteMedia(item))"),
  "Expected Git sync to exclude R2-backed media uploads",
);

assert.ok(
  source.includes("const gitMediaDeletes = mediaDeletes.filter((item) => !usesRemoteMedia(item))"),
  "Expected Git sync to exclude R2-backed media deletes",
);

assert.ok(
  source.includes("await syncRemoteMediaOperations({ uploads: remoteUploads, deletes: remoteDeletes })"),
  "Expected sync to upload/delete remote media through the Worker before Git content commit",
);

assert.ok(
  source.includes("const describeMediaError = (error) => {") &&
    source.includes("R2 API 无法访问") &&
    !source.includes('throw new Error(error instanceof Error ? error.message : "Failed to fetch")'),
  "Expected R2 network failures to show a clear Media API message instead of raw Failed to fetch",
);

assert.ok(
  source.includes("await refreshAfterMediaSync(") &&
    source.includes("R2 媒体操作已同步，但素材列表刷新失败") &&
    source.includes("全部待处理改动已同步，但素材列表刷新失败"),
  "Expected successful R2 uploads to stay successful even if the post-upload media library refresh fails",
);

assert.ok(
  source.includes("await loadContentFiles();") && source.includes("const mediaStatus = await loadMediaLibrariesSafely();"),
  "Expected GitHub content loading to be separated from optional R2 media library loading",
);

assert.ok(
  source.includes('if (mediaStorageMode() === "r2" && !state.mediaToken)') &&
    source.includes("R2 素材库需要 Media Token，当前只显示仓库内置兜底素材。"),
  "Expected missing Media Token to avoid blanking the admin content workspace",
);

assert.ok(
  source.includes("postFields.cover.value = mediaContentValue(image)") &&
    source.includes("galleryFields.image.value = mediaContentValue(image)") &&
    source.includes("personalVideoFields.video.value = mediaContentValue(video)"),
  "Expected R2 uploads to write absolute media URLs into content fields",
);

assert.ok(
  source.includes('state.personalPhotoAssets = mergeMediaAssets(INITIAL_DATA.personalPhotoAssets, await mediaApiList("/personal-photo"))') &&
    source.includes('state.images = mergeMediaAssets(INITIAL_DATA.images, await mediaApiList("/article-assets"))'),
  "Expected R2 media library reads to keep built-in repository fallback assets visible",
);

assert.ok(
  source.includes("console.warn(\"Initial empty editor setup failed; content loading will continue.\"") &&
    source.includes("prepareEmptyEditors();") &&
    source.includes("run(initialize);"),
  "Expected empty editor setup failures not to block initial content loading",
);

assert.ok(
  source.includes("applyInitialData();\n        try {\n          await loadContentFiles();"),
  "Expected GitHub mode to show built-in content before remote content synchronization",
);

const requiredMediaRoots = [
  'publicRoot: "/article-assets"',
  'publicRoot: "/article-videos"',
  'publicRoot: "/personal-photo"',
  'publicRoot: "/personal-video"',
  'await mediaApiList("/personal-photo")',
  'await mediaApiList("/personal-video")',
];

for (const snippet of requiredMediaRoots) {
  assert.ok(source.includes(snippet), "Expected categorized media library support for " + snippet);
}

const duplicateNavLabels = [
  "<span>PersonalPhoto</span>",
  "<span>PersonalVideo</span>",
  "<span>素材图片库</span>",
  "<span>素材视频库</span>",
  "<span>PersonalPhoto库</span>",
  "<span>PersonalVideo库</span>",
];

for (const snippet of duplicateNavLabels) {
  assert.ok(!source.includes(snippet), "Expected sidebar to avoid duplicated media/content label: " + snippet);
}

const directCommitMessages = [
  "Update post:",
  "Add post:",
  "Delete post:",
  "Update project:",
  "Add project:",
  "Delete project:",
  "Update recommendation:",
  "Add recommendation:",
  "Delete recommendation:",
  "Update personal photo:",
  "Add personal photo:",
  "Delete personal photo:",
  "Update personal video:",
  "Add personal video:",
  "Delete personal video:",
  "Update site settings",
];

for (const message of directCommitMessages) {
  assert.ok(!source.includes(`message: \`${message}`), "Content action should queue instead of directly committing: " + message);
  assert.ok(!source.includes(`message: "${message}"`), "Content action should queue instead of directly committing: " + message);
}

assert.ok(
  !source.includes('$(\"[data-delete-image]\").addEventListener(\"click\", () => run(deleteImage))'),
  "Image asset delete button should queue deletion instead of committing immediately",
);

assert.ok(
  !source.includes('$(\"[data-delete-video]\").addEventListener(\"click\", () => run(deleteVideo))'),
  "Video asset delete button should queue deletion instead of committing immediately",
);

assert.ok(
  source.includes('const setCount = (key, value) => {') && source.includes('if (node) node.textContent = value;'),
  "Admin count updates should not throw when a grouped subsection has no sidebar counter",
);

assert.ok(
  source.includes("newButton.hidden = isMediaLibrarySection(section);"),
  "Media library sections should hide the global new button and use their explicit upload button only",
);

const duplicateMediaNewTriggers = [
  'if (state.section === "images") $("[data-image-file]").click();',
  'if (state.section === "personalPhotoAssets") $("[data-personal-photo-asset-file]").click();',
  'if (state.section === "videos") $("[data-video-file]").click();',
  'if (state.section === "personalVideoAssets") $("[data-personal-video-asset-file]").click();',
];

for (const snippet of duplicateMediaNewTriggers) {
  assert.ok(!source.includes(snippet), "Global new button should not duplicate asset upload controls: " + snippet);
}

const imageLimitBlock = source.match(/image:\s*\{[\s\S]*?\n\s*\},\n\s*video:/)?.[0] || "";
assert.ok(imageLimitBlock, "Expected admin page to define image media rules");
assert.ok(!imageLimitBlock.includes("maxSize"), "Image uploads should not be blocked by file size");
assert.ok(
  source.includes("if (rule.maxSize && file.size > rule.maxSize)"),
  "Media size validation should only run for rules that define maxSize",
);

console.log("admin media sync regression checks passed");
