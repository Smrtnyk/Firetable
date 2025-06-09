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
     * If true, only the Planned Reservation Form is shown
     */
    onlyPlanned?: boolean;
    /**
     * Optional data for editing
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
    if (!currentlyActiveRef.value?.reservationForm) return;

    if (!(await currentlyActiveRef.value.reservationForm.validate()).valid) {
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
    <v-card-text>
        <v-btn-toggle
            v-if="!props.onlyPlanned && props.mode === 'create'"
            v-model="reservationType"
            rounded="xl"
            variant="outlined"
            divided
            class="d-flex mb-4"
        >
            <v-btn :value="ReservationType.PLANNED" class="flex-grow-1">Planned</v-btn>
            <v-btn :value="ReservationType.WALK_IN" class="flex-grow-1">Walk-In</v-btn>
        </v-btn-toggle>

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
        <div class="mt-4">
            <v-btn rounded="lg" size="large" class="button-gradient mr-4" @click="onOKClick">
                {{ t(`Global.submit`) }}
            </v-btn>
            <v-btn
                v-if="props.mode === 'update'"
                rounded="lg"
                size="large"
                variant="tonal"
                @click="resetForm"
                :disable="!hasChanges"
            >
                {{ t(`Global.reset`) }}
            </v-btn>
        </div>
    </v-card-text>
</template>
