import { computed, defineComponent, PropType, ref } from "vue";
import { IForm } from "src/types/generic";
import {
    useDialogPluginComponent,
    QForm,
    QDialog,
    QCard,
    QCardSection,
    QCardActions,
    QBtn,
    QInput,
} from "quasar";
import { noEmptyString } from "src/helpers/form-rules";

export default defineComponent({
    name: "AddTableDialog",

    components: {
        QForm,
        QDialog,
        QCard,
        QCardSection,
        QCardActions,
        QBtn,
        QInput,
    },

    props: {
        ids: {
            type: Array as PropType<string[]>,
            required: true,
        },
        id: {
            type: String,
            required: false,
            default: "",
        },
    },

    emits: [...useDialogPluginComponent.emits],

    setup(props) {
        const addTableForm = ref<IForm | null>(null);

        const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
            useDialogPluginComponent();

        const tableId = ref<string>(
            props.id || String(props.ids.length + 1) || ""
        );

        const tableIdRules = [
            noEmptyString(),
            (val: string) =>
                !props.ids.includes(val) ||
                props.id === tableId.value ||
                "Id is taken",
        ];

        async function onOKClick() {
            if (!addTableForm.value || !(await addTableForm.value.validate()))
                return;

            onDialogOK(tableId.value);
        }

        return () => (
            <q-dialog ref={dialogRef} persistent onHide={onDialogHide}>
                <q-card class="q-dialog-plugin AddTableDialog">
                    <q-card-section>
                        <div class="text-h6">Table ID</div>
                    </q-card-section>

                    <q-card-section>
                        <q-form ref={addTableForm} class="q-gutter-md">
                            <q-input
                                v-model={tableId.value}
                                rounded
                                standout
                                autofocus
                                rules={tableIdRules}
                            />
                        </q-form>
                    </q-card-section>

                    <q-card-actions align="right">
                        <q-btn
                            rounded
                            class="button-gradient"
                            size="md"
                            label="OK"
                            onClick={onOKClick}
                        />
                        <q-btn
                            rounded
                            color="negative"
                            label="Cancel"
                            onClick={onDialogCancel}
                        />
                    </q-card-actions>
                </q-card>
            </q-dialog>
        );
    },
});
