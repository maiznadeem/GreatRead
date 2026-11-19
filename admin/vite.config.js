import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    const target = env.VITE_API_PROXY_TARGET || "https://api.greatread.himaiz.com";
    const proxy = { target, changeOrigin: true };

    return {
        plugins: [react()],
        server: { port: 5174, proxy: { "/auth": proxy, "/admin": proxy } },
    };
});
