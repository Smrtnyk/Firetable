import type { Router } from "vue-router";
import { routes } from "./routes";
import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";

export default function (): Router {
    const createHistory =
        process.env.VUE_ROUTER_MODE === "history" ? createWebHistory : createWebHashHistory;

    return createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,

        // Leave this as is and make changes in quasar.config.js instead!
        // quasar.config.js -> build -> vueRouterMode
        // quasar.config.js -> build -> publicPath
        history: createHistory(process.env.MODE === "ssr" ? void 0 : process.env.VUE_ROUTER_BASE),
    });
}
