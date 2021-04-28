import { defineComponent } from "vue";
import { QDialog } from "quasar";

export default defineComponent({
    name: "EventInfo",

    components: {
        QDialog,
    },

    props: {
        showEventInfoDialog: {
            type: Boolean,
            required: true,
        },
    },

    setup(props) {
        return () => (
            <q-dialog model-value={props.showEventInfoDialog}>
                Event Info
            </q-dialog>
        );
    },
});
