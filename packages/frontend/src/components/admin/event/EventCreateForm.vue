<script setup lang="ts">
import type {
    CreateEventForm,
    CreateEventPayload,
    EditEventPayload,
    EventDoc,
    EventFloorDoc,
    FloorDoc,
} from "@firetable/types";
import type { VForm } from "vuetify/components";

import { isDate } from "es-toolkit";
import AdminEventFloorManager from "src/components/admin/event/AdminEventFloorManager.vue";
import {
    createTodayUTCTimestamp,
    createUTCTimestamp,
    dateFromTimestamp,
    hourFromTimestamp,
} from "src/helpers/date-utils";
import {
    greaterThanZero,
    noEmptyString,
    requireNumber,
    validOptionalURL,
} from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { computed, ref, useTemplateRef, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

export interface EventCreateFormProps {
    event?: EventDoc | undefined;
    eventStartHours: string;
    floors: FloorDoc[];
    maxFloors: number;
    organisationId: string;
    propertyId: string;
    propertyName: string;
    propertyTimezone: string;
}

interface State {
    datePickerValue: Date;
    form: CreateEventForm;
    selectedFloors: EventFloorDoc[];
    selectedTime: string;
}

const props = defineProps<EventCreateFormProps>();
const emit = defineEmits<{
    (event: "create", payload: CreateEventPayload): void;
    (event: "update", payload: EditEventPayload): void;
}>();

const { locale, t } = useI18n();

const initialDate = createTodayUTCTimestamp(props.eventStartHours, props.propertyTimezone);

const eventObj: CreateEventForm = {
    date: initialDate,
    entryPrice: 0,
    guestListLimit: 100,
    img: "",
    name: "",
};

const isEditMode = computed(() => Boolean(props.event));
const form = useTemplateRef<VForm>("form");
const dateMenu = ref(false);
const timeMenu = ref(false);

const state = ref<State>({
    datePickerValue: new Date(initialDate),
    form: { ...eventObj },
    selectedFloors: [],
    selectedTime: props.eventStartHours,
});

function validDates(date: unknown): boolean {
    if (isEditMode.value) {
        return true;
    }
    if (!isDate(date)) {
        return false;
    }
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: props.propertyTimezone,
    });
    const propertyToday = new Date(formatter.format(today));
    propertyToday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= propertyToday;
}

watchEffect(() => {
    if (isEditMode.value && props.event) {
        const eventTimestamp = props.event.date;
        state.value.form = {
            date: eventTimestamp,
            entryPrice: props.event.entryPrice,
            guestListLimit: props.event.guestListLimit,
            img: props.event.img ?? "",
            name: props.event.name,
        };
        state.value.datePickerValue = new Date(eventTimestamp);
        state.value.selectedTime = hourFromTimestamp(
            eventTimestamp,
            locale.value,
            props.propertyTimezone,
        );
    } else {
        state.value.form = { ...eventObj };
        state.value.datePickerValue = new Date(initialDate);
        state.value.selectedTime = props.eventStartHours;
    }
});

watch(
    [() => state.value.datePickerValue, () => state.value.selectedTime],
    ([newPickerDate, newTime]) => {
        if (!newPickerDate) return;
        const dateStr = new Intl.DateTimeFormat("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(newPickerDate);
        state.value.form.date = createUTCTimestamp(dateStr, newTime, props.propertyTimezone);
    },
    { deep: true },
);

const displayedDate = computed(() => {
    if (!state.value.form.date) return "";
    const datePart = dateFromTimestamp(state.value.form.date, locale.value, props.propertyTimezone);
    const timePart = hourFromTimestamp(state.value.form.date, locale.value, props.propertyTimezone);
    return `${datePart} ${timePart}`;
});

function addFloor(floor: EventFloorDoc): void {
    state.value.selectedFloors.push({
        ...floor,
        order: state.value.selectedFloors.length,
    });
}

function onReset(): void {
    state.value.form = { ...eventObj };
    state.value.selectedFloors = [];
    state.value.datePickerValue = new Date(initialDate);
    state.value.selectedTime = props.eventStartHours;
}

async function onSubmit(): Promise<void> {
    const { valid } = (await form.value?.validate()) ?? { valid: false };
    if (!valid) return;
    if (isEditMode.value) {
        return validateAndEmitEdit();
    }
    return validateAndEmitCreate();
}

function removeFloor(index: number): void {
    state.value.selectedFloors.splice(index, 1);
    state.value.selectedFloors = state.value.selectedFloors.map((floor, idx) => {
        return { ...floor, order: idx };
    });
}

function reorderFloors(newFloors: EventFloorDoc[]): void {
    state.value.selectedFloors = newFloors.map((floor, idx) => {
        return { ...floor, order: idx };
    });
}

function updateDate(newDate: Date | null): void {
    if (!newDate) return;
    state.value.datePickerValue = newDate;
    dateMenu.value = false;
}

function updateTime(newTime: any): void {
    if (typeof newTime !== "string") return;
    state.value.selectedTime = newTime;
    timeMenu.value = false;
}

function validateAndEmitCreate(): void {
    if (state.value.selectedFloors.length === 0) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }
    emit("create", {
        ...state.value.form,
        floors: state.value.selectedFloors.map((floor) => ({ ...floor, id: floor.id })),
        guestListLimit: Number(state.value.form.guestListLimit),
        organisationId: props.organisationId,
        propertyId: props.propertyId,
    });
    onReset();
}

function validateAndEmitEdit(): void {
    emit("update", {
        ...state.value.form,
        guestListLimit: Number(state.value.form.guestListLimit),
        organisationId: props.organisationId,
        propertyId: props.propertyId,
    });
}
</script>

<template>
    <v-form
        ref="form"
        class="pa-4 d-flex flex-column"
        style="gap: 1rem"
        @submit.prevent="onSubmit"
        @reset.prevent="onReset"
        greedy
    >
        <v-text-field
            v-model="state.form.img"
            variant="outlined"
            :label="t('EventCreateForm.eventImgInputLabel')"
            :rules="[validOptionalURL()]"
        />

        <v-text-field
            v-model="state.form.name"
            variant="outlined"
            :label="t('EventCreateForm.eventNameInputLabel')"
            :rules="[noEmptyString()]"
        />

        <v-text-field
            v-model.number="state.form.guestListLimit"
            variant="outlined"
            type="number"
            :label="t('EventCreateForm.guestListLimitInputLabel')"
            :rules="[requireNumber(), greaterThanZero()]"
        />

        <v-text-field
            v-model.number="state.form.entryPrice"
            variant="outlined"
            type="number"
            :label="t('EventCreateForm.entryPriceInputLabel')"
            :rules="[requireNumber()]"
        />

        <v-text-field
            :label="t('EventCreateForm.inputDateTimeLabel')"
            :model-value="displayedDate"
            variant="outlined"
            readonly
            class="mb-4"
        >
            <template #prepend-inner>
                <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
                    <template #activator="{ props: menuProps }">
                        <v-icon
                            aria-label="Open date calendar"
                            icon="fas fa-calendar"
                            class="cursor-pointer"
                            v-bind="menuProps"
                        />
                    </template>
                    <v-date-picker
                        v-model="state.datePickerValue"
                        :allowed-dates="validDates"
                        @update:model-value="updateDate"
                    ></v-date-picker>
                </v-menu>
            </template>
            <template #append-inner>
                <v-menu v-model="timeMenu" :close-on-content-click="false" location="bottom end">
                    <template #activator="{ props: menuProps }">
                        <v-icon
                            aria-label="Open time picker"
                            icon="fas fa-clock"
                            class="cursor-pointer"
                            v-bind="menuProps"
                        />
                    </template>
                    <v-time-picker
                        v-model="state.selectedTime"
                        format="24hr"
                        @update:model-value="updateTime"
                    ></v-time-picker>
                </v-menu>
            </template>
        </v-text-field>

        <AdminEventFloorManager
            v-if="!isEditMode"
            :max-floors="props.maxFloors"
            :floors="state.selectedFloors"
            :available-floors="props.floors"
            @add="addFloor"
            @remove="removeFloor"
            @reorder="reorderFloors"
        />

        <div class="mt-4">
            <v-btn rounded="lg" size="large" type="submit" color="primary" flat>
                {{ t("Global.submit") }}
            </v-btn>
            <v-btn
                v-if="!isEditMode"
                rounded="lg"
                size="large"
                type="reset"
                class="ml-2"
                variant="outlined"
                color="primary"
            >
                {{ t("Global.reset") }}
            </v-btn>
        </div>
    </v-form>
</template>
