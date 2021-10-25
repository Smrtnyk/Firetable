import { CreateGuestPayload } from "src/types/event";
import { defineComponent, ref, withDirectives } from "vue";

import { QCard, QBanner, QForm, QInput, QBtn, ClosePopup } from "quasar";

const GUEST: CreateGuestPayload = {
    name: "",
    confirmed: false,
    confirmedTime: null,
};

export default defineComponent({
    name: "EventGuestListCreateGuestForm",

    components: { QCard, QBanner, QForm, QInput, QBtn },

    emits: ["create"],

    setup(_, { emit }) {
        const guestName = ref("");

        const stringRules = [
            (val: string) => (val && val.length > 0) || "Please type something",
        ];

        function onSubmit() {
            emit("create", {
                ...GUEST,
                name: guestName.value,
            });
        }

        function onReset() {
            guestName.value = "";
        }

        return () => (
            <div
                style="max-width: 700px; width: 80vw"
                class="EventGuestListCreateGuestForm"
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
                                    [[ClosePopup]]
                                ),
                            default: () => "Add Guest",
                        }}
                    </q-banner>
                    <q-form
                        class="q-gutter-md q-pt-md q-pa-md"
                        onSubmit={onSubmit}
                        onReset={onReset}
                    >
                        <q-input
                            v-model={guestName.value}
                            standout
                            rounded
                            label="Guest name *"
                            hint="Name of the guest"
                            lazy-rules
                            rules={stringRules}
                        />

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
                                outline
                                label="Reset"
                                type="reset"
                                color="primary"
                                class="q-ml-sm"
                            />
                        </div>
                    </q-form>
                </q-card>
            </div>
        );
    },
});
