<script setup lang="ts">
import type { QueuedReservation, QueuedReservationDoc } from "@firetable/types";

import { computed } from "vue";

import ReservationGeneralInfo from "src/components/Event/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";

import { useAuthStore } from "src/stores/auth-store";

interface Props {
    reservation: QueuedReservationDoc;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "unqueue") => void>();

const authStore = useAuthStore();

const canUnqueue = computed(function () {
    return authStore.canReserve || isOwnReservation(props.reservation);
});

function isOwnReservation(reservation: QueuedReservation): boolean {
    return authStore.user?.id === reservation.creator?.id;
}
</script>

<template>
    <ReservationLabelChips :reservation="props.reservation" />

    <q-card-section>
        <ReservationGeneralInfo :reservation="props.reservation" />

        <q-separator class="q-mb-md" />

        <q-item v-if="canUnqueue">
            <div class="row q-gutter-sm full-width">
                <q-btn
                    title="Move to Floor Plan"
                    icon="transfer"
                    color="secondary"
                    @click="() => emit('unqueue')"
                    v-close-popup
                />
            </div>
        </q-item>
    </q-card-section>
</template>
