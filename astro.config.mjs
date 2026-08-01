import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uiPresetCatalog } from "./src/ui-packs/catalog.mjs";
import {
  SITE_SETTINGS_SCHEMA_VERSION,
  UI_PRESET_DISPLAY_NAME_FIELD,
  appearanceFieldDefinitionError,
  appearanceFieldValueError,
  appearanceValueAtPath,
} from "./src/ui-packs/settings-contract.mjs";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const siteSettingsSource = await fs.readFile(
  new URL("./src/data/siteSettings.ts", import.meta.url),
  "utf8",
);
const siteSettingsMatch = siteSettingsSource.match(
  /export\s+const\s+siteSettings(?:\s*:[^=]+)?\s*=\s*([\s\S]*?)\s*;\s*$/,
);

if (!siteSettingsMatch) {
  throw new Error("Unable to parse the JSON siteSettings export.");
}

let siteSettings;
try {
  siteSettings = JSON.parse(siteSettingsMatch[1]);
} catch (error) {
  throw new Error(
    `siteSettings must remain a pure JSON object: ${error instanceof Error ? error.message : "invalid JSON"}`,
  );
}

const configuredUiPreset = siteSettings.ui?.activePreset || "editorial";
const activeUiPreset = process.env.UI_PRESET?.trim() || configuredUiPreset;
const allowedUiPresets = uiPresetCatalog.map((preset) => preset.id);
const activeUiPack = uiPresetCatalog.find((preset) => preset.id === activeUiPreset);
const appearanceMediaLibraries = Object.freeze({
  images: Object.freeze({ kind: "image", publicRoot: "/article-assets" }),
  personalPhotoAssets: Object.freeze({ kind: "image", publicRoot: "/personal-photo" }),
  videos: Object.freeze({ kind: "video", publicRoot: "/article-videos" }),
  personalVideoAssets: Object.freeze({ kind: "video", publicRoot: "/personal-video" }),
});

if (siteSettings.schemaVersion !== SITE_SETTINGS_SCHEMA_VERSION) {
  throw new Error(
    `siteSettings.schemaVersion must be ${SITE_SETTINGS_SCHEMA_VERSION}; found ${siteSettings.schemaVersion ?? "missing"}.`,
  );
}

if (!activeUiPack) {
  throw new Error(
    `Unknown UI preset "${activeUiPreset}". Expected one of: ${allowedUiPresets.join(", ")}.`,
  );
}

const requiredUiPackFiles = [
  "manifest.ts",
  "admin.mjs",
  "Head.astro",
  "SiteShell.astro",
  "styles.css",
  "pages/Home.astro",
  "pages/ArticlesIndex.astro",
  "pages/ArticleDetail.astro",
  "pages/Gallery.astro",
  "pages/Videos.astro",
  "pages/Recommendations.astro",
  "pages/Projects.astro",
  "pages/About.astro",
];

for (const preset of uiPresetCatalog) {
  const presetDirectory = path.resolve(projectRoot, preset.directory);
  const missingFiles = [];

  for (const relativePath of requiredUiPackFiles) {
    try {
      await fs.access(path.join(presetDirectory, relativePath));
    } catch {
      missingFiles.push(relativePath);
    }
  }

  if (missingFiles.length) {
    throw new Error(
      `UI preset "${preset.id}" is incomplete. Missing: ${missingFiles.join(", ")}.`,
    );
  }

  const manifestSource = await fs.readFile(
    path.join(presetDirectory, "manifest.ts"),
    "utf8",
  );
  const manifestId = manifestSource.match(/\bid\s*:\s*["']([^"']+)["']/)?.[1];
  const manifestCode = manifestSource.match(/\bcode\s*:\s*["']([^"']+)["']/)?.[1];
  const manifestLabel = manifestSource.match(/\blabel\s*:\s*["']([^"']+)["']/)?.[1];
  const contractVersion = Number(
    manifestSource.match(/\bcontractVersion\s*:\s*(\d+)/)?.[1],
  );
  const settingsVersion = Number(
    manifestSource.match(/\bsettingsVersion\s*:\s*(\d+)/)?.[1],
  );

  if (manifestId !== preset.id) {
    throw new Error(
      `UI preset "${preset.id}" must export the same manifest.id; found "${manifestId || "missing"}".`,
    );
  }
  if (manifestCode !== preset.code) {
    throw new Error(
      `UI preset "${preset.id}" must export manifest.code "${preset.code}"; found "${manifestCode || "missing"}".`,
    );
  }
  if (manifestLabel !== preset.label) {
    throw new Error(
      `UI preset "${preset.id}" must export manifest.label "${preset.label}"; found "${manifestLabel || "missing"}".`,
    );
  }
  if (contractVersion !== preset.contractVersion) {
    throw new Error(
      `UI preset "${preset.id}" must use contractVersion ${preset.contractVersion}.`,
    );
  }
  if (settingsVersion !== preset.settingsVersion) {
    throw new Error(
      `UI preset "${preset.id}" must use settingsVersion ${preset.settingsVersion}.`,
    );
  }

  const presetSettings = siteSettings.ui?.presets?.[preset.id];
  if (!presetSettings || typeof presetSettings !== "object") {
    throw new Error(`UI preset "${preset.id}" is missing its private settings tree.`);
  }
  if (presetSettings.settingsVersion !== preset.settingsVersion) {
    throw new Error(
      `UI preset "${preset.id}" private settings must use settingsVersion ${preset.settingsVersion}.`,
    );
  }

  const editableFields = [
    UI_PRESET_DISPLAY_NAME_FIELD,
    ...(preset.appearanceFields || []),
  ];
  const editablePaths = new Set();
  for (const field of editableFields) {
    const definitionError = appearanceFieldDefinitionError(field, {
      mediaLibraries: appearanceMediaLibraries,
    });
    if (definitionError) {
      throw new Error(
        `UI preset "${preset.id}" field "${field?.path || "missing"}" is invalid: ${definitionError}.`,
      );
    }
    if (editablePaths.has(field.path)) {
      throw new Error(`UI preset "${preset.id}" has a duplicate editable field path "${field.path}".`);
    }
    editablePaths.add(field.path);
    const fieldValue = appearanceValueAtPath(presetSettings, field.path);
    if (fieldValue === undefined) {
      if (field.allowMissing) continue;
      throw new Error(
        `UI preset "${preset.id}" private settings are missing editable field "${field.path}".`,
      );
    }
    const valueError = appearanceFieldValueError(field, fieldValue, {
      mediaLibraries: appearanceMediaLibraries,
    });
    if (valueError) {
      throw new Error(
        `UI preset "${preset.id}" field "${field.path}" has an invalid value: ${valueError}.`,
      );
    }
  }
}

const activeUiPackDirectory = path.resolve(projectRoot, activeUiPack.directory);

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;

const site =
  process.env.PUBLIC_SITE_URL ||
  (owner ? `https://${owner}.github.io` : "https://example.com");

const base =
  process.env.PUBLIC_BASE_PATH ||
  (process.env.GITHUB_ACTIONS && repository ? `/${repository}` : "/");

function localContentApi() {
  const root = process.cwd();
  const enabled = process.env.LOCAL_CONTENT_API_ENABLED === "1";
  const apiToken = process.env.LOCAL_CONTENT_API_TOKEN || "";
  const maxBodyBytes = 10 * 1024 * 1024;
  const allowedRoots = [
    "src/content/posts",
    "src/data/projects.ts",
    "src/data/recommendations.ts",
    "src/data/gallery.ts",
    "src/data/videos.ts",
    "src/data/siteSettings.ts",
    "public/article-assets",
    "public/article-videos",
    "public/recommendation-assets",
    "public/site-assets",
    "public/personal-photo",
    "public/personal-video",
  ];

  const send = (res, status, data) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
  };

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let body = "";
      let bytes = 0;
      req.on("data", (chunk) => {
        bytes += Buffer.byteLength(chunk);
        if (bytes > maxBodyBytes) {
          reject(new Error("Payload is too large"));
          req.destroy();
          return;
        }
        body += chunk;
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(error);
        }
      });
      req.on("error", reject);
    });

  const safePath = (relativePath) => {
    const cleanPath = String(relativePath || "").replace(/^\/+/, "");
    const absolutePath = path.resolve(root, cleanPath);
    const insideProject = absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`);
    const allowed = allowedRoots.some((allowedRoot) => {
      const allowedPath = path.resolve(root, allowedRoot);
      return absolutePath === allowedPath || absolutePath.startsWith(`${allowedPath}${path.sep}`);
    });
    if (!insideProject || !allowed) throw new Error("Path is not allowed");
    return { absolutePath, cleanPath };
  };

  const filePayload = async (cleanPath, absolutePath) => {
    const stat = await fs.stat(absolutePath);
    const name = path.basename(cleanPath);
    const sha = `local-${stat.mtimeMs}`;
    if (stat.isDirectory()) {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        path: `${cleanPath}/${entry.name}`,
        type: entry.isDirectory() ? "dir" : "file",
        sha,
      }));
    }

    return {
      name,
      path: cleanPath,
      type: "file",
      sha,
      content: (await fs.readFile(absolutePath)).toString("base64"),
    };
  };

  return {
    name: "local-content-api",
    configureServer(server) {
      if (!enabled) return;
      if (!apiToken) throw new Error("LOCAL_CONTENT_API_TOKEN is required when LOCAL_CONTENT_API_ENABLED=1");

      const requestAllowed = (req) => {
        const origin = req.headers.origin;
        const hostOrigin = req.headers.host ? `http://${req.headers.host}` : "";
        if (origin && origin !== hostOrigin) return false;

        const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
        const token = String(req.headers["x-local-content-token"] || auth || "");
        return token === apiToken;
      };

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__silent_orbit_local")) {
          next();
          return;
        }

        try {
          if (!requestAllowed(req)) {
            send(res, 403, { message: "Forbidden" });
            return;
          }

          const url = new URL(req.url, "http://localhost");
          if (req.method === "GET" && url.pathname === "/__silent_orbit_local/status") {
            send(res, 200, { ok: true, mode: "local" });
            return;
          }

          if (req.method === "GET" && url.pathname === "/__silent_orbit_local/contents") {
            const { absolutePath, cleanPath } = safePath(url.searchParams.get("path"));
            send(res, 200, await filePayload(cleanPath, absolutePath));
            return;
          }

          if (req.method === "POST" && url.pathname === "/__silent_orbit_local/write") {
            const body = await readBody(req);
            const { absolutePath, cleanPath } = safePath(body.path);
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.writeFile(absolutePath, Buffer.from(body.content, "base64"));
            const stat = await fs.stat(absolutePath);
            server.watcher.add(absolutePath);
            send(res, 200, { content: { path: cleanPath, sha: `local-${stat.mtimeMs}` } });
            return;
          }

          if (req.method === "POST" && url.pathname === "/__silent_orbit_local/delete") {
            const body = await readBody(req);
            const { absolutePath, cleanPath } = safePath(body.path);
            await fs.unlink(absolutePath);
            send(res, 200, { ok: true, path: cleanPath });
            return;
          }

          send(res, 404, { message: "Not found" });
        } catch (error) {
          send(res, 400, { message: error.message || "Local content API error" });
        }
      });
    },
  };
}

export default defineConfig({
  site,
  base,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/silent-orbit-7429/"),
    }),
  ],
  vite: {
    define: {
      "import.meta.env.PUBLIC_UI_PRESET": JSON.stringify(activeUiPreset),
    },
    plugins: [tailwindcss(), localContentApi()],
    resolve: {
      alias: {
        "@ui-pack": activeUiPackDirectory,
      },
    },
  },
});
