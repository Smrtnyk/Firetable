<template>
    <router-view v-slot="{ Component }">
        <AppUpdateNotification />
        <GlobalSnackbar />
        <GenericDialog />
        <RouteLoadingBar />
        <NetworkOverlay />
        <GlobalLoadingOverlay />
        <transition name="fade">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import AppUpdateNotification from "src/components/AppUpdateNotification.vue";
import NetworkOverlay from "src/components/NetworkOverlay.vue";
import RouteLoadingBar from "src/components/RouteLoadingBar.vue";
import GenericDialog from "src/components/ui/GenericDialog.vue";
import GlobalLoadingOverlay from "src/components/ui/GlobalLoadingOverlay.vue";
import GlobalSnackbar from "src/components/ui/GlobalSnackbar.vue";
import { useAppTheme } from "src/composables/useAppTheme";
import { useAppUpdates } from "src/composables/useAppUpdates";
import { onMounted } from "vue";
import "src/boot/event-handlers";

const { checkForUpdates } = useAppUpdates();
const { loadTheme } = useAppTheme();

onMounted(() => {
    checkForUpdates();
    loadTheme();

    useEventListener(document, "visibilitychange", () => {
        if (document.visibilityState === "visible") {
            checkForUpdates();
        }
    });
});
</script>
