<script setup lang="ts">
import type { AppUser, PlannedReservation, User } from "@firetable/types";
import { isTimeWithinEventDuration } from "./reservation-form-utils";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { computed, ref, watch, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";

import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { capitalizeName } from "src/helpers/capitalize-name";

export interface PlannedReservationFormProps {
    currentUser: AppUser;
    users: User[];
    mode: "create" | "update";
    eventStartTimestamp: number;
    /**
     *  Optional data for editing
     */
    reservationData: PlannedReservation | undefined;
    eventDurationInHours: number;
}

const socials = ["Whatsapp", "SMS", "Instagram", "Facebook", "Phone"].map(function (social, index) {
    return {
        name: social,
        email: `social-${index}`,
        id: "",
    };
});
const props = defineProps<PlannedReservationFormProps>();
const { t } = useI18n();

// Move initial state logic into a function
function generateInitialState() {
    return props.mode === "update" && props.reservationData
        ? { ...props.reservationData }
        : {
              type: ReservationType.PLANNED as const,
              guestName: "",
              numberOfGuests: 2,
              guestContact: "",
              reservationNote: "",
              consumption: 1,
              arrived: false,
              reservationConfirmed: false,
              time: "00:00",
              reservedBy: null as unknown as User,
              cancelled: false,
              status: ReservationStatus.ACTIVE,
              isVIP: false,
          };
}

// Initialize state with the initial values
const state =
    ref<Omit<PlannedReservation, "creator" | "floorId" | "tableLabel">>(generateInitialState());
const reservationForm = useTemplateRef<QForm>("reservationForm");
const formattedUsers = computed<PlannedReservation["reservedBy"][]>(function () {
    return props.users.map(function (user) {
        return {
            name: user.name,
            email: user.email,
            id: user.id,
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

// Watcher that resets state.reservedBy when selectionType changes
watch(selectionType, function (newVal) {
    // When selectionType changes to 'social', reset reservedBy to the first social option
    // When changing to 'user', reset reservedBy to the first user option
    state.value.reservedBy = newVal === "social" ? socials[0] : formattedUsers.value[0];
});

function requireReservedBySelection(val: PlannedReservation["reservedBy"]): boolean | string {
    return Boolean(val?.email) || t(`EventCreateReservation.requireReservedBySelectionError`);
}

function capitalizeGuestName(): void {
    state.value.guestName = capitalizeName(state.value.guestName);
}

function reset(): void {
    // Get fresh initial state
    const freshInitialState = generateInitialState();
    // Reset to initial state
    state.value = { ...freshInitialState };
    // Reset selection type based on fresh initial state
    selectionType.value = freshInitialState.reservedBy?.id ? "user" : "social";
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
                <q-icon name="clock" class="cursor-pointer" aria-label="Open time picker" />
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
