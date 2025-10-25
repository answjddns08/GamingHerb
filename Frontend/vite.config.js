import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(() => {

  return {
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    base: "/",
    envDir: "../",
    server: {
      host: "0.0.0.0",
      port: 3454,
      allowedHosts: ["code.redeyes.dev"],
      hmr: {
        path: "sockjs-node",
      },
      proxy: {
        // 로컬 개발 환경용 proxy 설정
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      outDir: "/var/www/html/GamingHerb",
      emptyOutDir: true,
    },
  };
});
