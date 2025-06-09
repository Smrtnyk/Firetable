<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import NetworkOverlay from "src/components/NetworkOverlay.vue";
import GenericDialog from "src/components/ui/GenericDialog.vue";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const globalStore = useGlobalStore();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const isDrawerVisible = ref(false);
</script>

<template>
    <v-app v-if="isLoggedIn">
        <v-progress-linear
            v-if="globalStore.globalLoading"
            indeterminate
            color="primary"
            style="z-index: 9999; position: fixed; top: 0; left: 0; right: 0; width: 100%"
        />
        <GenericDialog />
        <NetworkOverlay />
        <AppDrawer v-model="isDrawerVisible" />
        <AppTopMenu @toggle-drawer="isDrawerVisible = !isDrawerVisible" />
        <v-main>
            <v-container class="pa-0 pa-sm-1">
                <router-view :key="route.fullPath" v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </v-container>
        </v-main>
    </v-app>
</template>
