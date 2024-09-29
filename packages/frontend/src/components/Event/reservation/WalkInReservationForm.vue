<script setup lang="ts">
import type { WalkInReservation } from "@firetable/types";
import type { BaseTable } from "@firetable/floor-creator";
import { isTimeWithinEventDuration } from "./reservation-form-utils";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, optionalMinLength, requireNumber } from "src/helpers/form-rules";
import { hourFromTimestamp } from "src/helpers/date-utils";

interface Props {
    mode: "create" | "update";
    eventStartTimestamp: number;
    table: BaseTable;
    floorId: string;
    /**
     *  Optional data for editing
     */
    reservationData: WalkInReservation | undefined;
    eventDurationInHours: number;
}

const props = defineProps<Props>();

const { t } = useI18n();

const initialState =
    props.mode === "update" && props.reservationData
        ? props.reservationData
        : generateInitialState();
const state = ref<Omit<WalkInReservation, "creator">>(initialState);
const reservationForm = useTemplateRef<QForm>("reservationForm");

function generateInitialState(): Omit<WalkInReservation, "creator"> {
    const eventStart = props.eventStartTimestamp;
    const now = Date.now();
    // Set the initial time to either the current hour or the event start hour
    const initialTime = now > eventStart ? now : eventStart;
    // Format the time as a string "HH:MM"
    const formattedTime = hourFromTimestamp(initialTime, null);
    return {
        type: ReservationType.WALK_IN as const,
        guestName: "",
        numberOfGuests: 2,
        guestContact: "",
        reservationNote: "",
        consumption: 0,
        arrived: true as const,
        time: formattedTime,
        tableLabel: props.table.label,
        floorId: props.floorId,
        status: ReservationStatus.ACTIVE,
        isVIP: false,
    };
}

defineExpose({
    reservationForm,
    state,
});
</script>

<template>
    <q-form ref="reservationForm" class="q-gutter-md q-pt-md">
        <q-input
            data-test="guest-name"
            v-model="state.guestName"
            rounded
            hide-bottom-space
            standout
            label="Optional Guest Name"
            lazy-rules="ondemand"
            :rules="[optionalMinLength('Name must be longer!', 2)]"
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
            lazy-rules="ondemand"
            :rules="[requireNumber(), greaterThanZero()]"
        />

        <q-input
            v-model.number="state.consumption"
            hide-bottom-space
            rounded
            standout
            type="number"
            :label="t(`EventCreateReservation.reservationConsumption`)"
            lazy-rules="ondemand"
            :rules="[requireNumber()]"
        />

        <q-input
            v-model="state.guestContact"
            rounded
            standout
            class="q-mb-md"
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
