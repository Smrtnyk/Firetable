<script setup lang="ts">
import type { QueuedReservation, QueuedReservationDoc } from "@firetable/types";

import ReservationGeneralInfo from "src/components/Event/reservation/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";
import FTBtn from "src/components/FTBtn.vue";
import { useAuthStore } from "src/stores/auth-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { computed } from "vue";

interface Props {
    reservation: QueuedReservationDoc;
    timezone: string;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "close" | "delete" | "unqueue") => void>();

const authStore = useAuthStore();
const permissionsStore = usePermissionsStore();

const canModify = computed(function () {
    return permissionsStore.canReserve || isOwnReservation(props.reservation);
});

function isOwnReservation(reservation: QueuedReservation): boolean {
    return authStore.user?.id === reservation.creator?.id;
}
</script>

<template>
    <ReservationLabelChips :reservation="props.reservation" class="pa-4 pb-0" />

    <v-card-text>
        <ReservationGeneralInfo :timezone="props.timezone" :reservation="props.reservation" />

        <v-divider class="my-4" />

        <div v-if="canModify">
            <div class="d-flex" style="gap: 8px">
                <FTBtn
                    title="Move to Floor Plan"
                    icon="fas fa-arrow-right"
                    color="secondary"
                    @click="
                        () => {
                            emit('unqueue');
                            emit('close');
                        }
                    "
                />

                <FTBtn
                    title="Delete"
                    icon="fas fa-trash-alt"
                    color="error"
                    @click="
                        () => {
                            emit('delete');
                            emit('close');
                        }
                    "
                />
            </div>
        </div>
    </v-card-text>
</template>
