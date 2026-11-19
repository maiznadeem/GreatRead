import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    const apiTarget = env.VITE_API_PROXY_TARGET || "https://api.greatread.himaiz.com";

    return {
        plugins: [react()],
        server: {
            proxy: {
                "/get": { target: apiTarget, changeOrigin: true },
                "/purchase": { target: apiTarget, changeOrigin: true },
            },
        },
    };
});
