<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isDrawerVisible = ref(false);
</script>

<template>
    <q-layout view="hHh lpR fFf">
        <AppDrawer v-model="isDrawerVisible" />
        <AppTopMenu @toggle-drawer="isDrawerVisible = !isDrawerVisible" />
        <q-page-container>
            <q-page class="row">
                <router-view :key="route.fullPath" v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </q-page>
        </q-page-container>
    </q-layout>
</template>
