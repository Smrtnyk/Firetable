<script setup lang="ts">
import type { Visit } from "@firetable/types";

import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface EditVisitDialogProps {
    visit: Visit;
}

type Emits = (e: "update", visit: Visit) => void;

const props = defineProps<EditVisitDialogProps>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

const editingVisit = ref({ ...props.visit });

watch(
    () => editingVisit.value.arrived,
    function (newArrived) {
        if (newArrived) {
            editingVisit.value.cancelled = false;
        }
    },
);

watch(
    () => editingVisit.value.cancelled,
    function (newCancelled) {
        if (newCancelled) {
            editingVisit.value.arrived = false;
        }
    },
);

function onSave(): void {
    emit("update", editingVisit.value);
}
</script>

<template>
    <div>
        <v-list>
            <v-list-item>
                <v-list-item-title>{{ t("Global.arrived") }}</v-list-item-title>
                <template #append>
                    <v-switch
                        :aria-label="t('Global.arrived')"
                        v-model="editingVisit.arrived"
                        color="green"
                        inset
                        hide-details
                    />
                </template>
            </v-list-item>

            <v-list-item>
                <v-list-item-title>{{ t("Global.cancelled") }}</v-list-item-title>
                <template #append>
                    <v-switch
                        :aria-label="t('Global.cancelled')"
                        v-model="editingVisit.cancelled"
                        color="red"
                        inset
                        hide-details
                    />
                </template>
            </v-list-item>

            <v-list-item>
                <v-list-item-title>VIP</v-list-item-title>
                <template #append>
                    <v-switch
                        aria-label="VIP"
                        v-model="editingVisit.isVIPVisit as boolean"
                        color="purple"
                        inset
                        hide-details
                    />
                </template>
            </v-list-item>
        </v-list>

        <v-divider class="my-2" />

        <v-card-actions>
            <v-spacer />
            <v-btn class="button-gradient mt-2" rounded variant="tonal" @click="onSave">
                {{ t("Global.submit") }}
            </v-btn>
        </v-card-actions>
    </div>
</template>
