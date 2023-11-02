import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        exclude: [...configDefaults.exclude, "packages/template/*"],
        clearMocks: true,
        reporters: ["basic"],
        watch: false,
    },
});
