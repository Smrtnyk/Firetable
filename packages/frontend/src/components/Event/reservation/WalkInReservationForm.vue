<script setup lang="ts">
import type { WalkInReservation } from "@firetable/types";
import type { BaseTable, FloorViewer } from "@firetable/floor-creator";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, optionalMinLength, requireNumber } from "src/helpers/form-rules";
import { useAuthStore } from "src/stores/auth-store";
import { getFirestoreTimestamp } from "@firetable/backend";

const props = defineProps<{
    mode: "create" | "edit";
    eventStartTimestamp: number;
    table: BaseTable;
    floor: FloorViewer;
    /**
     *  Optional data for editing
     */
    reservationData: WalkInReservation | undefined;
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: WalkInReservation): void;
}>();
const { t } = useI18n();
const authStore = useAuthStore();

const initialState =
    props.mode === "edit" && props.reservationData
        ? props.reservationData
        : {
              type: ReservationType.WALK_IN as const,
              guestName: null,
              numberOfGuests: 2,
              guestContact: "",
              reservationNote: "",
              consumption: 0,
              arrived: true as const,
              time: "00:00",
              creator: {
                  name: authStore.user!.name,
                  email: authStore.user!.email,
                  id: authStore.user!.id,
                  createdAt: getFirestoreTimestamp(),
              },
              tableLabel: props.table.label,
              floorId: props.floor.id,
              status: ReservationStatus.ACTIVE,
          };
const state = reactive<WalkInReservation>(initialState);
const reservationForm = ref<QForm | null>(null);

function options(hr: number, min: number | null = 0): boolean {
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
            min ?? 0,
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

async function onOKClick(): Promise<void> {
    if (!(await reservationForm.value?.validate())) {
        return;
    }

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
                        <q-time :options="options" v-model="state.time" format24h>
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
