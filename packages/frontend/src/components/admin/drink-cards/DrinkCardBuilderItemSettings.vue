<script setup lang="ts">
import type { DrinkCardItem, ServingSize } from "@firetable/types";
import { useI18n } from "vue-i18n";
import { noNegativeNumber } from "src/helpers/form-rules";

interface Props {
    item: DrinkCardItem;
}

interface Emits {
    (event: "update:serving-size", value: ServingSize): void;
    (
        event: "update:special-price",
        value: { field: "amount" | "description" | "label"; value: number | string },
    ): void;
    (event: "update:price", value: number): void;
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
    value: number | string | null,
): void {
    if (value === null) {
        return;
    }
    emit("update:special-price", { field, value });
}
</script>

<template>
    <q-card class="ft-card" style="min-width: 300px">
        <q-card-section>
            <!-- Regular Price -->
            <div class="text-subtitle2 q-mb-sm">Price</div>
            <q-input
                :model-value="item.price"
                type="number"
                dense
                standout
                prefix="€"
                :rules="[noNegativeNumber('Value must be positive')]"
                @update:model-value="emit('update:price', $event as number)"
            />

            <q-separator class="q-my-md" />

            <div class="text-subtitle2">
                {{ t("PageAdminPropertyDrinkCards.servingSize") }}
            </div>
            <div class="row q-col-gutter-sm q-mt-sm">
                <div class="col">
                    <q-input
                        :model-value="item.servingSize.amount"
                        type="number"
                        dense
                        standout
                        :label="t('PageAdminPropertyDrinkCards.amount')"
                        @update:model-value="updateServingSize({ amount: $event as number })"
                    />
                </div>
                <div class="col">
                    <q-select
                        :model-value="item.servingSize.unit"
                        :options="['ml', 'cl', 'bottle']"
                        dense
                        standout
                        :label="t('PageAdminPropertyDrinkCards.unit')"
                        @update:model-value="updateServingSize({ unit: $event })"
                    />
                </div>
            </div>
            <q-input
                :model-value="item.servingSize.displayName"
                :label="t('PageAdminPropertyDrinkCards.displayName')"
                dense
                standout
                class="q-mt-sm"
                @update:model-value="updateServingSize({ displayName: $event as string })"
            />

            <q-separator class="q-my-md" />

            <div class="text-subtitle2 q-mb-sm">Special Price</div>
            <div class="row q-col-gutter-sm">
                <div class="col-12">
                    <q-input
                        :model-value="item.specialPrice.amount"
                        type="number"
                        dense
                        standout
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
                </div>
                <div class="col-12">
                    <q-select
                        v-model="item.specialPrice.label"
                        :options="['Happy Hour', 'Early Bird', 'Ladies Night']"
                        use-input
                        input-debounce="0"
                        dense
                        standout
                        label="Label"
                        @update:model-value="updateSpecialPrice('label', $event)"
                        clearable
                        :hide-dropdown-icon="false"
                        emit-value
                        map-options
                    />
                </div>
                <div class="col-12">
                    <q-input
                        :model-value="item.specialPrice.description"
                        dense
                        standout
                        label="Description (e.g. Every day 4-6pm)"
                        @update:model-value="updateSpecialPrice('description', $event)"
                    />
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>
