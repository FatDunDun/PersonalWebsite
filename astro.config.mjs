import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;

const site =
  process.env.PUBLIC_SITE_URL ||
  (owner ? `https://${owner}.github.io` : "https://example.com");

const base =
  process.env.PUBLIC_BASE_PATH ||
  (process.env.GITHUB_ACTIONS && repository ? `/${repository}` : "/");

export default defineConfig({
  site,
  base,
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
