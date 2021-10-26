import { defineComponent } from "vue";
import { QDialog } from "quasar";
import { useEventsStore } from "src/stores/events-store";

export default defineComponent({
    name: "EventInfo",

    components: {
        QDialog,
    },

    setup() {
        const eventsStore = useEventsStore();

        return () => (
            <q-dialog
                model-value={eventsStore.showEventInfoModal}
                {...{
                    "onUpdate:model-value":
                        eventsStore.toggleEventInfoModalVisibility,
                }}
            >
                Event Info
            </q-dialog>
        );
    },
});
