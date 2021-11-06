<template>
    <q-dialog ref="dialogRef" :maximized="props.maximized" persistent>
        <q-card
            class="q-pt-none"
            :class="{
                'limited-width': !props.maximized,
            }"
        >
            <q-banner inline-actions class="shadow-light no-padding">
                <template #action>
                    <q-btn round flat icon="close" @click="onDialogOK" />
                </template>
            </q-banner>
            <div class="q-pa-sm">
                <component v-bind="props.componentPropsObject" :is="props.component" />
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { ComponentPublicInstance } from "vue";

interface Props {
    component: ComponentPublicInstance;
    maximized?: boolean;
    componentPropsObject: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
    maximized: true,
});
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
// eslint-disable-next-line vue/valid-define-emits
defineEmits(useDialogPluginComponent.emits);
</script>
