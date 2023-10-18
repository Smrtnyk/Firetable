// useEventData.ts
import { watch } from "vue";
import { useRouter } from "vue-router";
import { ADMIN, Collection, EventDoc, EventFeedDoc, FloorDoc } from "@firetable/types";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { where } from "firebase/firestore";
import firebase from "firebase/compat";
import User = firebase.User;
import { usersCollection } from "@firetable/backend";

export default function useAdminEvent(eventId: string) {
    const router = useRouter();

    const { data: eventFloors } = useFirestoreCollection<FloorDoc>(
        `${Collection.EVENTS}/${eventId}/floors`,
    );

    const users = useFirestoreCollection<User>(
        createQuery(usersCollection(), where("role", "!=", ADMIN)),
        { once: true },
    );

    const {
        data: event,
        error: eventError,
        stop: stopEventWatch,
    } = useFirestoreDocument<EventDoc>(`${Collection.EVENTS}/${eventId}`);

    watch(eventError, () => {
        if (eventError.value) {
            router.replace("/").catch((err) => console.error(err));
            stopEventWatch();
        }
    });

    const { data: eventFeed } = useFirestoreCollection<EventFeedDoc>(
        `${Collection.EVENTS}/${eventId}/${Collection.EVENT_FEED}`,
    );

    return {
        eventFloors,
        users,
        event,
        eventFeed,
    };
}
