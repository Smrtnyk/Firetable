import type { Router } from "vue-router";

import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";

import { setupRouteLoadingGuard } from "./route-loading-guard";
import { routes } from "./routes";

export default function (): Router {
    const createHistory =
        process.env.VUE_ROUTER_MODE === "history" ? createWebHistory : createWebHashHistory;

    const router = createRouter({
        // Leave this as is and make changes in quasar.config.js instead!
        // quasar.config.js -> build -> vueRouterMode
        // quasar.config.js -> build -> publicPath
        history: createHistory(process.env.MODE === "ssr" ? void 0 : process.env.VUE_ROUTER_BASE),
        routes,

        scrollBehavior(_0, _1, savedPosition) {
            if (savedPosition) {
                return savedPosition;
            }
            return { left: 0, top: 0 };
        },
    });

    setupRouteLoadingGuard(router);

    return router;
}
