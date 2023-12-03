import type { EventDoc, FloorDoc, ReservationDoc, User } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import {
    getEventFloorsPath,
    getEventPath,
    getReservationsPath,
    usersCollection,
} from "@firetable/backend";
import { decompressFloorDoc } from "src/helpers/compress-floor-doc";

export default function useAdminEvent(eventOwner: EventOwner) {
    const router = useRouter();
    const eventFloors = ref<FloorDoc[]>([]);

    const eventFloorsHook = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner), {
        once: true,
        wait: true,
    });
    const reservations = useFirestoreCollection<ReservationDoc>(getReservationsPath(eventOwner));

    const usersHook = useFirestoreCollection<User>(
        createQuery(usersCollection(eventOwner.organisationId)),
        {
            once: true,
        },
    );

    const eventHook = useFirestoreDocument<EventDoc>(getEventPath(eventOwner));

    watch(eventFloorsHook.data, async (floors) => {
        if (floors.length === 0) {
            eventFloors.value = [];
            return;
        }
        for (const floorDoc of floors) {
            eventFloors.value.push(await decompressFloorDoc(floorDoc));
        }
    });

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
        eventFloors,
        users: usersHook.data,
        event: eventHook.data,
        reservations: reservations.data,
        isLoading,
    };
}
