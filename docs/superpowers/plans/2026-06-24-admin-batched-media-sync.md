# Admin Batched Media Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the hidden admin page queue image/video asset uploads and deletions, then sync the whole batch as one Git commit.

**Architecture:** Keep the existing Astro admin page and add a small client-side pending media operation queue for `public/images` and `public/videos`. Use GitHub Git Data APIs to create blobs, one tree, one commit, and update `main` once during sync. Existing content editors keep their immediate save behavior.

**Tech Stack:** Astro, browser JavaScript, GitHub REST API, Node-based static regression test, `npm run build`.

---

### Task 1: Regression test for batched media sync

**Files:**
- Create: `tests/admin-media-sync.test.mjs`
- Modify: `package.json`

- [ ] Add a Node test that asserts the admin source contains a pending media queue, batch sync button bindings, Git Data API helpers, and no direct asset-library delete handlers.
- [ ] Run the test and verify it fails before implementation.

### Task 2: Admin UI and state

**Files:**
- Modify: `src/pages/silent-orbit-7429/index.astro`

- [ ] Add selected checkbox controls to image and video cards.
- [ ] Add pending operation counters and a `同步待处理操作` button to both asset library toolbars.
- [ ] Add pending media state for queued uploads/deletions and helpers to render pending status.

### Task 3: One-commit GitHub sync

**Files:**
- Modify: `src/pages/silent-orbit-7429/index.astro`

- [ ] Add Git Data API helpers: get branch ref, get commit, create blobs, create tree, create commit, update branch ref.
- [ ] Queue asset uploads/deletions without committing immediately.
- [ ] Sync all pending image/video operations in one commit.

### Task 4: Verification and publish

**Files:**
- Modify: `package.json`
- Modify: `src/pages/silent-orbit-7429/index.astro`
- Create: `tests/admin-media-sync.test.mjs`

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Inspect git diff.
- [ ] Commit and push to GitHub main.
