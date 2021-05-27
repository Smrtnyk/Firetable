import { defineComponent } from "vue";
import { QDialog } from "quasar";
import { useStore } from "src/store";

export default defineComponent({
    name: "EventInfo",

    components: {
        QDialog,
    },

    setup() {
        const store = useStore();

        return () => (
            <q-dialog
                model-value={store.state.events.showEventInfoModal}
                {...{
                    "onUpdate:model-value": () => {
                        store.commit(
                            "events/TOGGLE_EVENT_INFO_MODAL_VISIBILITY"
                        );
                    },
                }}
            >
                Event Info
            </q-dialog>
        );
    },
});
