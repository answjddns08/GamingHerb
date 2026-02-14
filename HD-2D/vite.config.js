import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

const isRemote = process.env.IS_REMOTE !== undefined;

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	server: {
		host: "0.0.0.0", // Bind to all network interfaces for remote access
		port: 5173, // Or a specific port you want to use (default is 5173)

		allowedHosts: ["code.local", "gamingherb.redeyes.dev"],

		// Optional: if your code-server uses a proxy with a specific path
		// you might need to adjust the HMR options
		hmr: isRemote
			? {
					protocol: "wss",
					host: "code.local",
					clientPort: 443,
				}
			: {
					// 로컬 SSH 접속 시 기본 설정 사용
					protocol: "ws",
				},
		// Optional: ensure CORS is enabled if needed
		cors: true,
	},
});
