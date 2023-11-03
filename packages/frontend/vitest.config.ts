import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import Vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [tsconfigPaths(), Vue()],
    test: {
        alias: {
            "src/": new URL("./src/", import.meta.url).pathname,
            "stores/": new URL("./src/stores/", import.meta.url).pathname,
        },
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
        browser: {
            enabled: true,
            headless: true,
            name: "chrome",
        },
    },
});
