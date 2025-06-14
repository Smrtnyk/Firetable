<script setup lang="ts">
import type { DrinkCardItem, ServingSize } from "@firetable/types";

import { formatPrice } from "src/helpers/drink-card/drink-card";

import DrinkCardBuilderItemSettings from "./DrinkCardBuilderItemSettings.vue";

interface Emits {
    (event: "update:price", value: number): void;
    (event: "update:serving-size", value: ServingSize): void;
    (
        event: "update:special-price",
        updates: { field: "amount" | "description" | "label"; value: number | string },
    ): void;
    (event: "remove" | "toggle-visibility"): void;
}

interface Props {
    formattedName: string;
    item: DrinkCardItem;
}

const { formattedName, item } = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
    <q-item class="ft-card">
        <q-item-section avatar class="q-ml-lg">
            <q-icon name="fa fa-bars" class="cursor-move" />
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
                :icon="item.isVisible ? 'fa fa-eye' : 'fa fa-eye-slash'"
                size="sm"
                @click="emit('toggle-visibility')"
            />
        </q-item-section>

        <q-item-section side>
            <q-btn
                flat
                round
                color="negative"
                icon="fa fa-trash"
                size="sm"
                @click="emit('remove')"
            />
        </q-item-section>
    </q-item>
</template>
