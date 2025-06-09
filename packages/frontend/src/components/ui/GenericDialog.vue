<template>
    <div class="dialog-container">
        <template v-for="dialog in dialogs" :key="dialog.id">
            <v-dialog
                :model-value="getDialogVisibility(dialog.id)"
                :persistent="dialog.persistent ?? false"
                :fullscreen="dialog.fullscreen ?? $vuetify.display.mobile"
                :max-width="dialog.maxWidth"
                transition="dialog-bottom-transition"
                :content-class="`dialog-z-${dialog.id}`"
                @update:model-value="handleDialogVisibility(dialog.id, $event)"
            >
                <v-card>
                    <v-card-title class="d-flex align-center pl-0">
                        <v-btn icon @click="closeDialog(dialog.id)" variant="text">
                            <v-icon size="small">fa fa-arrow-left</v-icon>
                        </v-btn>
                        <span class="text-h6 text-truncate flex-grow-1" :title="dialog.title ?? ''">
                            {{ dialog.title ?? "" }}
                        </span>
                    </v-card-title>

                    <component
                        :is="dialog.component"
                        v-bind="dialog.props ?? {}"
                        @close="closeDialog(dialog.id)"
                    />
                </v-card>
            </v-dialog>
        </template>
    </div>
</template>

<script setup lang="ts">
import { globalDialog } from "src/composables/useDialog";
import { computed, ref, watch } from "vue";

const dialogs = computed(() => globalDialog.dialogs.value);

const dialogVisibilityMap = ref(new Map<string, boolean>());

function getDialogVisibility(dialogId: string): boolean {
    return dialogVisibilityMap.value.get(dialogId) ?? false;
}

function setDialogVisibility(dialogId: string, value: boolean): void {
    dialogVisibilityMap.value.set(dialogId, value);
}

watch(
    dialogs,
    function (newDialogs) {
        newDialogs.forEach((dialog) => {
            if (!dialogVisibilityMap.value.has(dialog.id)) {
                dialogVisibilityMap.value.set(dialog.id, true);
            }
        });

        const currentIds = new Set(newDialogs.map(({ id }) => id));
        dialogVisibilityMap.value.forEach((isVisible, id) => {
            if (!currentIds.has(id) && !isVisible) {
                setTimeout(() => {
                    const updatedMap = new Map(dialogVisibilityMap.value);
                    updatedMap.delete(id);
                    dialogVisibilityMap.value = updatedMap;
                }, 300);
            }
        });
    },
    { immediate: true },
);

function closeDialog(dialogId: string): void {
    // Set to false first to trigger transition
    setDialogVisibility(dialogId, false);
    // Give the dialog time to animate out before removing it
    setTimeout(() => {
        globalDialog.closeDialog(dialogId);
    }, 300);
}

function handleDialogVisibility(dialogId: string, isVisible: boolean): void {
    if (!isVisible) {
        const dialog = dialogs.value.find(({ id }) => id === dialogId);
        if (dialog && !dialog.persistent) {
            closeDialog(dialogId);
        } else {
            // Reset visibility if dialog is persistent
            setDialogVisibility(dialogId, true);
        }
    }
}
</script>
