<template>
    <q-dialog ref="dialogRef" :maximized="maximized || isMobile" persistent @hide="onDialogHide">
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
                        icon="fa fa-close"
                        @click="onDialogHide"
                        :aria-label="t('FTDialog.closeDialogAriaLabel')"
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
import { useI18n } from "vue-i18n";

interface Props {
    component: ComponentPublicInstance;
    componentPropsObject?: Record<string, any>;
    listeners: Record<string, (...args: any) => any>;
    maximized?: boolean;
    title?: string;
}

const {
    component,
    componentPropsObject,
    listeners,
    maximized = true,
    title = "",
} = defineProps<Props>();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { t } = useI18n();

defineEmits(useDialogPluginComponent.emits);
</script>
