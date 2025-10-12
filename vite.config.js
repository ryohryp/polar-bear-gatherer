// vite.config.js
import { defineConfig } from "vite";
export default defineConfig({
  // リポ名に合わせる（先頭と末尾のスラッシュ必須）
  base: "/polar-bear-gatherer/",
  server: { host: true }
});
