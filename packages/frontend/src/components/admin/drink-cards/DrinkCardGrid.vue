<script setup lang="ts">
import type { DrinkCardDoc } from "@firetable/types";

import { isCustomDrinkCard } from "@firetable/types";
import { useI18n } from "vue-i18n";

type Emits = (event: "delete" | "edit", card: DrinkCardDoc) => void;

interface Props {
    cards: DrinkCardDoc[];
    loading?: boolean;
}

const { cards, loading = false } = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();
</script>

<template>
    <v-row class="drink-card-grid">
        <template v-if="loading">
            <v-col v-for="n in 3" :key="n" cols="12" sm="6" md="4">
                <v-card class="ft-card">
                    <v-skeleton-loader type="article, actions"></v-skeleton-loader>
                </v-card>
            </v-col>
        </template>

        <template v-else>
            <v-col v-for="card in cards" :key="card.id" cols="12" sm="6" md="4">
                <v-card class="ft-card d-flex flex-column h-100">
                    <v-card-text class="flex-grow-1">
                        <div class="d-flex align-center justify-space-between">
                            <div class="text-h6">{{ card.name }}</div>
                            <v-chip
                                :color="card.isActive ? 'success' : 'grey'"
                                :text="card.isActive ? t('Global.active') : t('Global.inactive')"
                                size="small"
                            />
                        </div>
                        <div
                            class="text-subtitle-2 mt-2"
                            v-html="card.description ?? t('Global.noDescription')"
                        />
                    </v-card-text>

                    <v-card-text v-if="isCustomDrinkCard(card)" class="pt-0">
                        <div class="text-caption">
                            {{
                                t("PageAdminPropertyDrinkCards.sectionsCount", {
                                    count: card.elements.length,
                                })
                            }}
                        </div>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer />
                        <v-tooltip location="top">
                            <template #activator="{ props }">
                                <v-btn
                                    v-bind="props"
                                    variant="text"
                                    icon="fas fa-pencil-alt"
                                    color="primary"
                                    @click="emit('edit', card)"
                                    @keyup.enter="emit('edit', card)"
                                />
                            </template>
                            <span>{{ t("Global.edit") }}</span>
                        </v-tooltip>
                        <v-tooltip location="top">
                            <template #activator="{ props }">
                                <v-btn
                                    v-bind="props"
                                    variant="text"
                                    icon="fas fa-trash-alt"
                                    color="error"
                                    @click="emit('delete', card)"
                                />
                            </template>
                            <span>{{ t("Global.delete") }}</span>
                        </v-tooltip>
                    </v-card-actions>
                </v-card>
            </v-col>
        </template>
    </v-row>
</template>
