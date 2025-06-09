import vue from "@vitejs/plugin-vue";
import { execSync } from "node:child_process";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

function getBuildNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}.${hours}${minutes}`;
}

function getGitCommitHash(): string {
    try {
        return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
        return "unknown";
    }
}

const BUILD_NUMBER = getBuildNumber();
const GIT_COMMIT_HASH = getGitCommitHash();

const pwaManifestIcons = [
    // Android Icons
    {
        purpose: "maskable",
        sizes: "512x512",
        src: "/android/android-launchericon-512-512.png",
        type: "image/png",
    },
    {
        purpose: "maskable",
        sizes: "192x192",
        src: "/android/android-launchericon-192-192.png",
        type: "image/png",
    },
    {
        purpose: "any",
        sizes: "144x144",
        src: "/android/android-launchericon-144-144.png",
        type: "image/png",
    },
    {
        purpose: "any",
        sizes: "96x96",
        src: "/android/android-launchericon-96-96.png",
        type: "image/png",
    },
    {
        purpose: "any",
        sizes: "72x72",
        src: "/android/android-launchericon-72-72.png",
        type: "image/png",
    },
    {
        purpose: "any",
        sizes: "48x48",
        src: "/android/android-launchericon-48-48.png",
        type: "image/png",
    },

    // iOS Icons
    {
        purpose: "any",
        sizes: "180x180",
        src: "/ios/180.png",
        type: "image/png",
    },
    {
        purpose: "any",
        sizes: "192x192",
        src: "/ios/192.png",
        type: "image/png",
    },
    {
        purpose: "any",
        sizes: "512x512",
        src: "/ios/512.png",
        type: "image/png",
    },
];

export default defineConfig({
    define: {
        __BUILD_NUMBER__: JSON.stringify(BUILD_NUMBER),
        __GIT_COMMIT_HASH__: JSON.stringify(GIT_COMMIT_HASH),
    },
    plugins: [
        vue(),
        vuetify({
            autoImport: true,
        }),
        VitePWA({
            includeAssets: [
                "favicon.ico",
                "/android/android-launchericon-48-48.png",
                "/android/android-launchericon-32-32.png",
                "/ios/180.png",
            ],
            manifest: {
                description: "Firetable venue management App",
                icons: pwaManifestIcons,
                name: "Fietable",
                short_name: "Firetable",
                theme_color: "#6247aa",
            },
            registerType: "prompt",
            workbox: {
                cleanupOutdatedCaches: true,
                // Cache static resources
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
                // Cache specific routes and assets
                runtimeCaching: [
                    {
                        handler: "CacheFirst",
                        options: {
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            cacheName: "google-fonts-cache",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                                maxEntries: 10,
                            },
                        },
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                    },
                    {
                        handler: "CacheFirst",
                        options: {
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            cacheName: "gstatic-fonts-cache",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                                maxEntries: 10,
                            },
                        },
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                    },

                    {
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "js-module-cache",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24,
                                maxEntries: 100,
                            },
                        },
                        urlPattern: /\.js$/i,
                    },

                    {
                        handler: "CacheFirst",
                        options: {
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            cacheName: "images-cache",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 7,
                                maxEntries: 500,
                            },
                        },
                        urlPattern: /\/.*\/(jpeg|jpg|png|gif|svg)$/i,
                    },
                ],
                skipWaiting: false,
            },
        }),
    ],
    resolve: {
        alias: {
            src: path.resolve(__dirname, "src"),
        },
    },
});
