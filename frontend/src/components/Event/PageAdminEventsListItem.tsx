import { formatEventDate } from "src/helpers/utils";
import { defineComponent, PropType } from "vue";
import { EventDoc } from "src/types";

import { QSlideItem, QItem, QItemSection, QItemLabel, QIcon } from "quasar";

export default defineComponent({
    name: "PageAdminEventsListItem",

    components: { QSlideItem, QItem, QItemSection, QItemLabel, QIcon },

    props: {
        event: {
            type: Object as PropType<EventDoc>,
            required: true,
        },
    },

    emits: ["right"],

    setup(props, { emit }) {
        return () => (
            <q-slide-item
                right-color="warning"
                onRight={({ reset }: { reset: () => void }) =>
                    emit("right", { event: props.event, reset })
                }
                class="fa-card"
            >
                {{
                    right: () => <q-icon name="trash" />,
                    default: () => (
                        <q-item
                            to={{
                                name: "adminEvent",
                                params: { id: props.event.id },
                            }}
                        >
                            <q-item-section>
                                <q-item-label>{props.event.name}</q-item-label>
                            </q-item-section>

                            <q-item-section side top>
                                <q-item-label caption>
                                    {formatEventDate(props.event.date)}
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                    ),
                }}
            </q-slide-item>
        );
    },
});
