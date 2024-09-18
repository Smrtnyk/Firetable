import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./src",
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
        browser: {
            enabled: true,
            headless: true,
            name: "chromium",
            provider: "playwright",
        },
    },
});
