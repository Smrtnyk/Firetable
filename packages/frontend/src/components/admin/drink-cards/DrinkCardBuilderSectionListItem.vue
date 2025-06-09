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
    <v-card variant="outlined" class="ft-card">
        <v-list-item class="pa-2">
            <template #prepend>
                <div class="d-flex align-center pl-2 pr-4">
                    <v-icon icon="fas fa-bars" class="cursor-move" />
                </div>
            </template>

            <v-list-item-title class="font-weight-medium">
                {{ formattedName }}
            </v-list-item-title>

            <template #append>
                <div class="d-flex align-center" style="gap: 12px">
                    <div class="text-right">
                        <div class="font-weight-medium">{{ formatPrice(item.price) }}</div>
                        <div v-if="item.specialPrice?.amount" class="text-caption text-grey">
                            {{ formatPrice(item.specialPrice.amount) }}
                        </div>
                    </div>

                    <v-menu location="bottom end" :close-on-content-click="false">
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                variant="text"
                                icon="fas fa-ellipsis-v"
                                size="small"
                            ></v-btn>
                        </template>
                        <DrinkCardBuilderItemSettings
                            :item="item"
                            @update:serving-size="emit('update:serving-size', $event)"
                            @update:special-price="emit('update:special-price', $event)"
                            @update:price="emit('update:price', $event)"
                        />
                    </v-menu>

                    <v-btn
                        variant="text"
                        :color="item.isVisible ? 'primary' : 'grey'"
                        :icon="item.isVisible ? 'fas fa-eye' : 'fas fa-eye-slash'"
                        size="small"
                        @click="emit('toggle-visibility')"
                    />

                    <v-btn
                        variant="text"
                        color="error"
                        icon="fas fa-trash-alt"
                        size="small"
                        @click="emit('remove')"
                    />
                </div>
            </template>
        </v-list-item>
    </v-card>
</template>
