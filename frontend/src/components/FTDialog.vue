<template>
    <q-dialog ref="dialogRef" maximized>
        <q-card class="q-pa-md">
            <component v-bind="props.componentPropsObject" :is="props.component" />
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { ref, ComponentPublicInstance } from "vue";

interface Props {
    component: ComponentPublicInstance;
    componentPropsObject: Record<string, any>;
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
// eslint-disable-next-line no-undef
defineEmits(useDialogPluginComponent.emits);
</script>
