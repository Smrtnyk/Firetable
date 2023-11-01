import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Collection, EventDoc, FloorDoc, User } from "@firetable/types";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { EventOwner, usersCollection } from "@firetable/backend";

export default function useAdminEvent({ organisationId, propertyId, id: eventId }: EventOwner) {
    const router = useRouter();

    const eventFloorsHook = useFirestoreCollection<FloorDoc>(
        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}/${propertyId}/${Collection.EVENTS}/${eventId}/${Collection.FLOORS}`,
    );

    const usersHook = useFirestoreCollection<User>(createQuery(usersCollection(organisationId)), {
        once: true,
    });

    const eventHook = useFirestoreDocument<EventDoc>(
        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}/${propertyId}/${Collection.EVENTS}/${eventId}`,
    );

    watch(eventHook.error, () => {
        if (eventHook.error.value) {
            router.replace("/").catch((err) => console.error(err));
            eventHook.stop();
        }
    });

    const isLoading = computed(() => {
        return eventFloorsHook.pending.value || usersHook.pending.value || eventHook.pending.value;
    });

    return {
        eventFloors: eventFloorsHook.data,
        users: usersHook.data,
        event: eventHook.data,
        isLoading,
    };
}
