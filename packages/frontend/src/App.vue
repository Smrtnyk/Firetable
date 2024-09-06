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

const q = useQuasar();

q.iconMapFn = function (iconName) {
    return { icon: myIcons[iconName] };
};
q.dark.set(getDarkMode());
</script>
