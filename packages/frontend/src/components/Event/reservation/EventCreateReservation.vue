<script setup lang="ts">
import type { AdHocReservation, Reservation, User } from "@firetable/types";
import type { BaseTable, FloorViewer } from "@firetable/floor-creator";
import { ReservationType } from "@firetable/types";
import PlannedReservationForm from "src/components/Event/reservation/PlannedReservationForm.vue";
import { computed, ref, watch } from "vue";
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
    reservationData?: Reservation | AdHocReservation;
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: Reservation | AdHocReservation): void;
}>();

const reservationType = ref(ReservationType.PLANNED);

const currentReservationType = computed(() => {
    // Default to PLANNED type if reservationData is not provided
    return props.reservationData ? props.reservationData.type : ReservationType.PLANNED;
});

const showPlannedReservationForm = computed(() => {
    return (
        reservationType.value === ReservationType.PLANNED ||
        (props.mode === "edit" && currentReservationType.value === ReservationType.PLANNED)
    );
});

const showAdHocReservationForm = computed(() => {
    return (
        reservationType.value === ReservationType.AD_HOC ||
        (props.mode === "edit" && currentReservationType.value === ReservationType.AD_HOC)
    );
});

watch(
    () => props.reservationData,
    (newReservationData) => {
        if (newReservationData) {
            reservationType.value = newReservationData.type;
        }
    },
    { immediate: true },
);

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
            v-if="props.mode === 'create'"
            v-model="reservationType"
            no-caps
            unelevated
            :options="[
                { label: 'Planned', value: ReservationType.PLANNED },
                { label: 'Ad-Hoc', value: ReservationType.AD_HOC },
            ]"
        />
        <PlannedReservationForm
            v-if="showPlannedReservationForm"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :floor="props.floor"
            :users="props.users"
            :table="props.table"
            :reservation-data="props.reservationData"
            @create="handleReservationCreate"
            @update="handleReservationUpdate"
        />

        <AdHocReservationForm
            v-if="showAdHocReservationForm"
            :reservation-data="props.reservationData"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :floor="props.floor"
            :table="props.table"
        />
    </div>
</template>
