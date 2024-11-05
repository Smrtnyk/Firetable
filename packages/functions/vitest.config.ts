import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        cache: false,
        globals: true,
        include: ["**/*.spec.ts"],
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
    },
});
