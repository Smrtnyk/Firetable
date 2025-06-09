import { createRouter, createWebHistory } from "vue-router";

import { setupRouteLoadingGuard } from "./route-loading-guard";
import { routes } from "./routes";

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }

        return { left: 0, top: 0 };
    },
});

setupRouteLoadingGuard(router);

export default router;
