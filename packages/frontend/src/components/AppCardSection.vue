<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    title?: string;
}

const props = defineProps<Props>();
</script>

<template>
    <q-card class="ft-card q-mb-md q-px-sm q-py-sm overflow-hidden" v-bind="$attrs">
        <template v-if="props.title">
            <FTCenteredText>{{ props.title }}</FTCenteredText>
            <q-separator class="q-mb-md" />
        </template>

        <div class="column q-gutter-md overflow-auto q-mt-none q-ml-none">
            <slot />
        </div>
    </q-card>
</template>
