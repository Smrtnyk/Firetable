<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import NetworkOverlay from "src/components/NetworkOverlay.vue";

import { useAuthStore } from "src/stores/auth-store";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const isDrawerVisible = ref(false);
</script>

<template>
    <q-layout v-if="isLoggedIn" view="hHh lpR fFf">
        <NetworkOverlay />
        <AppDrawer v-model="isDrawerVisible" />
        <AppTopMenu @toggle-drawer="isDrawerVisible = !isDrawerVisible" />
        <q-page-container>
            <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md row">
                <router-view
                    :key="route.fullPath"
                    v-slot="{ Component }"
                    class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3"
                >
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </q-page>
        </q-page-container>
    </q-layout>
</template>
