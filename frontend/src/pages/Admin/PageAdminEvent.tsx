import {
    FloorDoc,
    TableElement,
    Collection,
    EventDoc,
    EventFeedDoc,
} from "src/types";
import { defineComponent, onMounted, computed } from "vue";
import { isTable } from "src/floor-manager/type-guards";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils";
import { useFirestore } from "src/composables/useFirestore";

import { FTTitle } from "components/FTTitle";
import { EventFeedList } from "components/Event/EventFeedList";
import { EventTablesInfoRadarChart } from "components/Event/EventTablesInfoRadarChart";
import { EventReservationsByWaiterChart } from "components/Event/EventReservationsByWaiterChart";

import { QSeparator } from "quasar";

export default defineComponent({
    name: "PageAdminEvent",
    components: {
        FTTitle,
        EventTablesInfoRadarChart,
        EventFeedList,
        EventReservationsByWaiterChart,

        QSeparator,
    },
    props: {
        id: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const router = useRouter();

        const { data: eventFloors } = useFirestore<FloorDoc>({
            type: "watch",
            queryType: "collection",
            path: `${Collection.EVENTS}/${props.id}/floors`,
        });

        const { data: event } = useFirestore<EventDoc>({
            type: "get",
            queryType: "doc",
            path: `${Collection.EVENTS}/${props.id}`,
            onError() {
                void router.replace("/");
            },
        });

        const { data: eventFeed } = useFirestore<EventFeedDoc>({
            type: "get",
            queryType: "collection",
            path: `${Collection.EVENTS}/${props.id}/${Collection.EVENT_FEED}`,
        });

        const eventData = computed(() =>
            eventFloors.value
                .map((floor) => floor.data)
                .flat()
                .filter(isTable)
        );

        const reservationsStatus = computed(() => {
            const tables: TableElement[] = eventData.value;
            const reservations = tables.filter((table) => !!table.reservation);
            const unreserved = tables.length - reservations.length;
            const pending = reservations.filter(
                (table) => !table.reservation?.confirmed
            ).length;
            const confirmed = reservations.length - pending;
            const reserved = reservations.length;

            return [tables.length, reserved, pending, confirmed, unreserved];
        });

        async function init() {
            if (!props.id) {
                await router.replace("/");
            }
        }

        onMounted(init);

        return () => {
            if (!event.value) {
                return <div />;
            }
            return (
                <div class="PageAdminEvent">
                    <f-t-title title={event.value.name}>
                        {{
                            right: () => (
                                <div class="column">
                                    <span class="text-caption">Event date</span>
                                    <span>
                                        {!!event.value &&
                                            formatEventDate(event.value.date)}
                                    </span>
                                </div>
                            ),
                        }}
                    </f-t-title>

                    {!!eventFloors.value?.length && (
                        <div class="row">
                            <event-tables-info-radar-chart
                                class="col-12 col-sm-6"
                                reservations-status={reservationsStatus.value}
                            />

                            <q-separator class="q-my-md" />

                            <event-reservations-by-waiter-chart
                                class="col-12 col-sm-6"
                                event-data={eventData.value}
                            />
                        </div>
                    )}

                    {!!eventFeed.value?.length && (
                        <>
                            <q-separator class="q-my-md" />

                            <f-t-subtitle>Log</f-t-subtitle>

                            <event-feed-list event-feed={eventFeed.value} />
                        </>
                    )}
                </div>
            );
        };
    },
});
