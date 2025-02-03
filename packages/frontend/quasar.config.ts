/* eslint-env node */

import { defineConfig } from "@quasar/app-vite/wrappers";

export default defineConfig(function () {
    return {
        // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
        // preFetch: true,

        // animations: 'all', // --- includes all animations
        // https://v2.quasar.dev/options/animations
        animations: [],

        // app boot file (/src/boot)
        // --> boot files are part of "main.js"
        // https://v2.quasar.dev/quasar-cli-vite/boot-files
        boot: [
            "rum",
            "event-emitter",
            "event-handlers",
            "register-pinia",
            "i18n",
            "firebase-connection",
        ],

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
        build: {
            target: {
                browser: ["esnext"],
                node: "node20",
            },

            typescript: {
                vueShim: true,
            },

            vueRouterMode: "history",
            // vueRouterBase,
            // vueDevtools,
            // vueOptionsAPI: false,

            // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

            // publicPath: '/',
            // analyze: true,
            // rawDefine: {}
            // ignorePublicFolder: true,
            // minify: false,
            // polyfillModulePreload: true,
            // distDir
            // extendViteConf(viteConf) {},
            // viteVuePluginOptions: {},

            // vitePlugins: [
            //   [ 'package-name', { ..options.. } ]
            // ]
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
        css: ["app.scss"],

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
        devServer: {
            host: "0.0.0.0",
            open: true,
            // https: process.env.CI ? null : {
            //     key: fs.readFileSync("./key.pem"),
            //     cert: fs.readFileSync("./cert.pem"),
            // },
            port: 8080,
        },

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: ["roboto-font"],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
        framework: {
            config: {},

            cssAddon: true,

            lang: "de",

            // iconSet: 'material-icons', // Quasar icon set
            // lang: 'en-US', // Quasar language pack

            // For special cases outside of where the auto-import strategy can have an impact
            // (like functional components as one of the examples),
            // you can manually specify Quasar components/directives to be available everywhere:
            //
            // components: [],
            // directives: [],

            // Quasar plugins
            plugins: ["Notify", "Dialog", "LocalStorage", "Loading", "BottomSheet"],
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
        // sourceFiles: {
        //   rootComponent: 'src/App.vue',
        //   router: 'src/router/index',
        //   store: 'src/store/index',
        //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
        //   pwaServiceWorker: 'src-pwa/custom-service-worker',
        //   pwaManifestFile: 'src-pwa/manifest.json',
        //   electronMain: 'src-electron/electron-main',
        //   electronPreload: 'src-electron/electron-preload'
        // },

        // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
        pwa: {
            injectPwaMetaTags: true,
            // Use your custom Service Worker
            workboxMode: "InjectManifest",
        },
    };
});
