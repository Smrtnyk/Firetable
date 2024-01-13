import type { RouteLocationNormalized, RouteRecordRaw } from "vue-router";
import { ADMIN, Role } from "@firetable/types";
import { usePropertiesStore } from "src/stores/properties-store";
import { useEventsStore } from "src/stores/events-store";

declare module "vue-router" {
    interface RouteMeta {
        requiresAuth: boolean;
        breadcrumb?: string | ((route: RouteLocationNormalized, isAdmin?: boolean) => string);
        allowedRoles?: (Role | typeof ADMIN)[];
        parent?: string;
    }
}

export const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: () => import("layouts/MainLayout.vue"),
        children: [
            {
                path: "/",
                name: "home",
                meta: {
                    requiresAuth: true,
                    breadcrumb: "Home",
                },
                component: () => import("src/pages/PageHome.vue"),
            },
            {
                path: "/organisations",
                name: "organisations",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [ADMIN],
                    breadcrumb: "Home",
                },
                component: () => import("src/pages/PageOrganisations.vue"),
            },
            {
                path: "/:organisationId/properties",
                name: "properties",
                props: true,
                meta: {
                    requiresAuth: true,
                    breadcrumb: (route: RouteLocationNormalized, isAdmin) => {
                        const propertiesStore = usePropertiesStore();
                        return isAdmin
                            ? propertiesStore.getOrganisationNameById(
                                  route.params.organisationId as string,
                              )
                            : "Home";
                    },
                    parent: "organisations",
                },
                component: () => import("src/pages/PageProperties.vue"),
            },
            {
                path: "/events/:organisationId/:propertyId",
                name: "events",
                props: true,
                meta: {
                    requiresAuth: true,
                    breadcrumb: (route) => {
                        const propertiesStore = usePropertiesStore();
                        return propertiesStore.getPropertyNameById(
                            route.params.propertyId as string,
                        );
                    },
                    parent: "properties",
                },
                component: () => import("src/pages/PageEvents.vue"),
            },
            {
                path: "/events/:organisationId/:propertyId/event/:eventId",
                name: "event",
                meta: {
                    requiresAuth: true,
                    breadcrumb: () => {
                        const eventsStore = useEventsStore();
                        return eventsStore.currentEventName;
                    },
                    parent: "events",
                },
                props: true,
                component: () => import("src/pages/PageEvent.vue"),
            },
            {
                path: "/profile",
                name: "userProfile",
                meta: {
                    requiresAuth: true,
                    breadcrumb: "Profile",
                },
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
                path: "/admin/organisations/:organisationId/settings",
                name: "adminOrganisationSettings",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [ADMIN, Role.PROPERTY_OWNER, Role.MANAGER],
                },
                component: () => import("src/pages/Admin/PageAdminOrganisationSettings.vue"),
            },
            {
                path: "/admin/:organisationId/guests",
                name: "adminGuests",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminGuests.vue"),
            },
            {
                path: "/admin/:organisationId/guests/:guestId",
                name: "adminGuest",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminGuest.vue"),
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
            {
                path: "/admin/:organisationId/analytics",
                name: "adminAnalytics",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminAnalytics.vue"),
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
