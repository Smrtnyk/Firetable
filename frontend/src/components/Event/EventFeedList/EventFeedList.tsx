import { defineComponent, PropType, withDirectives } from "vue";
import { formatEventDate } from "src/helpers/utils";

import { Ripple, QItem, QItemSection, QItemLabel, QList } from "quasar";
import { EventFeedDoc } from "src/types/event";

export default defineComponent({
    name: "EventFeedList",

    components: { QItem, QItemSection, QItemLabel, QList },

    props: {
        eventFeed: {
            type: Array as PropType<EventFeedDoc[]>,
            required: true,
        },
    },
    setup(props) {
        return () => (
            <q-list bordered separator>
                {props.eventFeed.map((action, index) =>
                    withDirectives(
                        <q-item key={index}>
                            <q-item-section>
                                <q-item-label>{action.body}</q-item-label>
                                <q-item-label caption>
                                    {formatEventDate(action.timestamp)}
                                </q-item-label>
                            </q-item-section>
                        </q-item>,
                        [[Ripple]]
                    )
                )}
            </q-list>
        );
    },
});
