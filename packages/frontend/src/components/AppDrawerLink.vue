<script setup lang="ts">
import type { Link } from "src/types";

interface Props {
    link: Link;
}

const { link } = defineProps<Props>();
</script>

<template>
    <q-item :to="link.route" clickable>
        <q-item-section avatar>
            <q-icon :name="link.icon" />
        </q-item-section>
        <q-item-section>{{ link.label }}</q-item-section>
    </q-item>
</template>
