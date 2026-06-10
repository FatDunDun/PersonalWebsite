/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_BASE_PATH?: string;
  readonly PUBLIC_CUSDIS_APP_ID?: string;
  readonly PUBLIC_CUSDIS_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
