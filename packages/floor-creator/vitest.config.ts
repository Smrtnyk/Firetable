import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        dir: "./src",
        clearMocks: true,
        mockReset: true,
        restoreMocks: true,
        reporters: ["default"],
        watch: false,
        silent: !!process.env.CI,
        browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{
                browser: "chromium",
            }]
        },
    },
});
