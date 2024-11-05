<script setup lang="ts">
import type { WalkInReservation } from "@firetable/types";
import { isTimeWithinEventDuration } from "./reservation-form-utils";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import {
    greaterThanZero,
    noNegativeNumber,
    optionalMinLength,
    requireNumber,
} from "src/helpers/form-rules";
import { hourFromTimestamp } from "src/helpers/date-utils";
import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { capitalizeName } from "src/helpers/capitalize-name";

interface Props {
    mode: "create" | "update";
    eventStartTimestamp: number;
    /**
     *  Optional data for editing
     */
    reservationData: WalkInReservation | undefined;
    eventDurationInHours: number;
    timezone: string;
}

const props = defineProps<Props>();

const { t, locale } = useI18n();

type State = Omit<WalkInReservation, "creator" | "floorId" | "tableLabel">;

function generateInitialState(): State {
    if (props.mode === "update" && props.reservationData) {
        return { ...props.reservationData };
    }

    const eventStart = props.eventStartTimestamp;
    const now = Date.now();
    // Set the initial time to either the current hour or the event start hour
    const initialTime = Math.max(now, eventStart);
    // Format the time as a string "HH:MM"
    const formattedTime = hourFromTimestamp(initialTime, locale.value, props.timezone);
    return {
        type: ReservationType.WALK_IN as const,
        guestName: "",
        numberOfGuests: 2,
        guestContact: "",
        reservationNote: "",
        consumption: 0,
        arrived: true as const,
        time: formattedTime,
        status: ReservationStatus.ACTIVE,
        isVIP: false,
    };
}

const state = ref<State>(generateInitialState());
const reservationForm = useTemplateRef<QForm>("reservationForm");

function capitalizeGuestName(): void {
    state.value.guestName = capitalizeName(state.value.guestName);
}

function reset(): void {
    state.value = { ...generateInitialState() };
    reservationForm.value?.resetValidation();
}

defineExpose({
    reservationForm,
    state,
    reset,
});
</script>

<template>
    <q-form ref="reservationForm" class="q-gutter-md q-pt-md" greedy>
        <q-input
            v-model="state.guestName"
            rounded
            hide-bottom-space
            standout
            @blur="capitalizeGuestName"
            :label="t('WalkInReservationForm.optionalGuestNameLabel')"
            :rules="[optionalMinLength(t('validation.nameMustBeLongerErrorMsg'), 2)]"
        />

        <q-input
            :model-value="state.time"
            rounded
            standout
            readonly
            :label="t(`EventCreateReservation.reservationTime`)"
        >
            <template #append>
                <q-icon name="clock" class="cursor-pointer" />
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-time
                        :options="
                            isTimeWithinEventDuration.bind(
                                null,
                                props.eventStartTimestamp,
                                props.eventDurationInHours,
                            )
                        "
                        v-model="state.time"
                        format24h
                    >
                        <div class="row items-center justify-end">
                            <q-btn
                                :label="t('EventCreateForm.inputDateTimePickerCloseBtnLabel')"
                                color="primary"
                                flat
                                v-close-popup
                            />
                        </div>
                    </q-time>
                </q-popup-proxy>
            </template>
        </q-input>

        <q-input
            v-model.number="state.numberOfGuests"
            hide-bottom-space
            rounded
            standout
            type="number"
            :label="t(`EventCreateReservation.reservationNumberOfGuests`)"
            :rules="[requireNumber(), greaterThanZero(t('validation.greaterThanZeroErrorMsg'))]"
        />

        <q-input
            v-model.number="state.consumption"
            hide-bottom-space
            rounded
            standout
            type="number"
            :label="t(`EventCreateReservation.reservationConsumption`)"
            :rules="[
                requireNumber(),
                noNegativeNumber(t('validation.negativeReservationConsumptionErrorMsg')),
            ]"
        />

        <TelNumberInput
            v-model="state.guestContact"
            :label="t(`EventCreateReservation.reservationGuestContact`)"
        />

        <q-input
            v-model="state.reservationNote"
            rounded
            standout
            :label="t('EventCreateReservation.reservationNote')"
        />

        <div class="q-mb-md">
            <q-checkbox v-model="state.isVIP" :label="t('EventCreateReservation.reservationVIP')" />
        </div>
    </q-form>
</template>
