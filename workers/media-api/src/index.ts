interface Env {
  ASSETS_BUCKET: R2Bucket;
  ADMIN_TOKEN: string;
  ASSET_BASE_URL: string;
  ALLOWED_ORIGIN?: string;
}

const MEDIA_ROOTS = ["article-assets", "article-videos", "images", "personal-photo", "personal-video", "videos"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "svg", "gif"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];

const contentTypes: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  mp4: "video/mp4",
  png: "image/png",
  svg: "image/svg+xml",
  webm: "video/webm",
  webp: "image/webp",
};

function configuredOrigin(env: Env) {
  return (env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
}

function requestOrigin(request: Request) {
  return (request.headers.get("Origin") || "").replace(/\/$/, "");
}

function originAllowed(request: Request, env: Env) {
  const allowed = configuredOrigin(env);
  const origin = requestOrigin(request);
  if (!allowed) return false;
  return !origin || origin === allowed;
}

function corsHeaders(env: Env, request?: Request) {
  const allowed = configuredOrigin(env);
  const origin = request ? requestOrigin(request) : "";
  const allowOrigin = origin && origin === allowed ? origin : allowed;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(env: Env, request: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(env, request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function unauthorized(env: Env, request: Request) {
  return json(env, request, { message: "Unauthorized" }, 401);
}

function forbiddenOrigin(env: Env, request: Request) {
  return json(env, request, { message: "Forbidden origin" }, 403);
}

function requireAdmin(request: Request, env: Env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  return !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

function rootFromMediaPath(path: string) {
  return path.split("/")[0];
}

function normalizeMediaPath(value: FormDataEntryValue | string | null, fallback = "article-assets") {
  const path = String(value || fallback).replace(/^\/+|\/+$/g, "");
  const root = rootFromMediaPath(path);
  if (!MEDIA_ROOTS.includes(root)) throw new Error("Media path must start with an allowed root");
  if (!path || path.includes("..") || path.includes("\\") || path.includes("//")) throw new Error("Media path is not safe");
  return path;
}

function normalizeKey(value: FormDataEntryValue | string | null) {
  const key = normalizeMediaPath(value, "");
  const extension = key.split(".").pop()?.toLowerCase() || "";
  const allowedExtension = IMAGE_EXTENSIONS.includes(extension) || VIDEO_EXTENSIONS.includes(extension);
  if (!allowedExtension) throw new Error("Media key has an unsupported extension");
  if (key.endsWith("/")) throw new Error("Media key is not safe");
  return key;
}

function normalizePrefix(value: string | null) {
  const prefix = normalizeMediaPath(value, "article-assets");
  return `${prefix}/`;
}

function normalizeFolderKey(value: FormDataEntryValue | string | null) {
  const folder = normalizeMediaPath(value, "");
  if (!folder.includes("/")) throw new Error("Folder must be created under a media root");
  return `${folder}/`;
}

function publicPathForKey(key: string) {
  return `/${key}`;
}

function publicUrlForKey(env: Env, key: string) {
  return `${env.ASSET_BASE_URL.replace(/\/$/, "")}/${key}`;
}

async function handleList(request: Request, env: Env) {
  const url = new URL(request.url);
  const prefix = normalizePrefix(url.searchParams.get("prefix"));
  const listed = await env.ASSETS_BUCKET.list({ prefix, delimiter: "/", limit: 1000 });
  const folders = ((listed as unknown as { delimitedPrefixes?: string[] }).delimitedPrefixes || [])
    .sort((a, b) => a.localeCompare(b))
    .map((folderPrefix) => ({
      type: "folder",
      key: folderPrefix,
      name: folderPrefix.slice(prefix.length).replace(/\/$/, ""),
      path: publicPathForKey(folderPrefix),
    }));
  const objects = listed.objects
    .filter((object) => !object.key.endsWith("/"))
    .sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())
    .map((object) => ({
      key: object.key,
      name: object.key.split("/").pop() || object.key,
      path: publicPathForKey(object.key),
      url: publicUrlForKey(env, object.key),
      size: object.size,
      uploaded: object.uploaded.toISOString(),
    }));

  return json(env, request, { objects, folders, prefix, truncated: listed.truncated, cursor: listed.cursor || "" });
}

async function handleUpload(request: Request, env: Env) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("Upload requires a file field");
  const key = normalizeKey(form.get("key"));
  const extension = key.split(".").pop()?.toLowerCase() || "";
  const contentType = file.type || contentTypes[extension] || "application/octet-stream";

  await env.ASSETS_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return json(env, request, {
    key,
    name: key.split("/").pop() || key,
    path: publicPathForKey(key),
    url: publicUrlForKey(env, key),
    size: file.size,
  });
}

async function handleCreateFolder(request: Request, env: Env) {
  const form = await request.formData();
  const key = normalizeFolderKey(form.get("key"));
  await env.ASSETS_BUCKET.put(key, "", {
    httpMetadata: {
      contentType: "application/x-directory",
      cacheControl: "no-store",
    },
  });

  return json(env, request, {
    type: "folder",
    key,
    name: key.split("/").filter(Boolean).slice(-1)[0] || key,
    path: publicPathForKey(key),
  });
}

async function handleDelete(request: Request, env: Env) {
  const url = new URL(request.url);
  const key = normalizeKey(url.searchParams.get("key"));
  await env.ASSETS_BUCKET.delete(key);
  return json(env, request, { ok: true, key, path: publicPathForKey(key) });
}

export default {
  async fetch(request: Request, env: Env) {
    if (!originAllowed(request, env)) return forbiddenOrigin(env, request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    if (!requireAdmin(request, env)) return unauthorized(env, request);

    try {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname === "/media") return handleList(request, env);
      if (request.method === "POST" && url.pathname === "/media/upload") return handleUpload(request, env);
      if (request.method === "POST" && url.pathname === "/media/folder") return handleCreateFolder(request, env);
      if (request.method === "DELETE" && url.pathname === "/media") return handleDelete(request, env);
      if (request.method === "GET" && url.pathname === "/health") return json(env, request, { ok: true });
      return json(env, request, { message: "Not found" }, 404);
    } catch (error) {
      return json(env, request, { message: error instanceof Error ? error.message : "Media API error" }, 400);
    }
  },
};
