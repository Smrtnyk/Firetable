<script setup lang="ts">
import type { DrinkBundle, DrinkCardItem, DrinkCardSection } from "@firetable/types";

import { globalDialog } from "src/composables/useDialog";
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

function showBundleDialog(bundleToEdit?: DrinkBundle): void {
    const dialog = globalDialog.openDialog(
        DrinkBundleDialog,
        {
            availableItems: props.availableItems,
            bundleToEdit,
            onSubmit(bundle: DrinkBundle) {
                emit("add-bundle", bundle);
                globalDialog.closeDialog(dialog);
            },
            onUpdate(updatedBundle: DrinkBundle) {
                emit("update-bundle", updatedBundle);
                globalDialog.closeDialog(dialog);
            },
        },
        {
            title: bundleToEdit
                ? t("DrinkCardBuilderAddDragElementsDropdown.editBundleDialogTitle")
                : t("DrinkCardBuilderAddDragElementsDropdown.createBundleDialogTitle"),
        },
    );
}

function showCustomSectionDialog(): void {
    const dialog = globalDialog.openDialog(
        DrinkCardBuilderCustomSectionDialog,
        {
            onAdd(section: DrinkCardSection) {
                emit("add-section", section);
                globalDialog.closeDialog(dialog);
            },
        },
        {
            title: t("PageAdminPropertyDrinkCards.addSection"),
        },
    );
}

defineExpose({ showBundleDialog });
</script>

<template>
    <v-menu location="bottom end">
        <template #activator="{ props }">
            <v-btn
                v-bind="props"
                rounded="lg"
                color="primary"
                icon="fas fa-plus"
                class="button-gradient"
            ></v-btn>
        </template>

        <v-list>
            <v-list-item @click="$emit('add-header')">
                <v-list-item-title>{{
                    t("DrinkCardBuilderAddDragElementsDropdown.addHeaderLabel")
                }}</v-list-item-title>
            </v-list-item>

            <v-list-item @click="$emit('add-header-end')">
                <v-list-item-title>{{
                    t("DrinkCardBuilderAddDragElementsDropdown.addHeaderEndLabel")
                }}</v-list-item-title>
            </v-list-item>

            <v-list-item @click="showBundleDialog()">
                <v-list-item-title>{{
                    t("DrinkCardBuilderAddDragElementsDropdown.addBundleLabel")
                }}</v-list-item-title>
            </v-list-item>

            <v-list-item @click="showCustomSectionDialog">
                <v-list-item-title>
                    {{ t("PageAdminPropertyDrinkCards.addSection") }}
                </v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>
