import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { promises as fs } from "node:fs";
import path from "node:path";

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
    plugins: [tailwindcss(), localContentApi()],
  },
});
