/// <reference lib="webworker" />

/* eslint-disable */

declare const self: ServiceWorkerGlobalScope &
    typeof globalThis & { skipWaiting: () => void };

// This is required for Workbox's `injectManifest` mode to work.
// @ts-expect-error -- We're not going to use it for anything, though.
self.__WB_MANIFEST;
