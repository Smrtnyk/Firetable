<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import { useAuthStore } from "src/stores/auth-store";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const isDrawerVisible = ref(false);
</script>

<template>
    <v-app v-if="isLoggedIn">
        <AppDrawer v-model="isDrawerVisible" />
        <AppTopMenu @toggle-drawer="isDrawerVisible = !isDrawerVisible" />
        <v-main>
            <v-container class="MainLayout__container fill-height pa-2">
                <router-view :key="route.fullPath" v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </v-container>
        </v-main>
    </v-app>
    <router-view v-else />
</template>

<style lang="scss" scoped>
.MainLayout {
    &__container {
        display: block;
    }
}
</style>
