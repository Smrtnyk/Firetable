<template>
    <router-view v-slot="{ Component }">
        <transition name="fade">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import { getDarkMode, myIcons } from "src/config";

const quasar = useQuasar();

quasar.iconMapFn = function (iconName) {
    return { icon: myIcons[iconName] };
};
quasar.dark.set(getDarkMode());
</script>
