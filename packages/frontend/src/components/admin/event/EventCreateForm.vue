<script setup lang="ts">
import type {
    CreateEventForm,
    CreateEventPayload,
    EditEventPayload,
    EventDoc,
    EventFloorDoc,
    FloorDoc,
} from "@firetable/types";

import { QForm } from "quasar";
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
    form: CreateEventForm;
    selectedDate: string;
    selectedFloors: EventFloorDoc[];
    selectedTime: string;
    showDateModal: boolean;
    showTimeModal: boolean;
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

const isEditMode = computed(function () {
    return Boolean(props.event);
});
const form = useTemplateRef<QForm>("form");
const state = ref<State>({
    form: { ...eventObj },
    selectedDate: dateFromTimestamp(Date.now(), locale.value, props.propertyTimezone),
    selectedFloors: [],
    selectedTime: props.eventStartHours,
    showDateModal: false,
    showTimeModal: false,
});

function validDates(calendarDate: string): boolean {
    if (isEditMode.value) {
        // In edit mode, allow all dates
        return true;
    }
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
            date: props.event.date,
            entryPrice: props.event.entryPrice,
            guestListLimit: props.event.guestListLimit,
            img: props.event.img ?? "",
            name: props.event.name,
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
    state.value.form.date = createUTCTimestamp(
        state.value.selectedDate,
        state.value.selectedTime,
        props.propertyTimezone,
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

function addFloor(floor: EventFloorDoc): void {
    state.value.selectedFloors.push({
        ...floor,
        order: state.value.selectedFloors.length,
    });
}

function onReset(): void {
    state.value.form = { ...eventObj };
    state.value.selectedFloors = [];
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

function removeFloor(index: number): void {
    state.value.selectedFloors.splice(index, 1);
    state.value.selectedFloors = state.value.selectedFloors.map(function (floor, idx) {
        return {
            ...floor,
            order: idx,
        };
    });
}

function reorderFloors(newFloors: EventFloorDoc[]): void {
    state.value.selectedFloors = newFloors.map(function (floor, idx) {
        return {
            ...floor,
            order: idx,
        };
    });
}

function validateAndEmitCreate(): void {
    if (state.value.selectedFloors.length === 0) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }

    emit("create", {
        ...state.value.form,
        floors: state.value.selectedFloors.map(function (floor) {
            return { ...floor, id: floor.id };
        }),
        guestListLimit: Number(state.value.form.guestListLimit),
        organisationId: props.organisationId,
        propertyId: props.propertyId,
    });
    state.value.form = eventObj;
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
    <q-form
        ref="form"
        class="q-gutter-xs q-pt-md q-pa-md"
        @submit="onSubmit"
        @reset="onReset"
        greedy
    >
        <q-input
            v-model="state.form.img"
            outlined
            :label="t('EventCreateForm.eventImgInputLabel')"
            lazy-rules
            :rules="[validOptionalURL()]"
        />

        <q-input
            v-model="state.form.name"
            outlined
            :label="t('EventCreateForm.eventNameInputLabel')"
            lazy-rules
            :rules="[noEmptyString()]"
        />

        <q-input
            v-model.number="state.form.guestListLimit"
            outlined
            type="number"
            :label="t('EventCreateForm.guestListLimitInputLabel')"
            lazy-rules
            :rules="[requireNumber(), greaterThanZero()]"
        />

        <q-input
            v-model.number="state.form.entryPrice"
            outlined
            type="number"
            :label="t('EventCreateForm.entryPriceInputLabel')"
            lazy-rules
            :rules="[requireNumber()]"
        />

        <q-input
            :label="t('EventCreateForm.inputDateTimeLabel')"
            v-model="displayedDate"
            outlined
            readonly
            class="q-mb-lg"
        >
            <template #prepend>
                <q-icon
                    aria-label="Open date calendar"
                    name="fa fa-calendar"
                    class="cursor-pointer"
                />
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
                <q-icon name="fa fa-clock" aria-label="Open time picker" class="cursor-pointer" />
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

        <AdminEventFloorManager
            v-if="!isEditMode"
            :max-floors="props.maxFloors"
            :floors="state.selectedFloors"
            :available-floors="props.floors"
            @add="addFloor"
            @remove="removeFloor"
            @reorder="reorderFloors"
        />

        <div class="q-mt-md">
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
