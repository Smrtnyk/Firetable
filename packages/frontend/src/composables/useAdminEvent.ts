import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { EventDoc, FloorDoc, User } from "@firetable/types";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { EventOwner, getEventFloorsPath, getEventPath, usersCollection } from "@firetable/backend";

export default function useAdminEvent(eventOwner: EventOwner) {
    const router = useRouter();

    const eventFloorsHook = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner));

    const usersHook = useFirestoreCollection<User>(
        createQuery(usersCollection(eventOwner.organisationId)),
        {
            once: true,
        },
    );

    const eventHook = useFirestoreDocument<EventDoc>(getEventPath(eventOwner));

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
