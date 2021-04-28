import { defineComponent, PropType, reactive, ref, toRefs } from "vue";
import { IForm } from "src/types/generic";
import { useI18n } from "vue-i18n";
import { useDialogPluginComponent } from "quasar";

import {
    QDialog,
    QCard,
    QBanner,
    QCardSection,
    QForm,
    QSelect,
    QInput,
    QBtn,
} from "quasar";
import {
    minLength,
    noEmptyString,
    requireNumber,
} from "src/helpers/form-rules";

interface State {
    guestName: string;
    numberOfGuests: number;
    guestContact: string;
    reservationNote: string;
    groupedWith: string[];
}

export default defineComponent({
    name: "EventCreateReservation",

    components: {
        QDialog,
        QCard,
        QBanner,
        QCardSection,
        QForm,
        QSelect,
        QInput,
        QBtn,
    },

    props: {
        tableId: {
            type: String,
            required: true,
        },
        freeTables: {
            type: Array as PropType<string[]>,
            required: true,
        },
    },

    emits: [...useDialogPluginComponent.emits],

    setup(props) {
        const { t } = useI18n();
        const state = reactive<State>({
            guestName: "",
            numberOfGuests: 2,
            guestContact: "",
            reservationNote: "",
            groupedWith: [],
        });

        const reservationForm = ref<IForm | null>(null);

        const {
            dialogRef,
            onDialogHide,
            onDialogCancel,
            onDialogOK,
        } = useDialogPluginComponent();

        async function onOKClick() {
            if (!(await reservationForm.value?.validate())) return;

            state.groupedWith.push(props.tableId);

            onDialogOK(state);
        }

        return () => (
            <q-dialog
                ref={dialogRef}
                persistent
                onHide={onDialogHide}
                maximized
            >
                <q-card class="q-dialog-plugin AddTableDialog">
                    <q-banner
                        inline-actions
                        rounded
                        class="bg-gradient text-white"
                    >
                        {{
                            avatar: () => (
                                <q-btn
                                    round
                                    flat
                                    icon="close"
                                    onClick={onDialogCancel}
                                />
                            ),
                            default: () => "TABLE" + props.tableId,
                        }}
                    </q-banner>

                    <q-card-section>
                        <q-form ref={reservationForm} class="q-gutter-md">
                            {!!props.freeTables.length && (
                                <q-select
                                    v-model={state.groupedWith}
                                    hint={t(
                                        `EventCreateReservation.reservationGroupWithHint`
                                    )}
                                    standout
                                    rounded
                                    multiple
                                    options={props.freeTables}
                                    label={t(
                                        `EventCreateReservation.reservationGroupWith`
                                    )}
                                    dropdown-icon="selector"
                                />
                            )}

                            <q-input
                                v-model={state.guestName}
                                rounded
                                hide-bottom-space
                                standout
                                label={t(
                                    `EventCreateReservation.reservationGuestName`
                                )}
                                lazy-rules="ondemand"
                                rules={[
                                    noEmptyString(),
                                    minLength("Name must be longer!", 2),
                                ]}
                            />

                            <q-input
                                v-model={state.numberOfGuests}
                                hide-bottom-space
                                rounded
                                standout
                                type="number"
                                label={t(
                                    `EventCreateReservation.reservationNumberOfGuests`
                                )}
                                lazy-rules="ondemand"
                                rules={[requireNumber()]}
                            />

                            <q-input
                                v-model={state.guestContact}
                                rounded
                                standout
                                class="q-mb-md"
                                label={t(
                                    `EventCreateReservation.reservationGuestContact`
                                )}
                            />

                            <q-input
                                v-model={state.reservationNote}
                                rounded
                                standout
                                label="Note"
                            />

                            <div>
                                <q-btn
                                    rounded
                                    size="md"
                                    class="button-gradient"
                                    onClick={onOKClick}
                                >
                                    {t(
                                        "EventCreateReservation.reservationCreateBtn"
                                    )}
                                </q-btn>
                            </div>
                        </q-form>
                    </q-card-section>
                </q-card>
            </q-dialog>
        );
    },
});
