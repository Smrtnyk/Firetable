import { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: () => import("layouts/MainLayout.vue"),
        children: [
            {
                path: "/",
                name: "home",
                meta: { requiresAuth: true },
                component: () => import("pages/PageHome.vue"),
            },
            {
                path: "/events/:id",
                name: "event",
                meta: { requiresAuth: true },
                props: true,
                component: () => import("pages/PageEvent.vue"),
            },
            {
                path: "/profile",
                name: "userProfile",
                meta: { requiresAuth: true },
                component: () => import("pages/PageProfile.vue"),
            },

            // ADMIN ROUTES
            {
                path: "/admin/events",
                name: "adminEvents",
                meta: { requiresAuth: true, requiresAdmin: true },
                component: () => import("pages/Admin/PageAdminEvents.vue"),
            },
            {
                path: "/admin/events/:id",
                name: "adminEvent",
                meta: { requiresAuth: true, requiresAdmin: true },
                props: true,
                component: () => import("pages/Admin/PageAdminEvent.vue"),
            },
            {
                path: "/admin/users",
                name: "adminUsers",
                meta: { requiresAuth: true, requiresAdmin: true },
                component: () => import("pages/Admin/PageAdminUsers.vue"),
            },
            {
                path: "/admin/floors",
                name: "adminFloors",
                meta: { requiresAuth: true, requiresAdmin: true },
                component: () => import("pages/Admin/PageAdminFloors.vue"),
            },
            {
                path: "/admin/floors/:floorID",
                name: "adminFloorEdit",
                meta: { requiresAuth: true, requiresAdmin: true },
                props: true,
                component: () => import("pages/Admin/PageAdminFloorEdit.vue"),
            },
            {
                path: "/admin/roles",
                name: "adminRoles",
                meta: { requiresAuth: true, requiresAdmin: true },
                component: () => import("pages/Admin/PageAdminRoles.vue"),
            },
        ],
    },
    {
        path: "/auth",
        name: "auth",
        meta: { requiresAuth: false },
        component: () => import("pages/PageAuth.vue"),
    },
    // Always leave this as last one,
    // but you can also remove it
    {
        path: "/:catchAll(.*)*",
        meta: { requiresAuth: false },
        component: () => import("pages/Error404.vue"),
    },
];

export default routes;
