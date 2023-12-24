<template>
    <q-breadcrumbs class="AppBreadcrumbs" separator="">
        <q-breadcrumbs-el
            class="step"
            v-for="(link, index) in breadcrumbLinks"
            :key="index"
            :label="isRoot(link.name) ? undefined : link.name"
            :to="link.path"
            :icon="isRoot(link.name) ? 'home' : undefined"
        />
    </q-breadcrumbs>
</template>

<script setup lang="ts">
import type { RouteRecordName, RouteRecordNormalized, RouteRecordRaw } from "vue-router";
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import { useAuthStore } from "src/stores/auth-store";

interface Link {
    name: string;
    path: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

function isRoot(routeName: string): boolean {
    return routeName === "Home";
}

function findRouteByName(name: RouteRecordName): RouteRecordRaw | RouteRecordNormalized | void {
    for (const routeItem of router.getRoutes()) {
        if (routeItem.name === name) {
            return routeItem;
        }
        if (routeItem.children) {
            for (const childRoute of routeItem.children) {
                if (childRoute.name === name) {
                    return childRoute;
                }
            }
        }
    }
}

const breadcrumbLinks = computed<Link[]>(() => {
    const links: Link[] = [];
    let currentRouteName = route.name;

    while (currentRouteName) {
        const currentRoute = findRouteByName(currentRouteName);

        if (currentRoute?.meta?.breadcrumb && currentRoute.name) {
            const isAllowed =
                !currentRoute.meta.allowedRoles ||
                (currentRoute.meta.allowedRoles as string[]).includes(authStore.user!.role);

            if (isAllowed) {
                const path = router.resolve({
                    name: currentRoute.name,
                    params: { ...route.params },
                }).href;
                const breadCrumb = currentRoute.meta.breadcrumb;
                const name =
                    typeof breadCrumb === "function"
                        ? breadCrumb(route, authStore.isAdmin)
                        : breadCrumb;

                if (name) {
                    links.unshift({
                        name,
                        path: path,
                    });
                }
            }
        }

        currentRouteName = currentRoute?.meta?.parent
            ? (currentRoute.meta.parent as RouteRecordName)
            : null;
    }

    return links;
});
</script>

<style lang="scss">
.AppBreadcrumbs {
    max-width: 100%;
    overflow: hidden;
    .q-breadcrumbs__separator {
        display: none;
    }
    margin-top: 1px;

    div {
        flex-wrap: nowrap;
    }

    div > div {
        background: $primary;
        height: 30px;
        position: relative;
        line-height: 30px;
        margin-right: -2px;
        padding: 0 10px;
        border-radius: 0;
        white-space: nowrap;
        flex-shrink: 1;

        &.q-breadcrumbs--last {
            flex-grow: 1;
            background: $gradient-primary-reversed;

            & > a {
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
            }
        }

        & > a {
            text-decoration: none;
            color: white;
        }

        &:last-child {
            margin-right: 0;
        }

        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: -5px;
            border-left: 5px solid transparent;
            border-top: 15px solid $primary;
            border-bottom: 15px solid $primary;
        }

        &:first-child::before {
            display: none;
        }

        &::after {
            position: absolute;
            top: 0;
            right: -5px;
            border-left: 5px solid $primary;
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            content: "";
        }

        &:last-child::after {
            display: none;
        }
    }
}
</style>
