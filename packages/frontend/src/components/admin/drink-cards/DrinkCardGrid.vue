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
    <div class="DrinkCardGrid row q-col-gutter-md">
        <template v-if="loading">
            <div v-for="n in 3" :key="n" class="col-12 col-sm-6 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <q-skeleton type="text" class="text-h6" />
                        <q-skeleton type="text" class="q-mt-sm" />
                    </q-card-section>
                    <q-card-section>
                        <q-skeleton type="text" width="30%" />
                    </q-card-section>
                </q-card>
            </div>
        </template>

        <template v-else>
            <div v-for="card in cards" :key="card.id" class="col-12 col-sm-6 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <div class="row items-center justify-between">
                            <div class="text-h6">{{ card.name }}</div>
                            <q-badge
                                :color="card.isActive ? 'positive' : 'grey'"
                                :label="card.isActive ? t('Global.active') : t('Global.inactive')"
                            />
                        </div>
                        <div
                            class="text-subtitle2 q-mt-sm"
                            v-html="card.description ?? t('Global.noDescription')"
                        />
                    </q-card-section>

                    <q-card-section v-if="isCustomDrinkCard(card)">
                        <div class="text-caption">
                            {{
                                t("PageAdminPropertyDrinkCards.sectionsCount", {
                                    count: card.elements.length,
                                })
                            }}
                        </div>
                    </q-card-section>

                    <q-card-actions align="right">
                        <q-btn
                            flat
                            round
                            color="primary"
                            icon="pencil"
                            @click="emit('edit', card)"
                            :tabindex="0"
                            @keyup.enter="emit('edit', card)"
                        >
                            <q-tooltip>{{ t("Global.edit") }}</q-tooltip>
                        </q-btn>
                        <q-btn
                            flat
                            round
                            color="negative"
                            icon="trash"
                            @click="emit('delete', card)"
                        >
                            <q-tooltip>{{ t("Global.delete") }}</q-tooltip>
                        </q-btn>
                    </q-card-actions>
                </q-card>
            </div>
        </template>
    </div>
</template>
