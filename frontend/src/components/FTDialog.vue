<template>
    <q-dialog ref="dialogRef" :maximized="props.maximized">
        <q-card
            class="q-pa-md"
            :class="{
                'limited-width': !props.maximized,
            }"
        >
            <component v-bind="props.componentPropsObject" :is="props.component" />
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
