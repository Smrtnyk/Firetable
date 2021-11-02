<script setup lang="ts">
import { reactive } from "vue";

import { showErrorMessage } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";
import { greaterThanZero, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { useRouter } from "vue-router";

import { date } from "quasar";
import { CreateEventForm } from "src/types/event";
import { FloorDoc } from "src/types/floor";
import { useEventsStore } from "src/stores/events-store";
import { resizeImage } from "src/helpers/image-tools";

interface State {
    form: CreateEventForm;
    chosenFloors: string[];
    capturedImage: string[];
    showDateModal: boolean;
    showTimeModal: boolean;
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

interface Props {
    floors: FloorDoc[];
}
const props = defineProps<Props>();
const emit = defineEmits(["create"]);

const { t } = useI18n();

const router = useRouter();
const eventsStore = useEventsStore();

const state = reactive<State>({
    form: { ...eventObj },
    chosenFloors: [],
    capturedImage: [],
    showDateModal: false,
    showTimeModal: false,
});

function onSubmit() {
    if (!state.chosenFloors.length) {
        showErrorMessage(t("EventCreateForm.noChosenFloorsMessage"));
        return;
    }

    const floors = props.floors.filter((floor) => state.chosenFloors.includes(floor.id));

    emit("create", {
        ...state.form,
        img: state.form.img,
        floors,
    });
    state.form = eventObj;
}

function onReset() {
    state.form = { ...eventObj };
}

function validDates(calendarDate: Date) {
    return (
        new Date(calendarDate).toISOString().substr(0, 10) >= new Date().toISOString().substr(0, 10)
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
    <q-dialog
        class="no-padding"
        :model-value="eventsStore.showCreateEventModal"
        @update:model-value="eventsStore.toggleEventCreateModalVisiblity"
    >
        <div class="limited-width">
            <q-card>
                <q-banner inline-actions rounded class="bg-gradient text-white">
                    <template #avatar>
                        <q-btn round class="q-mr-sm" flat icon="close" v-close-popup />
                    </template>
                    Create new event
                </q-banner>

                <div class="column justify-center items-center q-mt-md" v-if="!props.floors.length">
                    <h6 class="text-h6 q-pa-md text-justify">
                        You cannot create events because you have no floors!
                    </h6>
                    <q-btn
                        rounded
                        class="button-gradient q-mx-auto"
                        @click="() => router.replace('/admin/floors')"
                        size="lg"
                    >
                        Go to map manager
                    </q-btn>
                    <q-img src="no-events.svg" />
                </div>

                <template v-if="props.floors.length">
                    <q-img v-if="state.form.img" src="state.form.img" :ratio="1" class="q-mb-md" />

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

                        <q-input
                            v-model="state.form.date"
                            rounded
                            standout
                            readonly
                            class="q-mb-lg"
                        >
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
                                                label="Close"
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
                                        v-model="state.form.date"
                                        mask="DD-MM-YYYY HH:mm"
                                        format24h
                                    >
                                        <div class="row items-center justify-end">
                                            <q-btn
                                                label="Close"
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
                            <div>Floors:</div>
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
                                label="Submit"
                                type="submit"
                                class="button-gradient"
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
            </q-card>
        </div>
    </q-dialog>
</template>
