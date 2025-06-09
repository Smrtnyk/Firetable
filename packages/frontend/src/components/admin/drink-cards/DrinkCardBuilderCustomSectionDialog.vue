<script setup lang="ts">
import type { DrinkCardSection } from "@firetable/types";

import { noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits<(event: "add" | "close", value?: DrinkCardSection) => void>();

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
        <v-card-text>
            <v-text-field
                v-model="drinkSection.name"
                :label="t('PageAdminPropertyDrinkCards.sectionNameLabel')"
                variant="outlined"
                :rules="[
                    noEmptyString(t('DrinkCardBuilderCustomSectionDialog.nameIsRequiredError')),
                ]"
                class="mb-4"
            />

            <div class="text-caption">
                {{ t("PageAdminPropertyDrinkCards.servingSizeOptional") }}
            </div>
            <v-row class="mt-1">
                <v-col>
                    <v-text-field
                        v-model.number="drinkSection.servingSize.amount"
                        type="number"
                        :label="t('PageAdminPropertyDrinkCards.amount')"
                        variant="outlined"
                    />
                </v-col>
                <v-col>
                    <v-select
                        v-model="drinkSection.servingSize.unit"
                        :items="['ml', 'cl', 'bottle']"
                        :label="t('PageAdminPropertyDrinkCards.unit')"
                        variant="outlined"
                    />
                </v-col>
            </v-row>
            <v-text-field
                v-model="drinkSection.servingSize.displayName"
                :label="t('PageAdminPropertyDrinkCards.displayName')"
                variant="outlined"
            />
        </v-card-text>

        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="$emit('close')">{{ t("Global.cancel") }}</v-btn>
            <v-btn
                flat
                rounded="lg"
                color="primary"
                variant="tonal"
                @click="handleCustomSectionSubmit"
            >
                {{ t("Global.submit") }}
            </v-btn>
        </v-card-actions>
    </div>
</template>
