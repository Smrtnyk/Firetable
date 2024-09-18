import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [tsconfigPaths(), vue()],
    test: {
        setupFiles: ['vitest-browser-vue'],
        alias: {
            "src/": new URL("./src/", import.meta.url).pathname,
            "stores/": new URL("./src/stores/", import.meta.url).pathname,
        },
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
        includeTaskLocation: true,
        browser: {
            enabled: true,
            headless: true,
            name: "chromium",
            provider: "playwright",
        },
    },
});
