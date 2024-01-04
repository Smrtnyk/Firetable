<script setup lang="ts">
import type { WalkInReservation, Reservation, User } from "@firetable/types";
import type { BaseTable, FloorViewer } from "@firetable/floor-creator";

import { ReservationType } from "@firetable/types";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import PlannedReservationForm from "src/components/Event/reservation/PlannedReservationForm.vue";
import WalkInReservationForm from "src/components/Event/reservation/WalkInReservationForm.vue";

const props = defineProps<{
    users: User[];
    mode: "create" | "update";
    eventStartTimestamp: number;
    table: BaseTable;
    floor: FloorViewer;
    /**
     *  Optional data for editing
     */
    reservationData?: Reservation | WalkInReservation;
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: Reservation | WalkInReservation): void;
}>();

const { t } = useI18n();

const reservationType = ref(ReservationType.PLANNED);

const plannedRef = ref<typeof PlannedReservationForm | undefined>();
const walkInRef = ref<typeof WalkInReservationForm | undefined>();

const currentlyActiveRef = computed(() => {
    return showPlannedReservationForm.value ? plannedRef.value : walkInRef.value;
});

const currentReservationType = computed(() => {
    // Default to PLANNED type if reservationData is not provided
    return props.reservationData ? props.reservationData.type : ReservationType.PLANNED;
});

const showPlannedReservationForm = computed(() => {
    return (
        reservationType.value === ReservationType.PLANNED ||
        (props.mode === "update" && currentReservationType.value === ReservationType.PLANNED)
    );
});

const showWalkInReservationForm = computed(() => {
    return (
        reservationType.value === ReservationType.WALK_IN ||
        (props.mode === "update" && currentReservationType.value === ReservationType.WALK_IN)
    );
});

const typedReservationDataForPlanned = computed(() => {
    return props.reservationData?.type === ReservationType.PLANNED
        ? props.reservationData
        : undefined;
});

const typedReservationDataForWalkIn = computed(() => {
    return props.reservationData?.type === ReservationType.WALK_IN
        ? props.reservationData
        : undefined;
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

async function onOKClick(): Promise<void> {
    if (!(await currentlyActiveRef.value?.reservationForm.validate())) {
        return;
    }

    if (!currentlyActiveRef.value?.state) {
        return;
    }

    emit(props.mode, currentlyActiveRef.value.state);
}
</script>

<template>
    <q-card-section>
        <q-btn-toggle
            v-if="props.mode === 'create'"
            v-model="reservationType"
            no-caps
            unelevated
            :options="[
                { label: 'Planned', value: ReservationType.PLANNED },
                { label: 'Walk-In', value: ReservationType.WALK_IN },
            ]"
        />
        <PlannedReservationForm
            ref="plannedRef"
            v-if="showPlannedReservationForm"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :floor="props.floor"
            :users="props.users"
            :table="props.table"
            :reservation-data="typedReservationDataForPlanned"
        />

        <WalkInReservationForm
            ref="walkInRef"
            v-if="showWalkInReservationForm"
            :reservation-data="typedReservationDataForWalkIn"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :floor="props.floor"
            :table="props.table"
        />

        <q-btn
            rounded
            size="md"
            class="button-gradient q-mt-md"
            @click="onOKClick"
            :label="t(`EventCreateReservation.reservationCreateBtn`)"
            data-test="ok-btn"
        />
    </q-card-section>
</template>
