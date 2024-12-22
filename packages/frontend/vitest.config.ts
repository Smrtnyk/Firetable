/// <reference types="@vitest/browser/providers/playwright" />

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [
        tsconfigPaths({
            // This is needed to avoid Vitest picking up tsconfig.json files from other unrelated projects in the monorepo
            ignoreConfigErrors: true,
        }),
        vue({
            template: { transformAssetUrls },
        }),
        quasar({
            sassVariables: "src/css/quasar.variables.scss",
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
        deps: {
            optimizer: {
                web: {
                    enabled: true,
                    include: ["@vue/test-utils", "quasar", "vue-i18n", "pinia", "@firetable/backend", "@pinia/testing", "vue"],
                }
            }
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
