import { RouteRecordRaw } from "vue-router";
import { ADMIN, Role } from "@firetable/types";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: () => import("layouts/MainLayout.vue"),
        children: [
            {
                path: "/",
                name: "properties",
                meta: { requiresAuth: true },
                component: () => import("pages/PageProperties.vue"),
            },
            {
                path: "/events/:propertyId",
                name: "events",
                props: true,
                meta: { requiresAuth: true },
                component: () => import("pages/PageEvents.vue"),
            },
            {
                path: "/events/:propertyId/event/:eventId",
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
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                component: () => import("pages/Admin/PageAdminEvents.vue"),
            },
            {
                path: "/admin/events/:id",
                name: "adminEvent",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("pages/Admin/PageAdminEvent.vue"),
            },
            {
                path: "/admin/users",
                name: "adminUsers",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                component: () => import("pages/Admin/PageAdminUsers.vue"),
            },
            {
                path: "/admin/floors",
                name: "adminFloors",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                component: () => import("pages/Admin/PageAdminFloors.vue"),
            },
            {
                path: "/admin/floors/:floorID",
                name: "adminFloorEdit",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("pages/Admin/PageAdminFloorEdit.vue"),
            },
            {
                path: "/admin/properties",
                name: "adminProperties",
                meta: { requiresAuth: true, allowedRoles: [Role.PROPERTY_OWNER, ADMIN] },
                component: () => import("pages/Admin/PageAdminProperties.vue"),
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
