<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";

import { useI18n } from "vue-i18n";
import { greaterThanZero, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { useRouter } from "vue-router";

import { date } from "quasar";
import { resizeImage } from "src/helpers/image-tools";
import { CreateEventForm, CreateEventPayload } from "@firetable/types";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { PropertyFloors } from "src/composables/useFloors";

interface State {
    form: CreateEventForm;
    chosenFloor: string | null;
    capturedImage: string[];
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
const state = reactive<State>({
    form: { ...eventObj },
    chosenFloor: null,
    capturedImage: [],
    showDateModal: false,
    showTimeModal: false,
});

const totalFloors = computed(() => {
    return props.property.floors.length;
});

onMounted(() => {
    console.log(props.property.floors);
});

function onSubmit() {
    if (!state.chosenFloor) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }

    const selectedFloor = Object.values(props.property.floors).find(
        (floor) => floor.id === state.chosenFloor,
    );

    if (!selectedFloor) {
        showErrorMessage("Selected floor not found.");
        return;
    }

    emit("create", {
        ...state.form,
        propertyId: selectedFloor.propertyId,
        img: state.form.img,
        floors: [selectedFloor],
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

async function onFileChosen(chosenFile: File) {
    if (!chosenFile) return;

    try {
        const file = await resizeImage(chosenFile, {
            width: 600,
            height: 600,
        });

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64data = reader.result;
            if (!base64data) return;
            state.form.img = base64data.toString();
        };
    } catch (e) {
        showErrorMessage(e);
    }
}
</script>

<template>
    <div class="column justify-center items-center q-pa-md" v-if="!totalFloors">
        <h6 class="q-ma-sm text-weight-bolder underline">
            You cannot create events because you have no floors!
        </h6>
        <q-btn
            rounded
            class="button-gradient q-mx-auto"
            @click="() => router.replace('/admin/floors')"
            v-close-popup
            size="lg"
        >
            Go to floor manager
        </q-btn>
    </div>

    <template v-else>
        <q-img v-if="state.form.img" :src="state.form.img" :ratio="1" class="q-mb-md" />

        <q-form class="q-gutter-xs q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
            <q-file
                standout
                rounded
                v-model="state.capturedImage"
                accept="image/*"
                @update:model-value="onFileChosen"
                class="q-mb-lg"
            >
                <template #prepend>
                    <q-icon name="camera" />
                </template>
            </q-file>

            <q-input
                v-model="state.form.name"
                rounded
                standout
                label="Event name*"
                lazy-rules
                :rules="[noEmptyString()]"
            />

            <q-input
                v-model="state.form.guestListLimit"
                rounded
                standout
                type="number"
                label="Max number of guests"
                lazy-rules
                :rules="[requireNumber(), greaterThanZero()]"
            />

            <q-input
                v-model="state.form.entryPrice"
                rounded
                standout
                type="number"
                label="Entry price, leave 0 if free"
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
                                <q-btn label="Close" color="primary" flat v-close-popup />
                            </div>
                        </q-date>
                    </q-popup-proxy>
                </template>
                <template #append>
                    <q-icon name="clock" class="cursor-pointer" />
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-time v-model="state.form.date" mask="DD-MM-YYYY HH:mm" format24h>
                            <div class="row items-center justify-end">
                                <q-btn label="Close" color="primary" flat v-close-popup />
                            </div>
                        </q-time>
                    </q-popup-proxy>
                </template>
            </q-input>

            <div class="q-gutter-sm q-mb-lg">
                <div class="text-h6">{{ props.property.propertyName }}</div>
                <div>
                    <q-radio
                        v-for="floor in props.property.floors"
                        :key="floor.id"
                        v-model="state.chosenFloor"
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
                    label="Submit"
                    type="submit"
                    class="button-gradient"
                    v-close-popup
                />
                <q-btn
                    rounded
                    size="md"
                    label="Reset"
                    type="reset"
                    class="q-ml-sm"
                    outline
                    color="primary"
                />
            </div>
        </q-form>
    </template>
</template>
