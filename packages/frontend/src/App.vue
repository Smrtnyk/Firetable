<template>
    <router-view v-slot="{ Component }">
        <transition name="fade">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import { getDarkMode } from "src/config";

const quasar = useQuasar();

quasar.dark.set(getDarkMode());
</script>
