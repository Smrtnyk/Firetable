import type { EventDoc, EventLogsDoc, FloorDoc, ReservationDoc, User } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import {
    getEventLogsPath,
    getEventFloorsPath,
    getEventPath,
    getReservationsPath,
    usersCollection,
} from "@firetable/backend";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { propIsTruthy } from "@firetable/utils";

export default function useAdminEvent(eventOwner: EventOwner) {
    const router = useRouter();
    const eventFloors = ref<FloorDoc[]>([]);

    const eventFloorsHook = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner), {
        once: true,
        wait: true,
    });
    const reservations = useFirestoreCollection<ReservationDoc>(getReservationsPath(eventOwner));
    const { data: logs } = useFirestoreDocument<EventLogsDoc>(getEventLogsPath(eventOwner));

    const usersHook = useFirestoreCollection<User>(
        createQuery(usersCollection(eventOwner.organisationId)),
        {
            once: true,
        },
    );
    const cancelledReservations = computed(() =>
        reservations.value.filter(propIsTruthy("cancelled")),
    );
    const arrivedReservations = computed(() => reservations.value.filter(propIsTruthy("arrived")));

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
        return (
            eventFloorsHook.pending.value ||
            usersHook.pending.value ||
            eventHook.pending.value ||
            reservations.pending.value
        );
    });

    return {
        eventFloors,
        users: usersHook.data,
        event: eventHook.data,
        allReservations: reservations.data,
        cancelledReservations,
        arrivedReservations,
        isLoading,
        logs,
    };
}
