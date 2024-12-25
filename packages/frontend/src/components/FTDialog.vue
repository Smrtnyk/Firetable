<template>
    <q-dialog ref="dialogRef" :maximized="maximized || isMobile" persistent>
        <q-card
            class="q-pt-none ft-card"
            :class="{
                'limited-width': !maximized,
            }"
        >
            <q-banner inline-actions>
                <template #action>
                    <q-btn
                        round
                        flat
                        icon="close"
                        @click="onDialogHide"
                        aria-label="Close dialog"
                    />
                </template>
                <h6 class="text-h6 q-ma-none q-ml-sm" v-if="title">{{ title }}</h6>
            </q-banner>
            <q-separator dark inset />
            <div class="q-pa-sm">
                <component v-bind="componentPropsObject" v-on="listeners" :is="component" />
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { useDialogPluginComponent } from "quasar";
import { isMobile } from "src/global-reactives/screen-detection";

interface Props {
    component: ComponentPublicInstance;
    maximized?: boolean;
    componentPropsObject?: Record<string, any>;
    listeners: Record<string, (...args: any) => any>;
    title?: string;
}

const {
    maximized = true,
    title = "",
    component,
    listeners,
    componentPropsObject,
} = defineProps<Props>();
const { dialogRef, onDialogHide } = useDialogPluginComponent();

defineEmits(useDialogPluginComponent.emits);
</script>
