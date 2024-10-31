<script setup lang="ts">
import type { AppUser, Reservation, ReservationDoc, User } from "@firetable/types";

import { ReservationType } from "@firetable/types";
import { computed, ref, watch, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import PlannedReservationForm from "src/components/Event/reservation/PlannedReservationForm.vue";
import WalkInReservationForm from "src/components/Event/reservation/WalkInReservationForm.vue";

export interface EventCreateReservationProps {
    currentUser: AppUser;
    users: User[];
    mode: "create" | "update";
    eventStartTimestamp: number;
    /**
     *  Optional data for editing
     */
    reservationData?: ReservationDoc | undefined;
    eventDurationInHours: number;
    /**
     *  If true, only the Planned Reservation Form is shown
     */
    onlyPlanned?: boolean;
    timezone: string;
}

const props = defineProps<EventCreateReservationProps>();

const emit = defineEmits<(e: "create" | "update", payload: Reservation) => void>();

const { t } = useI18n();

const reservationType = ref(ReservationType.PLANNED);

const plannedRef = useTemplateRef<typeof PlannedReservationForm>("plannedRef");
const walkInRef = useTemplateRef<typeof WalkInReservationForm>("walkInRef");

const currentlyActiveRef = computed(function () {
    return showPlannedReservationForm.value ? plannedRef.value : walkInRef.value;
});

const currentReservationType = computed(function () {
    // Default to PLANNED type if reservationData is not provided
    return props.reservationData?.type ?? ReservationType.PLANNED;
});

const showPlannedReservationForm = computed(() => {
    return (
        props.onlyPlanned ||
        reservationType.value === ReservationType.PLANNED ||
        (props.mode === "update" && currentReservationType.value === ReservationType.PLANNED)
    );
});

const showWalkInReservationForm = computed(() => {
    // Only show Walk-In form if not in 'onlyPlanned' mode
    return (
        !props.onlyPlanned &&
        (reservationType.value === ReservationType.WALK_IN ||
            (props.mode === "update" && currentReservationType.value === ReservationType.WALK_IN))
    );
});

const typedReservationDataForPlanned = computed(function () {
    return props.reservationData?.type === ReservationType.PLANNED
        ? props.reservationData
        : undefined;
});

const typedReservationDataForWalkIn = computed(function () {
    return props.reservationData?.type === ReservationType.WALK_IN
        ? props.reservationData
        : undefined;
});

if (!props.onlyPlanned) {
    watch(
        () => props.reservationData,
        function (newReservationData) {
            if (newReservationData) {
                reservationType.value = newReservationData.type;
            }
        },
        { immediate: true },
    );
}

async function onOKClick(): Promise<void> {
    if (!(await currentlyActiveRef.value?.reservationForm.validate())) {
        return;
    }

    if (!currentlyActiveRef.value?.state) {
        return;
    }

    const valueToEmit = {
        ...currentlyActiveRef.value.state,
        creator: {
            name: props.currentUser.name,
            email: props.currentUser.email,
            id: props.currentUser.id,
            createdAt: Date.now(),
        },
    };

    emit(props.mode, valueToEmit);
}
</script>

<template>
    <q-card-section>
        <q-btn-toggle
            v-if="!props.onlyPlanned && props.mode === 'create'"
            v-model="reservationType"
            no-caps
            rounded
            spread
            unelevated
            :options="[
                { label: 'Planned', value: ReservationType.PLANNED },
                { label: 'Walk-In', value: ReservationType.WALK_IN },
            ]"
        />
        <PlannedReservationForm
            ref="plannedRef"
            v-if="showPlannedReservationForm"
            :current-user="props.currentUser"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :users="props.users"
            :reservation-data="typedReservationDataForPlanned"
            :event-duration-in-hours="props.eventDurationInHours"
        />

        <WalkInReservationForm
            ref="walkInRef"
            v-if="showWalkInReservationForm"
            :timezone="props.timezone"
            :reservation-data="typedReservationDataForWalkIn"
            :mode="props.mode"
            :event-start-timestamp="props.eventStartTimestamp"
            :event-duration-in-hours="props.eventDurationInHours"
        />

        <q-btn
            rounded
            size="md"
            class="button-gradient q-mt-md"
            @click="onOKClick"
            :label="t(`Global.submit`)"
        />
    </q-card-section>
</template>
