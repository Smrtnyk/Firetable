import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        isolate: false,
        fileParallelism: false,
        setupFiles: [resolve(__dirname, "./test-helpers/vitest-setup.ts")],
        environment: "node",
        cache: false,
        globals: true,
        include: ["**/*.spec.ts"],
        clearMocks: true,
        reporters: ["default"],
        watch: false,
        silent: true
    },
    resolve: {
        alias: {
            "@shared-types": resolve(__dirname, "../types/src"),
        },
    },
});
