import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        environment: "node",
        cache: false,
        globals: true,
        include: ["**/*.spec.ts"],
        clearMocks: true,
        reporters: ["default"],
        watch: false,
    },
    resolve: {
        alias: {
            "@shared-types": resolve(__dirname, "../types/src"),
        },
    },
});
