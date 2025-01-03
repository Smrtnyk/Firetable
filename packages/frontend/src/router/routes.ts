import type { RouteLocationNormalized, RouteRecordRaw } from "vue-router";
import type { usePermissionsStore } from "src/stores/permissions-store";
import type { AppUser } from "@firetable/types";
import { AdminRole, Role } from "@firetable/types";
import { usePropertiesStore } from "src/stores/properties-store";
import { useEventsStore } from "src/stores/events-store";

declare module "vue-router" {
    interface RouteMeta {
        requiresAuth: boolean;
        breadcrumb?: string | ((route: RouteLocationNormalized, isAdmin?: boolean) => string);
        allowedRoles?:
            | AppUser["role"][]
            | ((permissionsStore: ReturnType<typeof usePermissionsStore>) => boolean);
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
                    allowedRoles: [AdminRole.ADMIN],
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
                    breadcrumb(route: RouteLocationNormalized, isAdmin) {
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
                    breadcrumb(route) {
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
                    breadcrumb() {
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
            {
                path: "/report-issue",
                name: "reportIssue",
                meta: {
                    requiresAuth: true,
                    breadcrumb: "Report Issue",
                },
                component: () => import("src/pages/PageIssueReport.vue"),
            },
            // Protected routes
            {
                path: "/admin/organisations",
                name: "adminOrganisations",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [AdminRole.ADMIN],
                },
                component: () => import("src/pages/Admin/PageAdminOrganisations.vue"),
            },

            {
                path: "organisation/:organisationId",
                name: "adminOrganisation",
                component: () => import("src/pages/Admin/PageAdminOrganisation.vue"),
                props: true,
                meta: {
                    requiresAuth: true,
                    allowedRoles: [AdminRole.ADMIN],
                },
            },
            {
                path: "/admin/organisations/:organisationId/:propertyId/settings",
                name: "adminPropertySettings",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [AdminRole.ADMIN, Role.PROPERTY_OWNER, Role.MANAGER],
                },
                component: () => import("src/pages/Admin/PageAdminPropertySettings.vue"),
                props: true,
            },
            {
                path: "/admin/:organisationId/guests",
                name: "adminGuests",
                meta: {
                    requiresAuth: true,
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeGuestbook;
                    },
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminGuests.vue"),
            },
            {
                path: "/admin/:organisationId/guests/:guestId",
                name: "adminGuest",
                meta: {
                    requiresAuth: true,
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeGuestbook;
                    },
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminGuest.vue"),
            },
            {
                path: "/admin/:organisationId/:propertyId/events",
                name: "adminEvents",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminEvents.vue"),
            },
            {
                path: "/admin/events/:organisationId/:propertyId/:eventId",
                name: "adminEvent",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminEvent.vue"),
            },
            {
                path: "/admin/:organisationId/users",
                name: "adminUsers",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminUsers.vue"),
            },
            {
                path: "/admin/:organisationId/:propertyId/floors",
                name: "adminFloors",
                meta: {
                    requiresAuth: true,
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canEditFloorPlans;
                    },
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminFloors.vue"),
            },
            {
                path: "/admin/floors/:organisationId/:propertyId/:floorId",
                name: "adminFloorEdit",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminFloorEdit.vue"),
            },
            {
                path: "/admin/:organisationId/properties",
                name: "adminProperties",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [Role.PROPERTY_OWNER, AdminRole.ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminProperties.vue"),
            },
            {
                path: "/admin/:organisationId/:propertyId/analytics",
                name: "adminAnalytics",
                meta: {
                    requiresAuth: true,
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeAnalytics;
                    },
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminAnalytics.vue"),
            },
            {
                path: "/issue-reports",
                name: "adminIssueReports",
                meta: {
                    requiresAuth: true,
                    allowedRoles: [AdminRole.ADMIN],
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminIssueReports.vue"),
            },
            {
                path: "/admin/:organisationId/:propertyId/drink-cards",
                name: "adminPropertyDrinkCards",
                meta: {
                    requiresAuth: true,
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeInventory;
                    },
                    breadcrumb: "Drink Cards",
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminPropertyDrinkCards.vue"),
            },
        ],
    },
    {
        path: "/admin/:organisationId/:propertyId/",
        component: () => import("layouts/FloorEditorLayout.vue"),
        meta: {
            requiresAuth: true,
            allowedRoles: [Role.PROPERTY_OWNER, Role.MANAGER, AdminRole.ADMIN],
        },
        props: true,
        children: [
            {
                path: "inventory",
                name: "adminInventory",
                meta: {
                    requiresAuth: true,
                    allowedRoles(permissionsStore) {
                        return permissionsStore.canSeeInventory;
                    },
                },
                props: true,
                component: () => import("src/pages/Admin/PageAdminInventory.vue"),
            },
            {
                path: "floors/:floorId",
                name: "adminFloorEdit",
                component: () => import("src/pages/Admin/PageAdminFloorEdit.vue"),
                props: true,
            },
        ],
    },
    {
        path: "/auth",
        name: "auth",
        meta: { requiresAuth: false },
        component: () => import("src/pages/PageAuth.vue"),
    },
    {
        path: "/:organisationId/:propertyId/drink-cards",
        name: "publicDrinkCards",
        meta: {
            requiresAuth: false,
        },
        props: true,
        component: () => import("src/pages/PagePublicDrinkCards.vue"),
    },
    // Always leave this as last one
    {
        path: "/:catchAll(.*)*",
        meta: { requiresAuth: false },
        component: () => import("src/pages/Error404.vue"),
    },
];
