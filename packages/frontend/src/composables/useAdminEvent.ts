import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ADMIN, Collection, EventDoc, EventFeedDoc, FloorDoc, User } from "@firetable/types";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { where } from "firebase/firestore";
import { usersCollection } from "@firetable/backend";

export default function useAdminEvent(eventId: string) {
    const router = useRouter();

    const eventFloorsHook = useFirestoreCollection<FloorDoc>(
        `${Collection.EVENTS}/${eventId}/floors`,
    );

    const usersHook = useFirestoreCollection<User>(
        createQuery(usersCollection(), where("role", "!=", ADMIN)),
        { once: true },
    );

    const eventHook = useFirestoreDocument<EventDoc>(`${Collection.EVENTS}/${eventId}`);

    watch(eventHook.error, () => {
        if (eventHook.error.value) {
            router.replace("/").catch((err) => console.error(err));
            eventHook.stop();
        }
    });

    const eventFeedHook = useFirestoreCollection<EventFeedDoc>(
        `${Collection.EVENTS}/${eventId}/${Collection.EVENT_FEED}`,
    );

    const isLoading = computed(() => {
        return (
            eventFloorsHook.pending.value ||
            usersHook.pending.value ||
            eventHook.pending.value ||
            eventFeedHook.pending.value
        );
    });

    return {
        eventFloors: eventFloorsHook.data,
        users: usersHook.data,
        event: eventHook.data,
        eventFeed: eventFeedHook.data,
        isLoading,
    };
}
