<script setup lang="ts">
import AppDrawer from "src/components/AppDrawer.vue";
import AppTopMenu from "src/components/AppTopMenu.vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isDrawerVisible = ref(false);
</script>

<template>
    <v-app>
        <AppDrawer v-model="isDrawerVisible" />
        <AppTopMenu @toggle-drawer="isDrawerVisible = !isDrawerVisible" />
        <v-main>
            <v-container class="FloorEditorLayout__container fill-height pa-0" fluid>
                <router-view :key="route.fullPath" v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </v-container>
        </v-main>
    </v-app>
</template>

<style lang="scss" scoped>
.FloorEditorLayout {
    &__container {
        display: block;
    }
}
</style>
