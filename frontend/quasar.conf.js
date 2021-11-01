/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { configure } = require("quasar/wrappers");
const fs = require("fs");
const path = require("path");
const ESLintPlugin = require("eslint-webpack-plugin");

// eslint-disable-next-line no-undef
module.exports = configure(function (ctx) {
    return {
        supportTS: {
            tsCheckerConfig: {
                eslint: {
                    enabled: true,
                    files: "./src/**/*.{ts,tsx,js,jsx,vue}",
                },
            },
        },

        boot: ["register-pinia", "i18n", "firebase-connection"],

        css: ["app.scss"],

        framework: {
            lang: "de",

            cssAddon: true,

            // Quasar plugins
            plugins: ["Notify", "Dialog", "LocalStorage", "Loading", "BottomSheet"],
        },

        build: {
            env: require("dotenv").config().parsed,

            vueRouterMode: "history",

            chainWebpack(chain) {
                chain
                    .plugin("eslint-webpack-plugin")
                    .use(ESLintPlugin, [{ extensions: ["js", "vue", "tsx", "ts"] }]);
                chain.module
                    .rule("tsx")
                    .test(/\.ts(x?)$/)
                    .use("babel-loader")
                    .loader("babel-loader")
                    .options({ babelrc: true });
                chain.module
                    .rule("tsx")
                    .test(/\.ts(x?)$/)
                    .use("ts-loader")
                    .loader("ts-loader")
                    .options({
                        appendTsSuffixTo: [/\.vue$/],
                        transpileOnly: true,
                    });
            },

            extendWebpack(cfg) {
                cfg.resolve.alias = {
                    ...cfg.resolve.alias,
                    vue$: "vue/dist/vue.esm-bundler.js",
                    "@": path.resolve(__dirname, "./"),
                };
                cfg.resolve.extensions.push(".tsx");
            },
        },

        devServer: {
            // https: ctx.dev
            //     ? {
            //           key: fs.readFileSync("./localhost-key.pem"),
            //           cert: fs.readFileSync("./localhost.pem"),
            //       }
            //     : true,
            port: 8080,
            open: true,
        },

        animations: [],

        ssr: { pwa: false },

        pwa: {
            workboxPluginMode: "InjectManifest",
            // WorkboxOptions: {}, // only for NON InjectManifest
            manifest: {
                name: "Firetable",
                short_name: "Firetable",
                description: "Firetable reservation management system",
                display: "standalone",
                orientation: "portrait",
                background_color: "#ffffff",
                theme_color: "#027be3",
                icons: [
                    {
                        src: "icons/icon-128x128.png",
                        sizes: "128x128",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-256x256.png",
                        sizes: "256x256",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-384x384.png",
                        sizes: "384x384",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
        },
    };
});
