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

const imageLimitBlock = source.match(/image:\s*\{[\s\S]*?\n\s*\},\n\s*video:/)?.[0] || "";
assert.ok(imageLimitBlock, "Expected admin page to define image media rules");
assert.ok(!imageLimitBlock.includes("maxSize"), "Image uploads should not be blocked by file size");
assert.ok(
  source.includes("if (rule.maxSize && file.size > rule.maxSize)"),
  "Media size validation should only run for rules that define maxSize",
);

console.log("admin media sync regression checks passed");
