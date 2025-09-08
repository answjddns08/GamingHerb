import { fileURLToPath, URL } from "node:url";
import { cwd } from "node:process";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), "");
  const isCodeServer = env.VITE_CODE_SERVER || false;

  return {
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    base: isCodeServer ? "/absproxy/3454/" : "/",
    envDir: "../",
    server: {
      host: "0.0.0.0",
      port: 3454,
      allowedHosts: ["code.redeyes.dev"],
      hmr: {
        path: "sockjs-node",
      },
      proxy: isCodeServer
        ? {
            // Code-server 환경용 proxy 설정
            "^/absproxy/3454/api": {
              target: "https://code.redeyes.dev/proxy/3001/",
              changeOrigin: true,
              secure: false,
              ws: true,
              rewrite: (path) => path.replace(/^\/absproxy\/3454/, ""),
            },
          }
        : {
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
