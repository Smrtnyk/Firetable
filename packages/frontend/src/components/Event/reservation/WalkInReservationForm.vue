<script setup lang="ts">
import type { WalkInReservation } from "@firetable/types";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { QForm } from "quasar";
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
     *  Optional data for editing
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
    reset,
    state,
});
</script>

<template>
    <q-form ref="reservationForm" class="q-gutter-md q-pt-md" greedy>
        <q-input
            v-model="state.guestName"
            hide-bottom-space
            outlined
            @blur="capitalizeGuestName"
            :label="t('WalkInReservationForm.optionalGuestNameLabel')"
            :rules="[optionalMinLength(t('validation.nameMustBeLongerErrorMsg'), 2)]"
        />

        <q-input
            :model-value="state.time"
            outlined
            readonly
            :label="t(`EventCreateReservation.reservationTime`)"
        >
            <template #append>
                <q-icon name="fa fa-clock" class="cursor-pointer" />
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
            outlined
            type="number"
            :label="t(`EventCreateReservation.reservationNumberOfGuests`)"
            :rules="[requireNumber(), greaterThanZero(t('validation.greaterThanZeroErrorMsg'))]"
        />

        <q-input
            v-model.number="state.consumption"
            hide-bottom-space
            outlined
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
            outlined
            :label="t('EventCreateReservation.reservationNote')"
        />

        <div class="q-mb-md">
            <q-checkbox v-model="state.isVIP" :label="t('EventCreateReservation.reservationVIP')" />
        </div>
    </q-form>
</template>
