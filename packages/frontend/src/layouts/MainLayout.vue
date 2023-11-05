<script setup lang="ts">
import { computed } from "vue";

import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import { useAuthStore } from "src/stores/auth-store";

const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
</script>

<template>
    <q-layout v-if="isLoggedIn" view="hHh lpR fFf">
        <AppDrawer />
        <AppTopMenu />
        <q-page-container>
            <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md row">
                <router-view
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
