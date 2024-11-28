import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./src",
        clearMocks: true,
        reporters: ["default"],
        watch: false,
        silent: !!process.env.CI,
        browser: {
            enabled: true,
            headless: true,
            name: "chromium",
            provider: "playwright",
        },
    },
});
