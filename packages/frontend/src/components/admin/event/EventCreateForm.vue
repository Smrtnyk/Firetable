<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from "vue";

import { useI18n } from "vue-i18n";
import {
    greaterThanZero,
    noEmptyString,
    requireNumber,
    validOptionalURL,
} from "src/helpers/form-rules";
import { useRouter } from "vue-router";

import { QForm } from "quasar";
import { CreateEventForm, CreateEventPayload, EditEventPayload, EventDoc } from "@firetable/types";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { PropertyFloors } from "src/composables/useFloors";
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
}

const now = new Date();
const newDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0),
);
const [year, month, day] = newDate.toISOString().split("T")[0].split("-");

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

const isEditMode = computed(() => !!props.event);
const { t } = useI18n();
const router = useRouter();
const form = ref<QForm>();
const state = reactive<State>({
    form: { ...eventObj },
    chosenFloors: [],
    showDateModal: false,
    showTimeModal: false,
    selectedDate: `${day}-${month}-${year}`,
    selectedTime: hourFromTimestamp(newDate.getTime()),
});

// In your setup or watchEffect where you determine if you're in edit mode
watchEffect(() => {
    if (isEditMode.value && props.event) {
        // Use event data if in edit mode
        const editDate = new Date(props.event.date);
        state.form = {
            name: props.event.name,
            guestListLimit: props.event.guestListLimit,
            entryPrice: props.event.entryPrice,
            img: props.event.img,
            date: props.event.date,
        };
        state.selectedDate = dateFromTimestamp(editDate.getTime());
        state.selectedTime = hourFromTimestamp(editDate.getTime());
    } else {
        state.form = { ...eventObj };
        state.selectedDate = `${day}-${month}-${year}`;
        state.selectedTime = hourFromTimestamp(newDate.getTime());
    }
});

watch([() => state.selectedDate, () => state.selectedTime], () => {
    const [dayVal, monthVal, yearVal] = state.selectedDate.split("-");
    const combinedDateTime = `${yearVal}-${monthVal}-${dayVal}T${state.selectedTime}:00Z`;
    state.form.date = new Date(combinedDateTime).getTime();
});

function updateDate(newDateVal: any): void {
    state.selectedDate = newDateVal;
}

function updateTime(newTime: any): void {
    state.selectedTime = newTime;
}

const displayedDate = computed(() => {
    return `${state.selectedDate} ${state.selectedTime}`;
});

const totalFloors = computed(() => {
    return props.property.floors.length;
});

async function validateAndEmitCreate(): Promise<void> {
    if (!state.chosenFloors.length) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }

    const selectedFloors = Object.values(props.property.floors).filter((floor) =>
        state.chosenFloors.includes(floor.id),
    );

    if (!selectedFloors.length) {
        showErrorMessage(t("EventCreateForm.selectedFloorNotFoundMessage"));
        return;
    }

    emit("create", {
        ...state.form,
        guestListLimit: Number(state.form.guestListLimit),
        propertyId: props.property.propertyId,
        organisationId: props.property.organisationId,
        floors: selectedFloors,
    });
    state.form = eventObj;
}

async function validateAndEmitEdit(): Promise<void> {
    emit("update", {
        ...state.form,
        guestListLimit: Number(state.form.guestListLimit),
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
    state.form = { ...eventObj };
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
                v-model="state.form.guestListLimit"
                rounded
                standout
                type="number"
                :label="t('EventCreateForm.guestListLimitInputLabel')"
                lazy-rules
                :rules="[requireNumber(), greaterThanZero()]"
            />

            <q-input
                v-model="state.form.entryPrice"
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
                            v-model="state.selectedDate"
                            mask="DD-MM-YYYY"
                            today-btn
                            @update:model-value="updateDate"
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
