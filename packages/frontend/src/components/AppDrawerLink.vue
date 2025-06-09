<script setup lang="ts">
import type { Link } from "src/types";

interface Props {
    isChild?: boolean;
    link: Link;
}

const props = defineProps<Props>();
</script>

<template>
    <v-list-item
        :to="props.link.route"
        :prepend-icon="props.link.icon"
        :title="props.link.label"
        :aria-label="props.link.label"
        :class="{ 'ml-4': props.isChild }"
        link
    >
    </v-list-item>
</template>
