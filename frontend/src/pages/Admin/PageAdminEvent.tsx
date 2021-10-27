import { FloorDoc, TableElement } from "src/types/floor";
import { computed, defineComponent, onMounted } from "vue";
import { useRouter } from "vue-router";
import { formatEventDate } from "src/helpers/utils";
import { useFirestore } from "src/composables/useFirestore";

import { FTTitle } from "components/FTTitle";
import { FTSubtitle } from "components/FTSubtitle";
import { EventFeedList } from "components/Event/EventFeedList";
import AdminEventGeneralInfo from "components/admin/event/AdminEventGeneralInfo.vue";

import { QSeparator } from "quasar";
import { Collection } from "src/types/firebase";
import { EventDoc, EventFeedDoc } from "src/types/event";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { isTable } from "src/floor-manager/type-guards";

export default defineComponent({
    name: "PageAdminEvent",
    components: {
        FTTitle,
        FTSubtitle,
        EventFeedList,
        AdminEventGeneralInfo,

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
                router.replace("/").catch(showErrorMessage);
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
            const pending = reservations.filter((table) => !table.reservation?.confirmed).length;
            const confirmed = reservations.length - pending;
            const reserved = reservations.length;

            return {
                total: tables.length,
                reserved,
                pending,
                confirmed,
                unreserved,
            };
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
                                        {!!event.value && formatEventDate(event.value.date)}
                                    </span>
                                </div>
                            ),
                        }}
                    </f-t-title>

                    <admin-event-general-info reservations-status={reservationsStatus.value} />

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
