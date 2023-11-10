import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
        browser: {
            enabled: true,
            headless: true,
            name: "chrome",
        },
        deps: {
            inline: ["@firetable/types", "@firetable/utils"],
        },
    },
});
