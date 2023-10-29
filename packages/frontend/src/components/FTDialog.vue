<template>
    <q-dialog ref="dialogRef" :maximized="props.maximized || isMobile" persistent>
        <q-card
            class="q-pt-none"
            :class="{
                'limited-width': !props.maximized,
            }"
        >
            <q-banner inline-actions class="shadow-light">
                <template #action>
                    <q-btn round flat icon="close" @click="onDialogOK" />
                </template>
                <h6 class="text-h6 q-ma-none q-ml-sm" v-if="props.title">{{ props.title }}</h6>
            </q-banner>
            <q-separator dark inset />
            <div class="q-pa-sm">
                <component
                    v-bind="props.componentPropsObject"
                    v-on="props.listeners"
                    :is="props.component"
                />
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import { ComponentPublicInstance } from "vue";
import { isMobile } from "src/global-reactives/is-mobile";

interface Props {
    component: ComponentPublicInstance;
    maximized?: boolean;
    componentPropsObject: Record<string, any>;
    listeners: Record<string, (...args: any) => any>;
    title?: string;
}

const props = withDefaults(defineProps<Props>(), {
    maximized: true,
    title: "",
});
const { dialogRef, onDialogOK } = useDialogPluginComponent();

defineEmits(useDialogPluginComponent.emits);
</script>
