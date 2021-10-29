import { EventCardList } from "src/components/Event/EventCardList";
import PushMessagesBanner from "src/components/PushMessagesBanner";
import { EventCardListSkeleton } from "src/components/Event/EventCardListSkeleton";
import { FTSubtitle } from "src/components/FTSubtitle";

import { defineComponent } from "vue";
import { useFirestore } from "src/composables/useFirestore";
import { query as firestoreQuery, where, orderBy, limit } from "@firebase/firestore";

import { QImg } from "quasar";
import { Collection } from "src/types/firebase";
import { EventDoc } from "src/types/event";

export default defineComponent({
    name: "PageHome",

    components: {
        QImg,

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
                const whereConstraint = where("date", ">=", Date.now() - 60 * 60 * 1000 * 8);
                const orderByConstraint = orderBy("date");
                const limitConstraint = limit(10);
                return firestoreQuery(
                    collectionRef,
                    whereConstraint,
                    orderByConstraint,
                    limitConstraint
                );
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
                        <f-t-subtitle>There are no upcoming events</f-t-subtitle>
                        <q-img src="no-events.svg" />
                    </div>
                )}
            </div>
        );
    },
});
