<template>
    <q-dialog position="bottom" ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
        <q-card class="ft-card item-selection-bottom-dialog q-pa-md">
            <div class="row justify-center q-mb-md">
                <button
                    class="dialog-pill cursor-pointer"
                    :aria-label="t('FTBottomDialog.closeBottomDialogAriaLabel')"
                    @click="onDialogHide"
                />
            </div>

            <component v-bind="componentPropsObject" v-on="listeners" :is="component" />
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";

import { useDialogPluginComponent } from "quasar";
import { useI18n } from "vue-i18n";

interface Props {
    component: ComponentPublicInstance;
    componentPropsObject?: Record<string, any>;
    listeners: Record<string, (...args: any) => any>;
}

const { component, componentPropsObject, listeners } = defineProps<Props>();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { t } = useI18n();

defineEmits(useDialogPluginComponent.emits);
</script>

<style lang="scss" scoped>
.dialog-pill {
    width: 36px;
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
        background-color: #bdbdbd;
    }
}

.item-selection-bottom-dialog {
    width: 100%;
}
</style>
