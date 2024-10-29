<script setup lang="ts">
import type {
    CreateEventForm,
    CreateEventPayload,
    EditEventPayload,
    EventDoc,
    FloorDoc,
} from "@firetable/types";
import { computed, ref, watch, watchEffect, useTemplateRef } from "vue";

import { useI18n } from "vue-i18n";
import {
    greaterThanZero,
    noEmptyString,
    requireNumber,
    validOptionalURL,
} from "src/helpers/form-rules";

import { QForm } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/date-utils";

interface State {
    form: CreateEventForm;
    chosenFloors: string[];
    showDateModal: boolean;
    showTimeModal: boolean;
    selectedDate: string;
    selectedTime: string;
}

export interface EventCreateFormProps {
    propertyId: string;
    organisationId: string;
    propertyName: string;
    floors: FloorDoc[];
    event?: EventDoc | undefined;
    eventStartHours: string;
    propertyTimezone: string;
}

const props = defineProps<EventCreateFormProps>();
const emit = defineEmits<{
    (event: "create", payload: CreateEventPayload): void;
    (event: "update", payload: EditEventPayload): void;
}>();

// Default date creation should use property timezone
const newDate = new Date();
// Set to eventStartHours in property timezone
const [hours, minutes] = props.eventStartHours.split(":");
newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

const eventObj: CreateEventForm = {
    name: "",
    date: newDate.getTime(),
    guestListLimit: 100,
    entryPrice: 0,
    img: "",
};

const isEditMode = computed(function () {
    return Boolean(props.event);
});
const { t, locale } = useI18n();
const form = useTemplateRef<QForm>("form");
const state = ref<State>({
    form: { ...eventObj },
    chosenFloors: [],
    showDateModal: false,
    showTimeModal: false,
    selectedDate: dateFromTimestamp(Date.now(), locale.value, props.propertyTimezone),
    selectedTime: props.eventStartHours,
});

function validDates(calendarDate: string): boolean {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: props.propertyTimezone,
    });
    const propertyToday = new Date(formatter.format(today));
    propertyToday.setHours(0, 0, 0, 0);

    const dateToCheck = new Date(calendarDate);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck >= propertyToday;
}

watchEffect(function () {
    if (isEditMode.value && props.event) {
        // Use event data if in edit mode
        const editDate = new Date(props.event.date);
        state.value.form = {
            name: props.event.name,
            guestListLimit: props.event.guestListLimit,
            entryPrice: props.event.entryPrice,
            img: props.event.img ?? "",
            date: props.event.date,
        };
        state.value.selectedDate = dateFromTimestamp(
            editDate.getTime(),
            locale.value,
            props.propertyTimezone,
        );
        state.value.selectedTime = hourFromTimestamp(
            editDate.getTime(),
            locale.value,
            props.propertyTimezone,
        );
    } else {
        state.value.form = { ...eventObj };
        state.value.selectedDate = dateFromTimestamp(
            Date.now(),
            locale.value,
            props.propertyTimezone,
        );
        state.value.selectedTime = props.eventStartHours;
    }
});

watch([() => state.value.selectedDate, () => state.value.selectedTime], function () {
    if (!state.value.selectedDate) {
        return;
    }
    const [dayVal, monthVal, yearVal] = state.value.selectedDate.split(".");
    // Create date in property timezone
    const dateStr = `${yearVal}-${monthVal}-${dayVal}T${state.value.selectedTime}`;
    const date = new Date(dateStr);

    // Convert the local date to UTC while preserving the intended time
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: props.propertyTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const dateParts = parts.reduce<Record<string, string>>((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    // Create UTC timestamp
    state.value.form.date = Date.UTC(
        Number(dateParts.year),
        Number(dateParts.month) - 1,
        Number(dateParts.day),
        Number(dateParts.hour),
        Number(dateParts.minute),
    );
});

function updateDate(newDateVal: any): void {
    state.value.selectedDate = newDateVal;
}

function updateTime(newTime: any): void {
    state.value.selectedTime = newTime;
}

const displayedDate = computed(function () {
    if (!state.value.form.date) return "";
    return `${dateFromTimestamp(state.value.form.date, locale.value, props.propertyTimezone)} ${hourFromTimestamp(state.value.form.date, locale.value, props.propertyTimezone)}`;
});

function validateAndEmitCreate(): void {
    if (state.value.chosenFloors.length === 0) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }

    const selectedFloors = Object.values(props.floors).filter(function (floor) {
        return state.value.chosenFloors.includes(floor.id);
    });

    if (selectedFloors.length === 0) {
        showErrorMessage(t("EventCreateForm.selectedFloorNotFoundMessage"));
        return;
    }

    emit("create", {
        ...state.value.form,
        guestListLimit: Number(state.value.form.guestListLimit),
        propertyId: props.propertyId,
        organisationId: props.organisationId,
        floors: selectedFloors.map(function (floor) {
            return { ...floor, id: floor.id };
        }),
    });
    state.value.form = eventObj;
}

function validateAndEmitEdit(): void {
    emit("update", {
        ...state.value.form,
        guestListLimit: Number(state.value.form.guestListLimit),
        propertyId: props.propertyId,
        organisationId: props.organisationId,
    });
}

async function onSubmit(): Promise<void> {
    if (!(await form.value?.validate())) {
        return;
    }
    if (isEditMode.value) {
        return validateAndEmitEdit();
    }
    return validateAndEmitCreate();
}

function onReset(): void {
    state.value.form = { ...eventObj };
    state.value.chosenFloors.length = 0;
}
</script>

<template>
    <q-form
        ref="form"
        class="q-gutter-xs q-pt-md q-pa-md"
        @submit="onSubmit"
        @reset="onReset"
        greedy
    >
        <q-input
            v-model="state.form.img"
            rounded
            standout
            :label="t('EventCreateForm.eventImgInputLabel')"
            lazy-rules
            :rules="[validOptionalURL()]"
        />

        <q-input
            v-model="state.form.name"
            rounded
            standout
            :label="t('EventCreateForm.eventNameInputLabel')"
            lazy-rules
            :rules="[noEmptyString()]"
        />

        <q-input
            v-model.number="state.form.guestListLimit"
            rounded
            standout
            type="number"
            :label="t('EventCreateForm.guestListLimitInputLabel')"
            lazy-rules
            :rules="[requireNumber(), greaterThanZero()]"
        />

        <q-input
            v-model.number="state.form.entryPrice"
            rounded
            standout
            type="number"
            :label="t('EventCreateForm.entryPriceInputLabel')"
            lazy-rules
            :rules="[requireNumber()]"
        />

        <q-input
            :label="t('EventCreateForm.inputDateTimeLabel')"
            v-model="displayedDate"
            rounded
            standout
            readonly
            class="q-mb-lg"
        >
            <template #prepend>
                <q-icon name="calendar" class="cursor-pointer" />
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date
                        :no-unset="true"
                        v-model="state.selectedDate"
                        mask="DD.MM.YYYY"
                        today-btn
                        @update:model-value="updateDate"
                        :options="validDates"
                    >
                        <div class="row items-center justify-end">
                            <q-btn
                                :label="t('EventCreateForm.inputDateTimePickerCloseBtnLabel')"
                                color="primary"
                                flat
                                v-close-popup
                            />
                        </div>
                    </q-date>
                </q-popup-proxy>
            </template>
            <template #append>
                <q-icon name="clock" class="cursor-pointer" />
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-time
                        v-model="state.selectedTime"
                        mask="HH:mm"
                        format24h
                        @update:model-value="updateTime"
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

        <div class="q-gutter-sm q-mb-lg" v-if="!isEditMode">
            <div class="text-h6">{{ props.propertyName }}</div>
            <div>
                <q-checkbox
                    v-for="floor in props.floors"
                    :key="floor.id"
                    v-model="state.chosenFloors"
                    :val="floor.id"
                    :label="floor.name"
                    color="accent"
                />
            </div>
        </div>

        <div>
            <q-btn
                rounded
                size="md"
                :label="t('Global.submit')"
                type="submit"
                class="button-gradient"
            />
            <q-btn
                v-if="!isEditMode"
                rounded
                size="md"
                :label="t('Global.reset')"
                type="reset"
                class="q-ml-sm"
                outline
                color="primary"
            />
        </div>
    </q-form>
</template>
