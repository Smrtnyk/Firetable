<script setup lang="ts">
import type { DrinkCardSection } from "@firetable/types";
import { DrinkMainCategory } from "@firetable/types";
import { noEmptyString } from "src/helpers/form-rules";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";

const { t } = useI18n();
const emit = defineEmits<(event: "add", value: DrinkCardSection) => void>();

// @ts-expect-error -- works in ts
const categoryOptions = Object.values(DrinkMainCategory);

const customSection = ref({
    name: "",
    category: "" as DrinkMainCategory,
    servingSize: {
        amount: 0,
        unit: "ml" as const,
        displayName: "",
    },
});

function handleCustomSectionSubmit(): void {
    if (!customSection.value.name || !customSection.value.category) {
        showErrorMessage(t("Global.fillRequiredFields"));
        return;
    }

    const newSection: DrinkCardSection = {
        id: crypto.randomUUID(),
        name: customSection.value.name,
        category: customSection.value.category,
        template: "custom",
        type: "section",
        items: [],
    };
    emit("add", newSection);
}
</script>

<template>
    <div>
        <q-card-section class="q-gutter-y-md">
            <q-input
                v-model="customSection.name"
                :label="t('PageAdminPropertyDrinkCards.sectionNameLabel')"
                standout
                rounded
                :rules="[noEmptyString('Name is required')]"
            />

            <q-select
                v-model="customSection.category"
                :options="categoryOptions"
                :label="t('PageAdminPropertyDrinkCards.categoryLabel')"
                standout
                rounded
                :rules="[noEmptyString('Category is required')]"
            />

            <div class="text-caption">
                {{ t("PageAdminPropertyDrinkCards.servingSizeOptional") }}
            </div>
            <div class="row q-col-gutter-sm">
                <div class="col">
                    <q-input
                        v-model.number="customSection.servingSize.amount"
                        type="number"
                        :label="t('PageAdminPropertyDrinkCards.amount')"
                        standout
                        rounded
                    />
                </div>
                <div class="col">
                    <q-select
                        v-model="customSection.servingSize.unit"
                        :options="['ml', 'cl', 'bottle']"
                        :label="t('PageAdminPropertyDrinkCards.unit')"
                        standout
                        rounded
                    />
                </div>
            </div>
            <q-input
                v-model="customSection.servingSize.displayName"
                :label="t('PageAdminPropertyDrinkCards.displayName')"
                standout
                rounded
            />
        </q-card-section>

        <q-card-actions align="right">
            <q-btn flat :label="t('Global.cancel')" v-close-popup />
            <q-btn
                rounded
                class="button-gradient"
                :label="t('Global.submit')"
                @click="handleCustomSectionSubmit"
            />
        </q-card-actions>
    </div>
</template>

<style scoped lang="scss"></style>
