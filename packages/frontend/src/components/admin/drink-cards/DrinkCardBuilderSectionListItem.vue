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
    <v-card class="ft-card">
        <v-card-text class="pa-3">
            <div class="d-flex align-center ga-3">
                <!-- Drag Handle -->
                <v-icon class="cursor-move ml-4">fas fa-bars</v-icon>

                <!-- Item Name -->
                <div class="flex-grow-1">
                    {{ formattedName }}
                </div>

                <!-- Settings Menu -->
                <v-menu>
                    <template #activator="{ props }">
                        <v-btn variant="text" color="primary" density="compact" v-bind="props">
                            <v-icon>fas fa-cog</v-icon>
                        </v-btn>
                    </template>
                    <v-card>
                        <DrinkCardBuilderItemSettings
                            :item="item"
                            @update:serving-size="emit('update:serving-size', $event)"
                            @update:special-price="emit('update:special-price', $event)"
                            @update:price="emit('update:price', $event)"
                        />
                    </v-card>
                </v-menu>

                <!-- Price Display -->
                <div class="text-right">
                    <div class="font-weight-medium">{{ formatPrice(item.price) }}</div>
                    <div v-if="item.specialPrice?.amount" class="text-caption text-grey">
                        {{ formatPrice(item.specialPrice.amount) }}
                    </div>
                </div>

                <!-- Visibility Toggle -->
                <v-btn
                    variant="text"
                    icon
                    :color="item.isVisible ? 'primary' : 'grey'"
                    size="small"
                    @click="emit('toggle-visibility')"
                >
                    <v-icon>{{ item.isVisible ? "fas fa-eye" : "fas fa-eye-slash" }}</v-icon>
                </v-btn>

                <!-- Remove Button -->
                <v-btn variant="text" icon color="error" size="small" @click="emit('remove')">
                    <v-icon>fas fa-trash</v-icon>
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.cursor-move {
    cursor: move;
}
</style>
