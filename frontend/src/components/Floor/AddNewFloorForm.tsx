import { defineComponent, ref, withDirectives } from "vue";
import { noEmptyString } from "src/helpers/form-rules";

import { QCard, QBanner, QForm, QInput, QBtn, ClosePopup } from "quasar";

const FLOOR = {
    name: "",
};

export default defineComponent({
    name: "AddNewFloorForm",

    components: { QCard, QBanner, QForm, QInput, QBtn },

    emits: ["create"],

    setup(_, { emit }) {
        const form = ref({ ...FLOOR });

        function onSubmit() {
            emit("create", form.value);
        }

        function onReset() {
            form.value = { ...FLOOR };
        }

        return () => (
            <div style="max-width: 700px; width: 80vw" class="AddNewFloorForm">
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
                            default: () => "Add New Floor",
                        }}
                    </q-banner>
                    <q-form
                        class="q-gutter-md q-pt-md q-pa-md"
                        onSubmit={onSubmit}
                        onReset={onReset}
                    >
                        <q-input
                            v-model={form.value.name}
                            standout
                            rounded
                            label="Floor name *"
                            lazy-rules
                            rules={[noEmptyString()]}
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
