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
        setupFiles: ['vitest-browser-vue'],
        cache: false,
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
        reporters: ["basic"],
        watch: false,
        includeTaskLocation: true,
        browser: {
            enabled: true,
            headless: true,
            name: "chromium",
            provider: "playwright",
        },
    },
});
