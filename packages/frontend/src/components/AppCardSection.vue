<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    title?: string;
}

const props = defineProps<Props>();
</script>

<template>
    <q-card class="ft-card q-mb-md q-pt-none q-px-md q-pb-md overflow-hidden">
        <template v-if="props.title">
            <FTCenteredText>{{ props.title }}</FTCenteredText>
            <q-separator class="q-mb-md" />
        </template>

        <div class="column q-col-gutter-md overflow-auto">
            <slot />
        </div>
    </q-card>
</template>
