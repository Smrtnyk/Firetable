<script setup lang="ts">
import type { DrinkCardItem, ServingSize } from "@firetable/types";
import DrinkCardBuilderItemSettings from "./DrinkCardBuilderItemSettings.vue";
import { formatPrice } from "src/helpers/drink-card/drink-card";

interface Props {
    item: DrinkCardItem;
    formattedName: string;
}

interface Emits {
    (event: "update:price", value: number): void;
    (event: "update:serving-size", value: ServingSize): void;
    (
        event: "update:special-price",
        updates: { field: "amount" | "description" | "label"; value: number | string },
    ): void;
    (event: "remove" | "toggle-visibility"): void;
}

const { item, formattedName } = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
    <q-item class="ft-border ft-card">
        <q-item-section avatar class="q-ml-lg">
            <q-icon name="drag" class="cursor-move" />
        </q-item-section>

        <q-item-section>
            {{ formattedName }}
        </q-item-section>

        <q-item-section side>
            <q-btn-dropdown flat dense color="primary">
                <template #default>
                    <DrinkCardBuilderItemSettings
                        :item="item"
                        @update:serving-size="emit('update:serving-size', $event)"
                        @update:special-price="emit('update:special-price', $event)"
                        @update:price="emit('update:price', $event)"
                    />
                </template>
            </q-btn-dropdown>
        </q-item-section>

        <q-item-section side>
            <div class="text-weight-medium">{{ formatPrice(item.price) }}</div>
            <div v-if="item.specialPrice?.amount" class="text-caption text-grey">
                {{ formatPrice(item.specialPrice.amount) }}
            </div>
        </q-item-section>

        <q-item-section side>
            <q-btn
                flat
                round
                :color="item.isVisible ? 'primary' : 'grey'"
                :icon="item.isVisible ? 'eye-open' : 'eye-closed'"
                size="sm"
                @click="emit('toggle-visibility')"
            />
        </q-item-section>

        <q-item-section side>
            <q-btn flat round color="negative" icon="trash" size="sm" @click="emit('remove')" />
        </q-item-section>
    </q-item>
</template>
