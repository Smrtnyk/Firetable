<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import NetworkOverlay from "src/components/NetworkOverlay.vue";

import { useAuthStore } from "src/stores/auth-store";
import { storeToRefs } from "pinia";

const { isLoggedIn } = storeToRefs(useAuthStore());
</script>

<template>
    <q-layout v-if="isLoggedIn" view="hHh lpR fFf">
        <NetworkOverlay />
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
