<script setup lang="ts">
import type { AppUser, Reservation, ReservationDoc, User } from "@firetable/types";

import { ReservationType } from "@firetable/types";
import PlannedReservationForm from "src/components/Event/reservation/PlannedReservationForm.vue";
import WalkInReservationForm from "src/components/Event/reservation/WalkInReservationForm.vue";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface EventCreateReservationProps {
    currentUser: AppUser;
    eventDurationInHours: number;
    eventStartTimestamp: number;
    mode: "create" | "update";
    /**
     *  If true, only the Planned Reservation Form is shown
     */
    onlyPlanned?: boolean;
    /**
     *  Optional data for editing
     */
    reservationData?: ReservationDoc | undefined;
    timezone: string;
    users: User[];
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
    return props.reservationData?.type ?? ReservationType.PLANNED;
});

const showPlannedReservationForm = computed(function () {
    return (
        props.onlyPlanned ||
        reservationType.value === ReservationType.PLANNED ||
        (props.mode === "update" && currentReservationType.value === ReservationType.PLANNED)
    );
});

const showWalkInReservationForm = computed(function () {
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
            createdAt: Date.now(),
            email: props.currentUser.email,
            id: props.currentUser.id,
            name: props.currentUser.name,
        },
    };

    emit(props.mode, valueToEmit);
}

function resetForm(): void {
    currentlyActiveRef.value?.reset();
}

const hasChanges = computed(function () {
    if (!currentlyActiveRef.value?.state || !props.reservationData) {
        return false;
    }

    // Deep compare the current state with the original data
    return JSON.stringify(currentlyActiveRef.value.state) !== JSON.stringify(props.reservationData);
});
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
            class="button-gradient q-mt-md q-mr-md"
            @click="onOKClick"
            :label="t(`Global.submit`)"
        />
        <q-btn
            v-if="props.mode === 'update'"
            rounded
            size="md"
            class="q-mt-md"
            @click="resetForm"
            :disable="!hasChanges"
            :label="t(`Global.reset`)"
        />
    </q-card-section>
</template>
