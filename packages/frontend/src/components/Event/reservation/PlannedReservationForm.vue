<script setup lang="ts">
import type { AppUser, PlannedReservation, User } from "@firetable/types";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
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
     * Optional data for editing
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
const reservationForm = useTemplateRef("reservationForm");
const timeMenu = ref(false);
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
    <v-form ref="reservationForm" class="pa-2 d-flex flex-column" style="gap: 1rem" greedy>
        <v-text-field
            v-model="state.guestName"
            variant="outlined"
            hide-details="auto"
            @blur="capitalizeGuestName"
            :label="t(`EventCreateReservation.reservationGuestName`)"
            :rules="[
                noEmptyString(t('validation.required')),
                minLength(t('validation.nameMustBeLongerErrorMsg'), 2),
            ]"
        />

        <v-menu v-model="timeMenu" :close-on-content-click="false" location="bottom start">
            <template #activator="{ props: menuProps }">
                <v-text-field
                    :model-value="state.time"
                    variant="outlined"
                    readonly
                    hide-details
                    :label="t(`EventCreateReservation.reservationTime`)"
                    append-inner-icon="fas fa-clock"
                    v-bind="menuProps"
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
            :rules="[requireNumber(), greaterThanZero()]"
        />

        <tel-number-input
            v-model="state.guestContact as string"
            :label="t('EventCreateReservation.reservationGuestContact')"
        ></tel-number-input>

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

        <v-radio-group v-model="selectionType" inline hide-details class="mb-4">
            <v-radio
                value="user"
                :label="t(`PlannedReservationForm.reservedByStaffRadioBtnLabel`)"
            />
            <v-radio value="social" :label="t(`EventCreateReservation.reservedBySocialLabel`)" />
        </v-radio-group>

        <v-select
            variant="outlined"
            v-model="state.reservedBy"
            :items="selectableOptions"
            item-title="name"
            item-value="email"
            return-object
            :label="reservedByLabel"
            :rules="[requireReservedBySelection]"
        />
    </v-form>
</template>
