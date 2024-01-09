import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["**/*.spec.ts"],
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
    },
});
