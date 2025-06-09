<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    title?: string;
}

const props = defineProps<Props>();
</script>

<template>
    <v-card class="ft-card mb-4 px-2 py-2 overflow-hidden" v-bind="$attrs">
        <template v-if="props.title">
            <FTCenteredText>{{ props.title }}</FTCenteredText>
            <v-divider class="mb-4" />
        </template>

        <div class="d-flex flex-column overflow-auto mt-0 ml-0">
            <slot />
        </div>
    </v-card>
</template>
