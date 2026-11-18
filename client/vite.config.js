import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    const apiTarget = env.VITE_API_PROXY_TARGET || "https://admin.greatread.himaiz.com";

    return {
        plugins: [react()],
        server: {
            proxy: {
                "/get": { target: apiTarget, changeOrigin: true },
                "/purchase": { target: apiTarget, changeOrigin: true },
                "/login": { target: apiTarget, changeOrigin: true },
                "/logout": { target: apiTarget, changeOrigin: true },
                "/reset": { target: apiTarget, changeOrigin: true },
                "/admin": { target: apiTarget, changeOrigin: true },
                "/webhooks": { target: apiTarget, changeOrigin: true },
            },
        },
    };
});
