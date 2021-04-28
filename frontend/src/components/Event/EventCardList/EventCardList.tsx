import { EventCard } from "components/Event/EventCard";
import { defineComponent, PropType } from "vue";
import { EventDoc } from "src/types/event";

export default defineComponent({
    name: "EventCardList",

    components: { EventCard },

    props: {
        events: {
            required: true,
            type: Array as PropType<EventDoc[]>,
        },
    },

    setup(props) {
        return () => (
            <div class="EventCardList">
                <div class="row">
                    {props.events.map((event) => (
                        <div class="col-12 col-sm-6 q-pa-xs" key={event.id}>
                            <EventCard event={event} />
                        </div>
                    ))}
                </div>
            </div>
        );
    },
});
