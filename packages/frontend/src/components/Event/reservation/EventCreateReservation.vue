<script setup lang="ts">
import type { AdHocReservation, Reservation, User } from "@firetable/types";
import type { BaseTable, FloorViewer } from "@firetable/floor-creator";
import { ReservationType } from "@firetable/types";
import PlannedReservationForm from "src/components/Event/reservation/PlannedReservationForm.vue";
import { ref } from "vue";
import AdHocReservationForm from "src/components/Event/reservation/AdHocReservationForm.vue";

const props = defineProps<{
    users: User[];
    mode: "create" | "edit";
    eventStartTimestamp: number;
    table: BaseTable;
    floor: FloorViewer;
    /**
     *  Optional data for editing
     */
    reservationData?: Reservation;
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: Reservation | AdHocReservation): void;
}>();

const reservationType = ref(ReservationType.PLANNED);

function handleReservationCreate(reservation: Reservation | AdHocReservation): void {
    emit("create", reservation);
}

function handleReservationUpdate(reservation: Reservation | AdHocReservation): void {
    emit("update", reservation);
}
</script>

<template>
    <div>
        <q-btn-toggle
            v-model="reservationType"
            no-caps
            unelevated
            :options="[
                { label: 'Planned', value: ReservationType.PLANNED },
                { label: 'Ad-Hoc', value: ReservationType.AD_HOC },
            ]"
        />
        <PlannedReservationForm
            v-if="reservationType === ReservationType.PLANNED"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :floor="props.floor"
            :users="props.users"
            :table="props.table"
            @create="handleReservationCreate"
            @update="handleReservationUpdate"
        />

        <AdHocReservationForm
            v-if="reservationType === ReservationType.AD_HOC"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :floor="props.floor"
            :table="props.table"
        />
    </div>
</template>
