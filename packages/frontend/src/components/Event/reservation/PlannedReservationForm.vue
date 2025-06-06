<script setup lang="ts">
import type { AppUser, PlannedReservation, User } from "@firetable/types";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { QForm } from "quasar";
import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { capitalizeName } from "src/helpers/capitalize-name";
import { greaterThanZero, minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { isTimeWithinEventDuration } from "./reservation-form-utils";

export interface PlannedReservationFormProps {
    currentUser: AppUser;
    eventDurationInHours: number;
    eventStartTimestamp: number;
    mode: "create" | "update";
    /**
     *  Optional data for editing
     */
    reservationData: PlannedReservation | undefined;
    users: User[];
}

const socials = ["Whatsapp", "SMS", "Instagram", "Facebook", "Phone"].map(function (social, index) {
    return {
        email: `social-${index}`,
        id: "",
        name: social,
    };
});
const props = defineProps<PlannedReservationFormProps>();
const { t } = useI18n();

function generateInitialState(): Omit<PlannedReservation, "creator" | "floorId" | "tableLabel"> {
    return props.mode === "update" && props.reservationData
        ? { ...props.reservationData }
        : {
              arrived: false,
              cancelled: false,
              consumption: 1,
              guestContact: "",
              guestName: "",
              isVIP: false,
              numberOfGuests: 2,
              reservationConfirmed: false,
              reservationNote: "",
              reservedBy: null as unknown as User,
              state: ReservationState.PENDING,
              status: ReservationStatus.ACTIVE,
              time: "00:00",
              type: ReservationType.PLANNED as const,
          };
}

const state =
    ref<Omit<PlannedReservation, "creator" | "floorId" | "tableLabel">>(generateInitialState());
const reservationForm = useTemplateRef<QForm>("reservationForm");
const formattedUsers = computed<PlannedReservation["reservedBy"][]>(function () {
    return props.users.map(function (user) {
        return {
            email: user.email,
            id: user.id,
            name: user.name,
        };
    });
});
const selectionType = ref("user");

const selectableOptions = computed(function () {
    return selectionType.value === "social" ? socials : formattedUsers.value;
});

const reservedByLabel = computed(function () {
    return selectionType.value === "social"
        ? t(`EventCreateReservation.reservedBySocialLabel`)
        : t(`EventCreateReservation.reservedByLabel`);
});

watch(selectionType, function (newVal) {
    state.value.reservedBy = newVal === "social" ? socials[0] : formattedUsers.value[0];
});

function capitalizeGuestName(): void {
    state.value.guestName = capitalizeName(state.value.guestName);
}

function requireReservedBySelection(val: PlannedReservation["reservedBy"]): boolean | string {
    return Boolean(val?.email) || t(`EventCreateReservation.requireReservedBySelectionError`);
}

function reset(): void {
    const freshInitialState = generateInitialState();
    state.value = { ...freshInitialState };
    selectionType.value = freshInitialState.reservedBy?.id ? "user" : "social";
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
            rounded
            hide-bottom-space
            standout
            @blur="capitalizeGuestName"
            :label="t(`EventCreateReservation.reservationGuestName`)"
            :rules="[
                noEmptyString(t('validation.required')),
                minLength(t('validation.nameMustBeLongerErrorMsg'), 2),
            ]"
        />

        <q-input
            :model-value="state.time"
            rounded
            standout
            readonly
            :label="t(`EventCreateReservation.reservationTime`)"
        >
            <template #append>
                <q-icon name="fa fa-clock" class="cursor-pointer" aria-label="Open time picker" />
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
            lazy-rules="ondemand"
            :rules="[requireNumber(), greaterThanZero()]"
        />

        <tel-number-input
            v-model="state.guestContact"
            :label="t('EventCreateReservation.reservationGuestContact')"
            class="q-mb-md"
        ></tel-number-input>

        <q-input
            v-model="state.reservationNote"
            rounded
            standout
            :label="t('EventCreateReservation.reservationNote')"
        />

        <div class="q-mb-md">
            <q-checkbox v-model="state.isVIP" :label="t('EventCreateReservation.reservationVIP')" />
        </div>

        <!-- Selector for choosing between 'User' or 'Social' -->
        <div class="q-mb-md">
            <q-radio
                v-model="selectionType"
                val="user"
                :label="t(`PlannedReservationForm.reservedByStaffRadioBtnLabel`)"
            />
            <q-radio
                v-model="selectionType"
                val="social"
                :label="t(`EventCreateReservation.reservedBySocialLabel`)"
            />
        </div>

        <!-- Select input for choosing the user or social -->
        <q-select
            standout
            v-model="state.reservedBy"
            :options="selectableOptions"
            option-label="name"
            option-value="email"
            :label="reservedByLabel"
            :rules="[requireReservedBySelection]"
        />
    </q-form>
</template>
