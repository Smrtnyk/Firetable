<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { Reservation, User } from "@firetable/types";

const socials = ["Whatsapp", "SMS", "Instagram", "Facebook", "Phone"].map((social, index) => {
    return {
        name: social,
        email: `social-${index}`,
    };
});

const props = defineProps<{
    users: User[];
    mode: "create" | "edit";
    eventStartTimestamp: number;
    reservationData?: Reservation; // Optional data for editing
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: Reservation): void;
}>();
const { t } = useI18n();

const initialState =
    props.mode === "edit" && props.reservationData
        ? props.reservationData
        : {
              guestName: "",
              numberOfGuests: 2,
              guestContact: "",
              reservationNote: "",
              consumption: 1,
              confirmed: false,
              time: "00:00",
              reservedBy: null as unknown as User,
          };
const state = reactive<Reservation>(initialState);
const reservationForm = ref<QForm | null>(null);
const formattedUsers = computed<Reservation["reservedBy"][]>(() =>
    props.users.map((user) => ({
        name: user.name,
        email: user.email,
    })),
);
const selectionType = ref("user");

const selectableOptions = computed(() => {
    return selectionType.value === "social" ? socials : formattedUsers.value;
});

const reservedByLabel = computed(() => {
    return selectionType.value === "social"
        ? t(`EventCreateReservation.reservedBySocialLabel`)
        : t(`EventCreateReservation.reservedByLabel`);
});

function options(hr: number, min = 0): boolean {
    // Calculate the event start and end times based on the eventStartTimestamp in UTC
    const eventStart = new Date(props.eventStartTimestamp);
    const eventEnd = new Date(props.eventStartTimestamp + 8 * 3600 * 1000); // Add 8 hours

    // Create a date object for the current day in UTC with the hour and minute from the time picker
    const currentDate = new Date(Date.now());
    const currentTime = new Date(
        Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            hr,
            min,
            0,
            0,
        ),
    );

    // If the current UTC time is before the event start time and the event starts late in the day (e.g., after 16:00 UTC),
    // assume the time picker is selecting a time for the next day
    if (currentTime.getUTCHours() < eventStart.getUTCHours() && eventStart.getUTCHours() > 16) {
        currentTime.setUTCDate(currentTime.getUTCDate() + 1);
    }

    // Convert event start and end times to hours since the start of the day in UTC
    const eventStartHours = eventStart.getUTCHours() + eventStart.getUTCMinutes() / 60;
    const eventEndHours = eventEnd.getUTCHours() + eventEnd.getUTCMinutes() / 60;

    // Convert current time to hours since the start of the day in UTC
    const currentTimeHours = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;

    // We need to handle the case where the end time is on the next day
    if (eventEndHours < eventStartHours) {
        return currentTimeHours >= eventStartHours || currentTimeHours <= eventEndHours;
    }
    return currentTimeHours >= eventStartHours && currentTimeHours <= eventEndHours;
}

// Watcher that resets state.reservedBy when selectionType changes
watch(selectionType, (newVal) => {
    // When selectionType changes to 'social', reset reservedBy to the first social option
    // When changing to 'user', reset reservedBy to the first user option
    state.reservedBy = newVal === "social" ? socials[0] : formattedUsers.value[0];
});

function requireReservedBySelection(val: Reservation["reservedBy"]): boolean | string {
    return !!val?.email || t(`EventCreateReservation.requireReservedBySelectionError`);
}

async function onOKClick(): Promise<void> {
    if (!(await reservationForm.value?.validate())) return;

    if (props.mode === "create") {
        emit("create", state);
    } else {
        emit("update", state);
    }
}
</script>

<template>
    <q-card-section>
        <q-form ref="reservationForm" class="q-gutter-md q-pt-md">
            <q-input
                data-test="guest-name"
                v-model="state.guestName"
                rounded
                hide-bottom-space
                standout
                :label="t(`EventCreateReservation.reservationGuestName`)"
                lazy-rules="ondemand"
                :rules="[noEmptyString(), minLength('Name must be longer!', 2)]"
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
                        <q-time :options="options as any" v-model="state.time" format24h>
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
                v-model="state.numberOfGuests"
                hide-bottom-space
                rounded
                standout
                type="number"
                :label="t(`EventCreateReservation.reservationNumberOfGuests`)"
                lazy-rules="ondemand"
                :rules="[requireNumber(), greaterThanZero()]"
            />

            <q-input
                v-model="state.consumption"
                hide-bottom-space
                rounded
                standout
                type="number"
                :label="t(`EventCreateReservation.reservationConsumption`)"
                lazy-rules="ondemand"
                :rules="[requireNumber(), greaterThanZero()]"
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

            <!-- Selector for choosing between 'User' or 'Social' -->
            <div class="q-mb-md">
                <q-radio v-model="selectionType" val="user" label="Staff" />
                <q-radio v-model="selectionType" val="social" label="Social" />
            </div>

            <!-- Select input for choosing the user or social -->
            <q-select
                v-model="state.reservedBy"
                :options="selectableOptions"
                option-label="name"
                option-value="email"
                :label="reservedByLabel"
                :rules="[requireReservedBySelection]"
                data-test="reserved-by"
            />

            <q-btn
                rounded
                size="md"
                class="button-gradient"
                @click="onOKClick"
                :label="t(`EventCreateReservation.reservationCreateBtn`)"
                data-test="ok-btn"
            />
        </q-form>
    </q-card-section>
</template>
