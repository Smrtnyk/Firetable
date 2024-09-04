<script setup lang="ts">
import type {
    CreateEventForm,
    CreateEventPayload,
    EditEventPayload,
    EventDoc,
} from "@firetable/types";
import type { PropertyFloors } from "src/composables/useFloors";
import { computed, ref, watch, watchEffect } from "vue";

import { useI18n } from "vue-i18n";
import {
    greaterThanZero,
    noEmptyString,
    requireNumber,
    validOptionalURL,
} from "src/helpers/form-rules";
import { useRouter } from "vue-router";

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

interface Props {
    property: PropertyFloors;
    event?: EventDoc;
    eventStartHours: string;
}

const now = new Date();
const newDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0),
);

const eventObj: CreateEventForm = {
    name: "",
    date: newDate.getTime(),
    guestListLimit: 100,
    entryPrice: 0,
    img: "",
};
const props = defineProps<Props>();
const emit = defineEmits<{
    (event: "create", payload: CreateEventPayload): void;
    (event: "update", payload: EditEventPayload): void;
}>();

const isEditMode = computed(() => Boolean(props.event));
const { t } = useI18n();
const router = useRouter();
const form = ref<QForm>();
const state = ref<State>({
    form: { ...eventObj },
    chosenFloors: [],
    showDateModal: false,
    showTimeModal: false,
    selectedDate: dateFromTimestamp(Date.now()),
    selectedTime: props.eventStartHours,
});

function validDates(calendarDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(calendarDate);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck >= today;
}

// In your setup or watchEffect where you determine if you're in edit mode
watchEffect(() => {
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
        state.value.selectedDate = dateFromTimestamp(editDate.getTime());
        state.value.selectedTime = hourFromTimestamp(editDate.getTime());
    } else {
        state.value.form = { ...eventObj };
        state.value.selectedDate = dateFromTimestamp(Date.now());
        state.value.selectedTime = props.eventStartHours;
    }
});

watch([() => state.value.selectedDate, () => state.value.selectedTime], () => {
    if (!state.value.selectedDate) {
        return;
    }
    const [dayVal, monthVal, yearVal] = state.value.selectedDate.split(".");
    const combinedDateTime = `${yearVal}-${monthVal}-${dayVal}T${state.value.selectedTime}:00Z`;
    state.value.form.date = new Date(combinedDateTime).getTime();
});

function updateDate(newDateVal: any): void {
    state.value.selectedDate = newDateVal;
}

function updateTime(newTime: any): void {
    state.value.selectedTime = newTime;
}

const displayedDate = computed(() => {
    return `${state.value.selectedDate} ${state.value.selectedTime}`;
});

const totalFloors = computed(() => {
    return props.property.floors.length;
});

async function validateAndEmitCreate(): Promise<void> {
    if (state.value.chosenFloors.length === 0) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }

    const selectedFloors = Object.values(props.property.floors).filter((floor) =>
        state.value.chosenFloors.includes(floor.id),
    );

    if (selectedFloors.length === 0) {
        showErrorMessage(t("EventCreateForm.selectedFloorNotFoundMessage"));
        return;
    }

    emit("create", {
        ...state.value.form,
        guestListLimit: Number(state.value.form.guestListLimit),
        propertyId: props.property.propertyId,
        organisationId: props.property.organisationId,
        floors: selectedFloors,
    });
    state.value.form = eventObj;
}

async function validateAndEmitEdit(): Promise<void> {
    emit("update", {
        ...state.value.form,
        guestListLimit: Number(state.value.form.guestListLimit),
        propertyId: props.property.propertyId,
        organisationId: props.property.organisationId,
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
}
</script>

<template>
    <div class="column justify-center items-center q-pa-md" v-if="!totalFloors && !props.event">
        <h6 class="q-ma-sm text-weight-bolder underline">
            {{ t("EventCreateForm.noFloorPlansMessage") }}
        </h6>
        <q-btn
            rounded
            class="button-gradient q-mx-auto"
            @click="() => router.replace('/admin/floors')"
            v-close-popup
            size="lg"
        >
            {{ t("EventCreateForm.goToFloorPlannerMessage") }}
        </q-btn>
    </div>

    <template v-else>
        <q-form ref="form" class="q-gutter-xs q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
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

            <q-input v-model="displayedDate" rounded standout readonly class="q-mb-lg">
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
                <div class="text-h6">{{ props.property.propertyName }}</div>
                <div>
                    <q-checkbox
                        v-for="floor in props.property.floors"
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
                    :label="t('EventCreateForm.submitButtonLabel')"
                    type="submit"
                    class="button-gradient"
                />
                <q-btn
                    v-if="!isEditMode"
                    rounded
                    size="md"
                    :label="t('EventCreateForm.resetButtonLabel')"
                    type="reset"
                    class="q-ml-sm"
                    outline
                    color="primary"
                />
            </div>
        </q-form>
    </template>
</template>
