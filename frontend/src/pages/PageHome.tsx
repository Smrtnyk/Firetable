import { EventCardList } from "src/components/Event/EventCardList";
import PushMessagesBanner from "src/components/PushMessagesBanner";
import { EventCardListSkeleton } from "src/components/Event/EventCardListSkeleton";
import { FTSubtitle } from "src/components/FTSubtitle";

import { defineComponent } from "vue";
import useFirestore from "src/composables/useFirestore";
import { Collection, EventDoc } from "src/types";

export default defineComponent({
    name: "Home",
    components: {
        FTSubtitle,
        EventCardListSkeleton,
        EventCardList,
        PushMessagesBanner,
    },
    setup() {
        const { data: events, loading: isLoading } = useFirestore<EventDoc>({
            type: "watch",
            queryType: "collection",
            path: Collection.EVENTS,
            query(collectionRef) {
                return collectionRef
                    .where("date", ">=", Date.now() - 60 * 60 * 1000 * 8)
                    .orderBy("date")
                    .limit(10);
            },
        });

        return () => (
            <div class="PageHome">
                <PushMessagesBanner />
                {!!events.value.length && !isLoading.value && (
                    <>
                        <f-t-subtitle>Events</f-t-subtitle>
                        <event-card-list events={events.value} />
                    </>
                )}
                {isLoading.value && <EventCardListSkeleton />}
                {!isLoading.value && !events.value.length && (
                    <div class="row justify-center items-center q-mt-md">
                        <f-t-subtitle>
                            There are no upcoming events
                        </f-t-subtitle>
                        <q-img src="no-events.svg" />
                    </div>
                )}
            </div>
        );
    },
});
