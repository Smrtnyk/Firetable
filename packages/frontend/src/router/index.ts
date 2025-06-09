import { createRouter, createWebHistory } from "vue-router";

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

export default router;
