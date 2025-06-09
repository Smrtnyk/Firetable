<script setup lang="ts">
import type { DrinkCardItem, ServingSize } from "@firetable/types";

import { noNegativeNumber } from "src/helpers/form-rules";
import { useI18n } from "vue-i18n";

interface Emits {
    (event: "update:serving-size", value: ServingSize): void;
    (
        event: "update:special-price",
        value: { field: "amount" | "description" | "label"; value: number | string },
    ): void;
    (event: "update:price", value: number): void;
}

interface Props {
    item: DrinkCardItem;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

function updateServingSize(updates: Partial<ServingSize>): void {
    emit("update:serving-size", {
        ...props.item.servingSize,
        ...updates,
    });
}

function updateSpecialPrice(
    field: "amount" | "description" | "label",
    value: null | number | string,
): void {
    if (value === null) {
        return;
    }
    emit("update:special-price", { field, value });
}
</script>

<template>
    <v-card class="ft-card" style="min-width: 300px">
        <v-card-text>
            <!-- Regular Price -->
            <div class="text-subtitle-2 mb-2">Price</div>
            <v-text-field
                :model-value="item.price"
                type="number"
                density="compact"
                variant="outlined"
                prefix="€"
                :rules="[noNegativeNumber('Value must be positive')]"
                @update:model-value="emit('update:price', Number($event))"
            />

            <v-divider class="my-4" />

            <div class="text-subtitle-2">
                {{ t("PageAdminPropertyDrinkCards.servingSize") }}
            </div>
            <v-row class="mt-2">
                <v-col>
                    <v-text-field
                        :model-value="item.servingSize.amount"
                        type="number"
                        density="compact"
                        variant="outlined"
                        :label="t('PageAdminPropertyDrinkCards.amount')"
                        @update:model-value="updateServingSize({ amount: Number($event) })"
                    />
                </v-col>
                <v-col>
                    <v-select
                        :model-value="item.servingSize.unit"
                        :items="['ml', 'cl', 'bottle']"
                        density="compact"
                        variant="outlined"
                        :label="t('PageAdminPropertyDrinkCards.unit')"
                        @update:model-value="
                            updateServingSize({ unit: $event as 'ml' | 'cl' | 'bottle' })
                        "
                    />
                </v-col>
            </v-row>
            <v-text-field
                :model-value="item.servingSize.displayName"
                :label="t('PageAdminPropertyDrinkCards.displayName')"
                density="compact"
                variant="outlined"
                class="mt-2"
                @update:model-value="updateServingSize({ displayName: $event as string })"
            />

            <v-divider class="my-4" />

            <!-- Special Price -->
            <div class="text-subtitle-2 mb-2">Special Price</div>
            <v-row>
                <v-col cols="12">
                    <v-text-field
                        :model-value="item.specialPrice.amount"
                        type="number"
                        density="compact"
                        variant="outlined"
                        prefix="€"
                        :step="0.5"
                        :min="0"
                        :rules="[
                            (val) =>
                                !val ||
                                val < item.price ||
                                'Special price must be lower than regular price',
                        ]"
                        label="Amount"
                        @update:model-value="updateSpecialPrice('amount', $event)"
                    />
                </v-col>
                <v-col cols="12">
                    <v-combobox
                        :model-value="item.specialPrice.label"
                        :items="['Happy Hour', 'Early Bird', 'Ladies Night']"
                        density="compact"
                        variant="outlined"
                        label="Label"
                        @update:model-value="updateSpecialPrice('label', $event)"
                        clearable
                    />
                </v-col>
                <v-col cols="12">
                    <v-text-field
                        :model-value="item.specialPrice.description"
                        density="compact"
                        variant="outlined"
                        label="Description (e.g. Every day 4-6pm)"
                        @update:model-value="updateSpecialPrice('description', $event)"
                    />
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
