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

import AdminEventFloorManager from "src/components/admin/event/AdminEventFloorManager.vue";
import {
    greaterThanZero,
    noEmptyString,
    requireNumber,
    validOptionalURL,
} from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { computed, ref, useTemplateRef, watchEffect } from "vue";
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

const { t } = useI18n();

function createInitialDate(): number {
    const now = new Date();
    const [hours, minutes] = props.eventStartHours.split(":").map(Number);
    now.setHours(hours, minutes, 0, 0);
    return now.getTime();
}

const eventObj: CreateEventForm = {
    date: createInitialDate(),
    entryPrice: 0,
    guestListLimit: 100,
    img: "",
    name: "",
};

const isEditMode = computed(function () {
    return Boolean(props.event);
});

const form = useTemplateRef<VForm>("form");
const dateMenu = ref(false);
const timeMenu = ref(false);

const state = ref<State>({
    datePickerValue: new Date(),
    form: { ...eventObj },
    selectedFloors: [],
    selectedTime: props.eventStartHours,
});

function validDates(date: unknown): boolean {
    if (isEditMode.value) return true;
    if (!(date instanceof Date)) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date >= today;
}

watchEffect(function () {
    if (isEditMode.value && props.event) {
        const editDate = new Date(props.event.date);
        state.value.form = {
            date: props.event.date,
            entryPrice: props.event.entryPrice,
            guestListLimit: props.event.guestListLimit,
            img: props.event.img ?? "",
            name: props.event.name,
        };
        state.value.datePickerValue = editDate;
        state.value.selectedTime = `${String(editDate.getHours()).padStart(2, "0")}:${String(editDate.getMinutes()).padStart(2, "0")}`;
    } else {
        state.value.form = { ...eventObj };
        state.value.datePickerValue = new Date();
        state.value.selectedTime = props.eventStartHours;
    }
});

function updateDate(newDate: Date | Date[] | null): void {
    if (!newDate || Array.isArray(newDate)) return;

    state.value.datePickerValue = newDate;
    updateFormDate();
    dateMenu.value = false;
}

function updateFormDate(): void {
    const date = new Date(state.value.datePickerValue);
    const [hours, minutes] = state.value.selectedTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    state.value.form.date = date.getTime();
}

function updateTime(newTime: unknown): void {
    if (typeof newTime !== "string") return;

    state.value.selectedTime = newTime;
    updateFormDate();
    timeMenu.value = false;
}

const displayedDate = computed(function () {
    if (!state.value.form.date) return "";

    const date = new Date(state.value.form.date);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}`;
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
    state.value.datePickerValue = new Date();
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
    state.value.selectedFloors = state.value.selectedFloors.map(function (floor, idx) {
        return { ...floor, order: idx };
    });
}

function reorderFloors(newFloors: EventFloorDoc[]): void {
    state.value.selectedFloors = newFloors.map(function (floor, idx) {
        return { ...floor, order: idx };
    });
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
