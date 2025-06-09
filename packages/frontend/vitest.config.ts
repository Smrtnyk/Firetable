/// <reference types="@vitest/browser/providers/playwright" />

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        vue(),
        vuetify({
            autoImport: true,
        }),
    ],
    test: {
        onConsoleLog (log) {
            return !log.includes("fabric Setting type has no effect");
        },
        dangerouslyIgnoreUnhandledErrors: true,
        setupFiles: ["vitest-browser-vue"],
        alias: {
            "src/": new URL("./src/", import.meta.url).pathname,
        },
        pool: "threads",
        poolOptions: {
            threads: {
                useAtomics: true,
                minThreads: "80%"
            }
        },
        server: {
            deps: {
                inline: ['vuetify'],
            },
        },
        clearMocks: true,
        reporters: ["default"],
        watch: false,
        includeTaskLocation: true,
        silent: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/*.config.ts',
                'test-helpers/**',
                '**/*.spec.ts',
                '**/index.ts',
                ".quasar/**",
                "src-pwa/**",
            ],
            all: true,
        },
        browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            viewport: {
                width: 400,
                height: 700,
            },
            instances: [{
                browser: "chromium",
            }]
        },
    },
});
