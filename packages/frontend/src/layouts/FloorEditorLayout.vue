<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import GenericDialog from "src/components/ui/GenericDialog.vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isDrawerVisible = ref(false);
</script>

<template>
    <v-layout class="rounded rounded-md">
        <AppTopMenu @toggle-drawer="isDrawerVisible = !isDrawerVisible" />
        <AppDrawer v-model="isDrawerVisible" />
        <GenericDialog />
        <v-main style="min-height: 100vh">
            <div class="d-flex flex-column" style="height: 100%">
                <router-view :key="route.fullPath" v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" class="flex-grow-1" />
                    </transition>
                </router-view>
            </div>
        </v-main>
    </v-layout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
