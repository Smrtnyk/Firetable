import type { AppUser } from "@firetable/types";
import type { usePermissionsStore } from "src/stores/permissions-store";
import type { RouteLocationNormalized, RouteRecordRaw } from "vue-router";

import { AdminRole, Role } from "@firetable/types";
import { useEventsStore } from "src/stores/events-store";
import { usePropertiesStore } from "src/stores/properties-store";

declare module "vue-router" {
    interface RouteMeta {
        allowedRoles?:
            | ((permissionsStore: ReturnType<typeof usePermissionsStore>) => boolean)
            | AppUser["role"][];
        breadcrumb?: ((route: RouteLocationNormalized, isAdmin?: boolean) => string) | string;
        parent?: string;
        requiresAuth: boolean;
    }
}

export const routes: RouteRecordRaw[] = [
    {
        children: [
            {
                component: () => import("src/pages/PageHome.vue"),
                meta: {
                    breadcrumb: "Home",
                    requiresAuth: true,
                },
                name: "home",
                path: "/",
            },
            {
                component: () => import("src/pages/PageOrganisations.vue"),
                meta: {
                    allowedRoles: [AdminRole.ADMIN],
                    breadcrumb: "Home",
                    requiresAuth: true,
                },
                name: "organisations",
                path: "/organisations",
            },
            {
                component: () => import("src/pages/PageProperties.vue"),
                meta: {
                    breadcrumb(route: RouteLocationNormalized, isAdmin) {
                        const propertiesStore = usePropertiesStore();
                        return isAdmin
                            ? propertiesStore.getOrganisationNameById(
                                  route.params.organisationId as string,
                              )
                            : "Home";
                    },
                    parent: "organisations",
                    requiresAuth: true,
                },
                name: "properties",
                path: "/:organisationId/properties",
                props: true,
            },
            {
                component: () => import("src/pages/PageEvents.vue"),
                meta: {
                    breadcrumb(route) {
                        const propertiesStore = usePropertiesStore();
                        return propertiesStore.getPropertyNameById(
                            route.params.propertyId as string,
                        );
                    },
                    parent: "properties",
                    requiresAuth: true,
                },
                name: "events",
                path: "/events/:organisationId/:propertyId",
                props: true,
            },
            {
                component: () => import("src/pages/PageEvent.vue"),
                meta: {
                    breadcrumb() {
                        const eventsStore = useEventsStore();
                        return eventsStore.currentEventName;
                    },
                    parent: "events",
                    requiresAuth: true,
                },
                name: "event",
                path: "/events/:organisationId/:propertyId/event/:eventId",
                props: true,
            },
            {
                component: () => import("src/pages/PageProfile.vue"),
                meta: {
                    breadcrumb: "Profile",
                    requiresAuth: true,
                },
                name: "userProfile",
                path: "/profile",
            },
            {
                component: () => import("src/pages/PageIssueReport.vue"),
                meta: {
                    breadcrumb: "Report Issue",
                    requiresAuth: true,
                },
                name: "reportIssue",
                path: "/report-issue",
            },
            // Protected routes
            {
                component: () => import("src/pages/Admin/PageAdminOrganisations.vue"),
                meta: {
                    allowedRoles: [AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminOrganisations",
                path: "/admin/organisations",
            },

            {
                component: () => import("src/pages/Admin/PageAdminOrganisation.vue"),
                meta: {
                    allowedRoles: [AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminOrganisation",
                path: "organisation/:organisationId",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminPropertySettings.vue"),
                meta: {
                    allowedRoles: [AdminRole.ADMIN, Role.PROPERTY_OWNER, Role.MANAGER],
                    requiresAuth: true,
                },
                name: "adminPropertySettings",
                path: "/admin/organisations/:organisationId/:propertyId/settings",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminGuests.vue"),
                meta: {
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeGuestbook;
                    },
                    requiresAuth: true,
                },
                name: "adminGuests",
                path: "/admin/:organisationId/guests",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminGuest.vue"),
                meta: {
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeGuestbook;
                    },
                    requiresAuth: true,
                },
                name: "adminGuest",
                path: "/admin/:organisationId/guests/:guestId",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminEvents.vue"),
                meta: {
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminEvents",
                path: "/admin/:organisationId/:propertyId/events",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminEvent.vue"),
                meta: {
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminEvent",
                path: "/admin/events/:organisationId/:propertyId/:eventId",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminUsers.vue"),
                meta: {
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminUsers",
                path: "/admin/:organisationId/users",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminFloors.vue"),
                meta: {
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canEditFloorPlans;
                    },
                    requiresAuth: true,
                },
                name: "adminFloors",
                path: "/admin/:organisationId/:propertyId/floors",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminFloorEdit.vue"),
                meta: {
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminFloorEdit",
                path: "/admin/floors/:organisationId/:propertyId/:floorId",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminProperties.vue"),
                meta: {
                    allowedRoles: [Role.PROPERTY_OWNER, AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminProperties",
                path: "/admin/:organisationId/properties",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminAnalytics.vue"),
                meta: {
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeAnalytics;
                    },
                    requiresAuth: true,
                },
                name: "adminAnalytics",
                path: "/admin/:organisationId/:propertyId/analytics",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminIssueReports.vue"),
                meta: {
                    allowedRoles: [AdminRole.ADMIN],
                    requiresAuth: true,
                },
                name: "adminIssueReports",
                path: "/issue-reports",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminPropertyDrinkCards.vue"),
                meta: {
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeInventory;
                    },
                    breadcrumb: "Drink Cards",
                    requiresAuth: true,
                },
                name: "adminPropertyDrinkCards",
                path: "/admin/:organisationId/:propertyId/drink-cards",
                props: true,
            },
        ],
        component: () => import("layouts/MainLayout.vue"),
        path: "/",
    },
    {
        children: [
            {
                component: () => import("src/pages/Admin/PageAdminInventory.vue"),
                meta: {
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeInventory;
                    },
                    requiresAuth: true,
                },
                name: "adminInventory",
                path: "inventory",
                props: true,
            },
            {
                component: () => import("src/pages/Admin/PageAdminFloorEdit.vue"),
                name: "adminFloorEdit",
                path: "floors/:floorId",
                props: true,
            },
        ],
        component: () => import("layouts/FloorEditorLayout.vue"),
        meta: {
            allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
            requiresAuth: true,
        },
        path: "/admin/:organisationId/:propertyId/",
        props: true,
    },
    {
        component: () => import("src/pages/PageAuth.vue"),
        meta: { requiresAuth: false },
        name: "auth",
        path: "/auth",
    },
    {
        component: () => import("src/pages/PagePublicDrinkCards.vue"),
        meta: {
            requiresAuth: false,
        },
        name: "publicDrinkCards",
        path: "/:organisationId/:propertyId/drink-cards",
        props: true,
    },
    // Always leave this as last one
    {
        component: () => import("src/pages/Error404.vue"),
        meta: { requiresAuth: false },
        path: "/:catchAll(.*)*",
    },
];
