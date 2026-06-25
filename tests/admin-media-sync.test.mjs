import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const source = readFileSync(new URL("../src/pages/silent-orbit-7429/index.astro", import.meta.url), "utf8");

const requiredSnippets = [
  "pendingMedia",
  "data-sync-media",
  "queueMediaUploads",
  "queueMediaDeletes",
  "syncPendingMedia",
  "createGitBlob",
  "createGitTree",
  "createGitCommit",
  "updateBranchRef",
  "data-image-select",
  "data-video-select",
];

for (const snippet of requiredSnippets) {
  assert.ok(source.includes(snippet), "Expected admin page to include " + snippet);
}

assert.ok(
  source.includes('message: `Sync media assets: ${summary}`'),
  "Expected pending media sync to use one summary commit message",
);

assert.ok(
  !source.includes('$(\"[data-delete-image]\").addEventListener(\"click\", () => run(deleteImage))'),
  "Image asset delete button should queue deletion instead of committing immediately",
);

assert.ok(
  !source.includes('$(\"[data-delete-video]\").addEventListener(\"click\", () => run(deleteVideo))'),
  "Video asset delete button should queue deletion instead of committing immediately",
);

console.log("admin media sync regression checks passed");
