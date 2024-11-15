<script setup lang="ts">
import type { DrinkBundle, DrinkCardSection, DrinkCardItem } from "@firetable/types";
import type { SectionTemplate } from "./section-templates";
import DrinkBundleDialog from "./DrinkBundleDialog.vue";
import DrinkCardBuilderCustomSectionDialog from "./DrinkCardBuilderCustomSectionDialog.vue";
import { useI18n } from "vue-i18n";
import { useDialog } from "src/composables/useDialog";
import FTDialog from "src/components/FTDialog.vue";

interface Props {
    sectionTemplates: SectionTemplate[];
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

function addTemplateSection(template: SectionTemplate): void {
    const newSection: DrinkCardSection = {
        id: crypto.randomUUID(),
        name: template.name,
        type: "section",
        category: template.category,
        template: template.id,
        items: [],
    };
    emit("add-section", newSection);
}

function showCustomSectionDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: DrinkCardBuilderCustomSectionDialog,
            title: t("PageAdminPropertyDrinkCards.createCustomSection"),
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
            <q-separator />

            <q-item-label header>{{
                t("PageAdminPropertyDrinkCards.predefinedSections")
            }}</q-item-label>
            <q-item
                v-for="template in sectionTemplates"
                :key="template.id"
                clickable
                v-close-popup
                @click="addTemplateSection(template)"
            >
                <q-item-section>{{ template.name }}</q-item-section>
            </q-item>

            <q-separator />
            <q-item-label header>{{ t("PageAdminPropertyDrinkCards.customSection") }}</q-item-label>
            <q-item clickable v-close-popup @click="showCustomSectionDialog">
                <q-item-section>
                    {{ t("PageAdminPropertyDrinkCards.createCustomSection") }}
                </q-item-section>
                <q-item-section side>
                    <q-icon name="add" />
                </q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>
