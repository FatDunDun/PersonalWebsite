interface Env {
  ASSETS_BUCKET: R2Bucket;
  ADMIN_TOKEN: string;
  ASSET_BASE_URL: string;
  ALLOWED_ORIGIN?: string;
}

const MEDIA_ROOTS = ["images", "personal-photo", "videos", "personal-video"];
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

function corsHeaders(env: Env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(env: Env, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function unauthorized(env: Env) {
  return json(env, { message: "Unauthorized" }, 401);
}

function requireAdmin(request: Request, env: Env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  return !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

function normalizeKey(value: FormDataEntryValue | string | null) {
  const key = String(value || "").replace(/^\/+/, "");
  const root = key.split("/")[0];
  const extension = key.split(".").pop()?.toLowerCase() || "";
  const allowedExtension = IMAGE_EXTENSIONS.includes(extension) || VIDEO_EXTENSIONS.includes(extension);
  if (!MEDIA_ROOTS.includes(root)) throw new Error("Media key must start with an allowed root");
  if (!allowedExtension) throw new Error("Media key has an unsupported extension");
  if (key.includes("..") || key.includes("\\") || key.endsWith("/")) throw new Error("Media key is not safe");
  return key;
}

function normalizePrefix(value: string | null) {
  const prefix = String(value || "images").replace(/^\/+|\/+$/g, "");
  if (!MEDIA_ROOTS.includes(prefix)) throw new Error("Media prefix is not allowed");
  return `${prefix}/`;
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
  const listed = await env.ASSETS_BUCKET.list({ prefix, limit: 1000 });
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

  return json(env, { objects, truncated: listed.truncated, cursor: listed.cursor || "" });
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

  return json(env, {
    key,
    name: key.split("/").pop() || key,
    path: publicPathForKey(key),
    url: publicUrlForKey(env, key),
    size: file.size,
  });
}

async function handleDelete(request: Request, env: Env) {
  const url = new URL(request.url);
  const key = normalizeKey(url.searchParams.get("key"));
  await env.ASSETS_BUCKET.delete(key);
  return json(env, { ok: true, key, path: publicPathForKey(key) });
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env) });
    if (!requireAdmin(request, env)) return unauthorized(env);

    try {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname === "/media") return handleList(request, env);
      if (request.method === "POST" && url.pathname === "/media/upload") return handleUpload(request, env);
      if (request.method === "DELETE" && url.pathname === "/media") return handleDelete(request, env);
      if (request.method === "GET" && url.pathname === "/health") return json(env, { ok: true });
      return json(env, { message: "Not found" }, 404);
    } catch (error) {
      return json(env, { message: error instanceof Error ? error.message : "Media API error" }, 400);
    }
  },
};
