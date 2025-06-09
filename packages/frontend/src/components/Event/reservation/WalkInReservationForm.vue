<script setup lang="ts">
import type { WalkInReservation } from "@firetable/types";
// Import VForm type for the template ref
import type { VForm } from "vuetify/components";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { capitalizeName } from "src/helpers/capitalize-name";
import { hourFromTimestamp } from "src/helpers/date-utils";
import {
    greaterThanZero,
    noNegativeNumber,
    optionalMinLength,
    requireNumber,
} from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import { isTimeWithinEventDuration } from "./reservation-form-utils";

interface Props {
    eventDurationInHours: number;
    eventStartTimestamp: number;
    mode: "create" | "update";
    /**
     * Optional data for editing
     */
    reservationData: undefined | WalkInReservation;
    timezone: string;
}

const props = defineProps<Props>();

const { locale, t } = useI18n();

type State = Omit<WalkInReservation, "creator" | "floorId" | "tableLabel">;

function generateInitialState(): State {
    if (props.mode === "update" && props.reservationData) {
        return { ...props.reservationData };
    }

    const eventStart = props.eventStartTimestamp;
    const now = Date.now();
    // Set the initial time to either the current hour or the event start hour
    const initialTime = Math.max(now, eventStart);
    const formattedTime = hourFromTimestamp(initialTime, locale.value, props.timezone);
    return {
        arrived: true as const,
        consumption: 0,
        guestContact: "",
        guestName: "",
        isVIP: false,
        numberOfGuests: 2,
        reservationNote: "",
        state: ReservationState.ARRIVED,
        status: ReservationStatus.ACTIVE,
        time: formattedTime,
        type: ReservationType.WALK_IN as const,
    };
}

const state = ref<State>(generateInitialState());
const reservationForm = useTemplateRef<VForm>("reservationForm");
const timeMenu = ref(false);

function capitalizeGuestName(): void {
    state.value.guestName = capitalizeName(state.value.guestName);
}

function reset(): void {
    state.value = { ...generateInitialState() };
    reservationForm.value?.resetValidation();
}

defineExpose({
    reservationForm,
    reset,
    state,
});
</script>

<template>
    <v-form ref="reservationForm" class="pa-2 d-flex flex-column" style="gap: 1rem" greedy>
        <v-text-field
            v-model="state.guestName"
            variant="outlined"
            hide-details="auto"
            @blur="capitalizeGuestName"
            :label="t('WalkInReservationForm.optionalGuestNameLabel')"
            :rules="[optionalMinLength(t('validation.nameMustBeLongerErrorMsg'), 2)]"
        />

        <v-menu v-model="timeMenu" :close-on-content-click="false" location="bottom start">
            <template #activator="{ props }">
                <v-text-field
                    :model-value="state.time"
                    variant="outlined"
                    readonly
                    hide-details
                    :label="t(`EventCreateReservation.reservationTime`)"
                    append-inner-icon="fas fa-clock"
                    v-bind="props"
                />
            </template>
            <v-time-picker
                :allowed-hours="
                    (hour) =>
                        isTimeWithinEventDuration(
                            props.eventStartTimestamp,
                            props.eventDurationInHours,
                            hour,
                        )
                "
                v-model="state.time"
                format="24hr"
            >
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        :label="t('EventCreateForm.inputDateTimePickerCloseBtnLabel')"
                        color="primary"
                        variant="text"
                        @click="timeMenu = false"
                        >Close</v-btn
                    >
                </v-card-actions>
            </v-time-picker>
        </v-menu>

        <v-text-field
            v-model.number="state.numberOfGuests"
            hide-details="auto"
            variant="outlined"
            type="number"
            :label="t(`EventCreateReservation.reservationNumberOfGuests`)"
            :rules="[requireNumber(), greaterThanZero(t('validation.greaterThanZeroErrorMsg'))]"
        />

        <v-text-field
            v-model.number="state.consumption"
            hide-details="auto"
            variant="outlined"
            type="number"
            :label="t(`EventCreateReservation.reservationConsumption`)"
            :rules="[
                requireNumber(),
                noNegativeNumber(t('validation.negativeReservationConsumptionErrorMsg')),
            ]"
        />

        <TelNumberInput
            v-model="state.guestContact as string"
            :label="t(`EventCreateReservation.reservationGuestContact`)"
        />

        <v-textarea
            v-model="state.reservationNote"
            variant="outlined"
            :label="t('EventCreateReservation.reservationNote')"
            rows="3"
            auto-grow
        />

        <div class="mb-4">
            <v-checkbox
                v-model="state.isVIP"
                :label="t('EventCreateReservation.reservationVIP')"
                hide-details
            />
        </div>
    </v-form>
</template>
