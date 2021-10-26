import { defineComponent, PropType, reactive, withDirectives } from "vue";

import { showErrorMessage } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";
import {
    greaterThanZero,
    noEmptyString,
    requireNumber,
} from "src/helpers/form-rules";
import { useRouter } from "vue-router";

import {
    QCard,
    QBanner,
    QForm,
    QFile,
    QInput,
    QCheckbox,
    QBtn,
    QIcon,
    QPopupProxy,
    QDate,
    QTime,
    QImg,
    QDialog,
    date,
    ClosePopup,
} from "quasar";
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

export default defineComponent({
    name: "EventCreateForm",

    components: {
        QCard,
        QBanner,
        QForm,
        QFile,
        QInput,
        QCheckbox,
        QBtn,
        QIcon,
        QPopupProxy,
        QDate,
        QTime,
        QImg,
        QDialog,
    },

    props: {
        floors: {
            type: Array as PropType<FloorDoc[]>,
            required: true,
        },
    },

    emits: ["create"],

    setup(props, { emit }) {
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

            const floors = props.floors.filter((floor) =>
                state.chosenFloors.includes(floor.id)
            );

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
                new Date(calendarDate).toISOString().substr(0, 10) >=
                new Date().toISOString().substr(0, 10)
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

        return () => (
            <q-dialog
                maximized
                model-value={eventsStore.showCreateEventModal}
                {...{
                    "onUpdate:model-value":
                        eventsStore.toggleEventCreateModalVisiblity,
                }}
            >
                <q-card>
                    <q-banner
                        inline-actions
                        rounded
                        class="bg-gradient text-white"
                    >
                        {{
                            avatar: () =>
                                withDirectives(
                                    <q-btn
                                        round
                                        class="q-mr-sm"
                                        flat
                                        icon="close"
                                    />,
                                    [[ClosePopup, 1]]
                                ),
                            default: () => "Create new event",
                        }}
                    </q-banner>

                    {!props.floors.length && (
                        <div class="column justify-center items-center q-mt-md">
                            <h6 class="text-h6 q-pa-md text-justify">
                                You cannot create events because you have no
                                floors!
                            </h6>
                            <q-btn
                                rounded
                                class="button-gradient q-mx-auto"
                                onClick={() => router.replace("/admin/floors")}
                                size="lg"
                            >
                                Go to map manager
                            </q-btn>
                            <q-img src="no-events.svg" />
                        </div>
                    )}

                    {!!props.floors.length && (
                        <>
                            {!!state.form.img && (
                                <q-img
                                    src={state.form.img}
                                    ratio={1}
                                    class="q-mb-md"
                                />
                            )}

                            <q-form
                                class="q-gutter-xs q-pt-md q-pa-md"
                                onSubmit={onSubmit}
                                onReset={onReset}
                            >
                                <q-file
                                    standout
                                    rounded
                                    v-model={state.capturedImage}
                                    accept="image/*"
                                    {...{ "onUpdate:modelValue": onFileChosen }}
                                    class="q-mb-lg"
                                >
                                    {{
                                        prepend: () => <q-icon name="camera" />,
                                    }}
                                </q-file>

                                <q-input
                                    v-model={state.form.name}
                                    rounded
                                    standout
                                    label="Event name*"
                                    lazy-rules
                                    rules={[noEmptyString()]}
                                />

                                <q-input
                                    v-model={state.form.guestListLimit}
                                    rounded
                                    standout
                                    type="number"
                                    label="Max number of guests"
                                    lazy-rules
                                    rules={[requireNumber(), greaterThanZero()]}
                                />

                                <q-input
                                    v-model={state.form.entryPrice}
                                    rounded
                                    standout
                                    type="number"
                                    label="Entry price, leave 0 if free"
                                    lazy-rules
                                    rules={[requireNumber()]}
                                />

                                <q-input
                                    v-model={state.form.date}
                                    rounded
                                    standout
                                    readonly
                                    class="q-mb-lg"
                                >
                                    {{
                                        prepend: () => (
                                            <>
                                                <q-icon
                                                    name="calendar"
                                                    class="cursor-pointer"
                                                />
                                                <q-popup-proxy
                                                    transition-show="scale"
                                                    transition-hide="scale"
                                                >
                                                    <q-date
                                                        v-model={
                                                            state.form.date
                                                        }
                                                        mask="DD-MM-YYYY HH:mm"
                                                        today-btn
                                                        options={validDates}
                                                    >
                                                        <div class="row items-center justify-end">
                                                            {withDirectives(
                                                                <q-btn
                                                                    label="Close"
                                                                    color="primary"
                                                                    flat
                                                                />,
                                                                [
                                                                    [
                                                                        ClosePopup,
                                                                        1,
                                                                    ],
                                                                ]
                                                            )}
                                                        </div>
                                                    </q-date>
                                                </q-popup-proxy>
                                            </>
                                        ),
                                        append: () => (
                                            <>
                                                <q-icon
                                                    name="clock"
                                                    class="cursor-pointer"
                                                />
                                                <q-popup-proxy
                                                    transition-show="scale"
                                                    transition-hide="scale"
                                                >
                                                    <q-time
                                                        v-model={
                                                            state.form.date
                                                        }
                                                        mask="DD-MM-YYYY HH:mm"
                                                        format24h
                                                    >
                                                        <div class="row items-center justify-end">
                                                            {withDirectives(
                                                                <q-btn
                                                                    label="Close"
                                                                    color="primary"
                                                                    flat
                                                                />,
                                                                [
                                                                    [
                                                                        ClosePopup,
                                                                        1,
                                                                    ],
                                                                ]
                                                            )}
                                                        </div>
                                                    </q-time>
                                                </q-popup-proxy>
                                            </>
                                        ),
                                    }}
                                </q-input>

                                <div class="q-gutter-sm q-mb-lg">
                                    <div>Floors:</div>
                                    <div>
                                        {props.floors.map((floor) => (
                                            <q-checkbox
                                                key={floor.id}
                                                v-model={state.chosenFloors}
                                                val={floor.id}
                                                label={floor.name}
                                                color="accent"
                                            />
                                        ))}
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
                        </>
                    )}
                </q-card>
            </q-dialog>
        );
    },
});
