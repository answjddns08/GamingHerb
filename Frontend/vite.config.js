import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  base: "/",
  envDir: "../",
  server: {
    proxy: {
      "/api": {
        target: "https://gamingherb.redeyes.dev",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Discord Activity 로컬 테스트용 프록시
      "/.proxy": {
        target: "https://gamingherb.redeyes.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/\.proxy/, ""),
      },
    },
  },
  build: {
    outDir: "/var/www/html/GamingHerb",
    emptyOutDir: true,
  },
});
