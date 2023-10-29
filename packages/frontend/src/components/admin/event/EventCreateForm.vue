<script setup lang="ts">
import { reactive, computed, ref } from "vue";

import { useI18n } from "vue-i18n";
import { greaterThanZero, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { useRouter } from "vue-router";

import { date, QForm } from "quasar";
import { CreateEventForm, CreateEventPayload } from "@firetable/types";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { PropertyFloors } from "src/composables/useFloors";

interface State {
    form: CreateEventForm;
    chosenFloors: string[];
    showDateModal: boolean;
    showTimeModal: boolean;
}

interface Props {
    property: PropertyFloors;
}

const { formatDate } = date;
const newDate = new Date();
newDate.setHours(22);
newDate.setMinutes(0);

const eventObj: CreateEventForm = {
    name: "",
    date: formatDate(newDate, "DD-MM-YYYY HH:mm"),
    guestListLimit: 100,
    img: "",
    entryPrice: 0,
};
const props = defineProps<Props>();
const emit = defineEmits<{
    (event: "create", payload: CreateEventPayload): void;
}>();
const { t } = useI18n();
const router = useRouter();
const form = ref<QForm>();
const state = reactive<State>({
    form: { ...eventObj },
    chosenFloors: [],
    showDateModal: false,
    showTimeModal: false,
});

const totalFloors = computed(() => {
    return props.property.floors.length;
});

function onSubmit() {
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

    if (!form.value?.validate()) {
        return;
    }

    emit("create", {
        ...state.form,
        propertyId: props.property.propertyId,
        organisationId: props.property.organisationId,
        img: state.form.img,
        floors: selectedFloors,
    });
    state.form = eventObj;
}

function onReset() {
    state.form = { ...eventObj };
}

function validDates(calendarDate: string) {
    return (
        new Date(calendarDate).toISOString().substring(0, 10) >=
        new Date().toISOString().substring(0, 10)
    );
}
</script>

<template>
    <div class="column justify-center items-center q-pa-md" v-if="!totalFloors">
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
        <q-img v-if="state.form.img" :src="state.form.img" :ratio="1" class="q-mb-md" />

        <q-form ref="form" class="q-gutter-xs q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
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

            <q-input v-model="state.form.date" rounded standout readonly class="q-mb-lg">
                <template #prepend>
                    <q-icon name="calendar" class="cursor-pointer" />
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-date
                            v-model="state.form.date"
                            mask="DD-MM-YYYY HH:mm"
                            today-btn
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
                        <q-time v-model="state.form.date" mask="DD-MM-YYYY HH:mm" format24h>
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

            <div class="q-gutter-sm q-mb-lg">
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
