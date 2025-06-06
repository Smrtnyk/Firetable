<script setup lang="ts">
import type { DrinkBundle, DrinkCardItem, DrinkCardSection } from "@firetable/types";

import FTDialog from "src/components/FTDialog.vue";
import { useDialog } from "src/composables/useDialog";
import { useI18n } from "vue-i18n";

import DrinkBundleDialog from "./DrinkBundleDialog.vue";
import DrinkCardBuilderCustomSectionDialog from "./DrinkCardBuilderCustomSectionDialog.vue";

interface Emits {
    (event: "add-header" | "add-header-end"): void;
    (event: "add-bundle" | "update-bundle", bundle: DrinkBundle): void;
    (event: "add-section", section: DrinkCardSection): void;
}

interface Props {
    availableItems: DrinkCardItem[];
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
            componentPropsObject: {
                availableItems: props.availableItems,
                bundleToEdit,
            },
            listeners: {
                submit(bundle: DrinkBundle) {
                    emit("add-bundle", bundle);
                    dialog.hide();
                },
                update(updatedBundle: DrinkBundle) {
                    emit("update-bundle", updatedBundle);
                    dialog.hide();
                },
            },
            title: bundleToEdit ? t('DrinkCardBuilderAddDragElementsDropdown.editBundleDialogTitle') : t('DrinkCardBuilderAddDragElementsDropdown.createBundleDialogTitle'),
        },
    });
}

function showCustomSectionDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: DrinkCardBuilderCustomSectionDialog,
            listeners: {
                add(section: DrinkCardSection) {
                    emit("add-section", section);
                    dialog.hide();
                },
            },
            title: t("PageAdminPropertyDrinkCards.addSection"),
        },
    });
}

defineExpose({ showBundleDialog });
</script>

<template>
    <q-btn-dropdown flat rounded color="primary" icon="fa fa-plus" class="button-gradient">
        <q-list>
            <q-item clickable v-close-popup @click="$emit('add-header')">
                <q-item-section>{{ t('DrinkCardBuilderAddDragElementsDropdown.addHeaderLabel') }}</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$emit('add-header-end')">
                <q-item-section>{{ t('DrinkCardBuilderAddDragElementsDropdown.addHeaderEndLabel') }}</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showBundleDialog()">
                <q-item-section>{{ t('DrinkCardBuilderAddDragElementsDropdown.addBundleLabel') }}</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showCustomSectionDialog">
                <q-item-section>
                    {{ t("PageAdminPropertyDrinkCards.addSection") }}
                </q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>
