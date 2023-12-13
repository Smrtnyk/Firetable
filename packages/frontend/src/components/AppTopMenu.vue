<script setup lang="ts">
import { useAppStore } from "src/stores/app-store";
import { useAuthStore } from "src/stores/auth-store";

import AppBreadcrumbs from "src/components/AppBreadcrumbs.vue";

const authStore = useAuthStore();
const menuLinks = [
    {
        icon: "home",
        routeName: "home",
    },
    {
        icon: "user-circle",
        routeName: "userProfile",
    },
];

const appStore = useAppStore();

function refreshApp(): void {
    window.location.reload();
}
</script>

<template>
    <q-header class="AppTopMenu">
        <q-tabs
            switch-indicator
            narrow-indicator
            class="bg-primary text-white AppTopMenu__tabs bg-primary col-xs-12 col-md-8 col-lg-6"
            active-color="white"
            :breakpoint="0"
        >
            <q-btn icon="redo" rounded @click="refreshApp" flat />
            <q-space />
            <q-route-tab
                v-for="menu in menuLinks"
                :key="menu.icon"
                :to="{ name: menu.routeName }"
                exact
                :icon="menu.icon"
            />
            <q-space />
            <q-btn flat aria-label="Menu" @click="appStore.toggleAppDrawerVisibility">
                <q-icon size="2rem" name="menu" />
            </q-btn>
        </q-tabs>

        <AppBreadcrumbs v-if="authStore.isAdmin" />
    </q-header>
</template>

<style lang="scss">
.AppTopMenu {
    background-color: transparent;

    &__tabs {
        padding-left: 1rem;
        padding-right: 1rem;

        .q-tabs__content {
            justify-content: space-evenly;
        }
    }
}
</style>
