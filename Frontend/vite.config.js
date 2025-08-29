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
  base: "/absproxy/3454/",
  envDir: "../",
  server: {
    host: "0.0.0.0",
    port: 3454,
    allowedHosts: ["code.redeyes.dev"],
    hmr: {
      path: "sockjs-node",
    },
    proxy: {
      "^/absproxy/3454/api": {
        target: "https://code.redeyes.dev/proxy/3001/",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/absproxy\/3454/, ""),
      },
    },
  },
  build: {
    outDir: "/var/www/html/GamingHerb",
    emptyOutDir: true,
  },
});
