<script setup lang="ts">
import { useAppStore } from "src/stores/app-store";

const menuLinks = [
    {
        icon: "home",
        routeName: "properties",
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
    <q-header class="bg-primary text-white">
        <q-tabs
            switch-indicator
            narrow-indicator
            class="text-white AppTopMenu__tabs bg-primary col-xs-12 col-md-8 col-lg-6"
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
    </q-header>
</template>

<style lang="scss">
.AppTopMenu__tabs {
    border-radius: $border-radius;
    padding-left: 1rem;
    padding-right: 1rem;

    .q-tabs__content {
        justify-content: space-evenly;
    }
}
</style>
