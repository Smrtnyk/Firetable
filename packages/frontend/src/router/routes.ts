import { RouteRecordRaw } from "vue-router";
import { ADMIN, Role } from "@firetable/types";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: () => import("layouts/MainLayout.vue"),
        children: [
            {
                path: "/",
                name: "home",
                meta: { requiresAuth: true },
                component: () => import("src/pages/PageHome.vue"),
            },
            {
                path: "/organisations",
                name: "organisations",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [ADMIN],
                },
                component: () => import("src/pages/PageOrganisations.vue"),
            },
            {
                path: "/:organisationId/properties",
                name: "properties",
                props: true,
                meta: { requiresAuth: true },
                component: () => import("src/pages/PageProperties.vue"),
            },
            {
                path: "/events/:organisationId/:propertyId",
                name: "events",
                props: true,
                meta: { requiresAuth: true },
                component: () => import("src/pages/PageEvents.vue"),
            },
            {
                path: "/events/:organisationId/:propertyId/event/:eventId",
                name: "event",
                meta: { requiresAuth: true },
                props: true,
                component: () => import("src/pages/PageEvent.vue"),
            },
            {
                path: "/profile",
                name: "userProfile",
                meta: { requiresAuth: true },
                component: () => import("src/pages/PageProfile.vue"),
            },

            // Protected routes
            {
                path: "/admin/organisations",
                name: "adminOrganisations",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [ADMIN],
                },
                component: () => import("src/pages/Admin/PageAdminOrganisations.vue"),
            },
            {
                path: "/admin/:organisationId/events",
                name: "adminEvents",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminEvents.vue"),
            },
            {
                path: "/admin/events/:organisationId/:propertyId/:eventId",
                name: "adminEvent",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminEvent.vue"),
            },
            {
                path: "/admin/:organisationId/users",
                name: "adminUsers",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminUsers.vue"),
            },
            {
                path: "/admin/:organisationId/floors",
                name: "adminFloors",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminFloors.vue"),
            },
            {
                path: "/admin/floors/:organisationId/:propertyId/:floorId",
                name: "adminFloorEdit",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminFloorEdit.vue"),
            },
            {
                path: "/admin/:organisationId/properties",
                name: "adminProperties",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminProperties.vue"),
            },
        ],
    },
    {
        path: "/auth",
        name: "auth",
        meta: { requiresAuth: false },
        component: () => import("src/pages/PageAuth.vue"),
    },
    // Always leave this as last one
    {
        path: "/:catchAll(.*)*",
        meta: { requiresAuth: false },
        component: () => import("src/pages/Error404.vue"),
    },
];

export default routes;
