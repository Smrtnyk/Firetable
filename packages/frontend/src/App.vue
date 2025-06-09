<template>
    <router-view v-slot="{ Component }">
        <transition name="fade">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script setup lang="ts">
import { useAppTheme } from "src/composables/useAppTheme";
import { onMounted } from "vue";

const { loadTheme } = useAppTheme();

onMounted(() => {
    loadTheme();
});
</script>
