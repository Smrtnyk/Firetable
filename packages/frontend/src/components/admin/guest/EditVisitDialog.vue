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
        <q-list>
            <q-item>
                <q-item-section>
                    <q-item-label>{{ t("Global.arrived") }}</q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle
                        :aria-label="t('Global.arrived')"
                        v-model="editingVisit.arrived"
                        color="green"
                    />
                </q-item-section>
            </q-item>

            <q-item>
                <q-item-section>
                    <q-item-label>{{ t("Global.cancelled") }}</q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle
                        :aria-label="t('Global.cancelled')"
                        v-model="editingVisit.cancelled"
                        color="red"
                    />
                </q-item-section>
            </q-item>

            <q-item>
                <q-item-section>
                    <q-item-label>VIP</q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle aria-label="VIP" v-model="editingVisit.isVIPVisit" color="purple" />
                </q-item-section>
            </q-item>
        </q-list>

        <q-separator />

        <q-card-actions align="right">
            <q-btn
                :label="t('Global.submit')"
                @click="onSave"
                rounded
                size="md"
                class="button-gradient q-mt-sm"
            />
        </q-card-actions>
    </div>
</template>
