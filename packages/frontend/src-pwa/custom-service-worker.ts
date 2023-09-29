/// <reference lib="webworker" />

/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "injectManifest"
 */

import { precacheAndRoute } from "workbox-precaching";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { registerRoute } from "workbox-routing";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
    ({ url }) => {
        return url.host.startsWith("fonts");
    },
    new CacheFirst({
        cacheName: "fonts",
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30,
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    }),
);

registerRoute(({ url }) => {
    return url.href.includes("firestore.googleapis.com");
}, new NetworkFirst());

// EVENTS
self.addEventListener("push", (event) => {
    const { data } = event;

    if (!data) return;

    const [title, body] = data.text().split("|");

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
        }),
    );
});
