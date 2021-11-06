<script setup lang="ts">
import { computed, ref } from "vue";

import AppDrawer from "src/components/AppDrawer/AppDrawer";
import { AppTopMenu } from "src/components/AppTopMenu";
import { useAuthStore } from "src/stores/auth-store";

const authStore = useAuthStore();
const isDrawerOpen = ref(false);
const isLoggedIn = computed(() => authStore.isLoggedIn);
const isAdmin = computed(() => authStore.isAdmin);

function onDrawerToggle() {
    isDrawerOpen.value = !isDrawerOpen.value;
}
</script>

<template>
    <q-layout v-if="isLoggedIn" view="hHh lpR fFf">
        <q-drawer v-model="isDrawerOpen" class="Drawer" show-if-above bordered side="right">
            <app-drawer :show-admin-links="isAdmin" />
        </q-drawer>
        <q-page-container>
            <q-page
                class="
                    q-pa-xs-xs q-pa-sm-sm q-pa-md-md
                    fit
                    row
                    wrap
                    justify-start
                    items-start
                    content-start
                "
            >
                <router-view
                    v-slot="{ Component }"
                    style="padding-bottom: 51px"
                    class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3"
                >
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </q-page>

            <AppTopMenu @toggle="onDrawerToggle" />
        </q-page-container>
    </q-layout>
</template>
