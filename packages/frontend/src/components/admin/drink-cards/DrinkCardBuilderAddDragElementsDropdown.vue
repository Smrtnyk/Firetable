<script setup lang="ts">
import type { DrinkBundle, DrinkCardSection, DrinkCardItem } from "@firetable/types";
import DrinkBundleDialog from "./DrinkBundleDialog.vue";
import DrinkCardBuilderCustomSectionDialog from "./DrinkCardBuilderCustomSectionDialog.vue";
import { useI18n } from "vue-i18n";
import { useDialog } from "src/composables/useDialog";
import FTDialog from "src/components/FTDialog.vue";

interface Props {
    availableItems: DrinkCardItem[];
}

interface Emits {
    (event: "add-header-end" | "add-header"): void;
    (event: "add-bundle" | "update-bundle", bundle: DrinkBundle): void;
    (event: "add-section", section: DrinkCardSection): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();
const { createDialog } = useDialog();

function showBundleDialog(bundleToEdit?: DrinkBundle): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: DrinkBundleDialog,
            title: bundleToEdit ? "Edit Bundle" : "Create Bundle",
            componentPropsObject: {
                availableItems: props.availableItems,
                bundleToEdit,
            },
            listeners: {
                update(updatedBundle: DrinkBundle) {
                    emit("update-bundle", updatedBundle);
                    dialog.hide();
                },
                submit(bundle: DrinkBundle) {
                    emit("add-bundle", bundle);
                    dialog.hide();
                },
            },
        },
    });
}

function showCustomSectionDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: DrinkCardBuilderCustomSectionDialog,
            title: t("PageAdminPropertyDrinkCards.addSection"),
            listeners: {
                add(section: DrinkCardSection) {
                    emit("add-section", section);
                    dialog.hide();
                },
            },
        },
    });
}

defineExpose({ showBundleDialog });
</script>

<template>
    <q-btn-dropdown flat rounded color="primary" icon="plus" class="button-gradient">
        <q-list>
            <q-item clickable v-close-popup @click="$emit('add-header')">
                <q-item-section>Add Header</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$emit('add-header-end')">
                <q-item-section>Add Header End</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showBundleDialog()">
                <q-item-section>Add Bundle</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showCustomSectionDialog">
                <q-item-section>
                    {{ t("PageAdminPropertyDrinkCards.addSection") }}
                </q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>
