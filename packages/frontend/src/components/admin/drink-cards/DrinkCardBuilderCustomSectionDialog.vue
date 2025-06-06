<script setup lang="ts">
import type { DrinkCardSection } from "@firetable/types";

import { noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits<(event: "add", value: DrinkCardSection) => void>();

const drinkSection = ref({
    name: "",
    servingSize: {
        amount: 0,
        displayName: "",
        unit: "ml" as const,
    },
});

function handleCustomSectionSubmit(): void {
    if (!drinkSection.value.name) {
        showErrorMessage(t("Global.fillRequiredFields"));
        return;
    }

    const newSection: DrinkCardSection = {
        id: crypto.randomUUID(),
        items: [],
        name: drinkSection.value.name,
        template: "custom",
        type: "section",
    };
    emit("add", newSection);
}
</script>

<template>
    <div>
        <q-card-section class="q-gutter-y-md">
            <q-input
                v-model="drinkSection.name"
                :label="t('PageAdminPropertyDrinkCards.sectionNameLabel')"
                standout
                rounded
                :rules="[noEmptyString(t('DrinkCardBuilderCustomSectionDialog.nameIsRequiredError'))]"
            />

            <div class="text-caption">
                {{ t("PageAdminPropertyDrinkCards.servingSizeOptional") }}
            </div>
            <div class="row q-col-gutter-sm">
                <div class="col">
                    <q-input
                        v-model.number="drinkSection.servingSize.amount"
                        type="number"
                        :label="t('PageAdminPropertyDrinkCards.amount')"
                        standout
                        rounded
                    />
                </div>
                <div class="col">
                    <q-select
                        v-model="drinkSection.servingSize.unit"
                        :options="['ml', 'cl', 'bottle']"
                        :label="t('PageAdminPropertyDrinkCards.unit')"
                        standout
                        rounded
                    />
                </div>
            </div>
            <q-input
                v-model="drinkSection.servingSize.displayName"
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
