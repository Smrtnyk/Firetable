import type {
    EventDoc,
    EventLogsDoc,
    FloorDoc,
    PlannedReservationDoc,
    ReservationDoc,
    User,
} from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { isPlannedReservation } from "@firetable/types";
import {
    getEventFloorsPath,
    getEventLogsPath,
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
import { property } from "es-toolkit/compat";

export function useAdminEvent(eventOwner: EventOwner) {
    const router = useRouter();
    const eventFloors = ref<FloorDoc[]>([]);

    const eventFloorsHook = useFirestoreCollection<FloorDoc>(getEventFloorsPath(eventOwner), {
        once: true,
        wait: true,
    });
    const reservations = useFirestoreCollection<ReservationDoc>(getReservationsPath(eventOwner));
    const { data: logs } = useFirestoreDocument<EventLogsDoc>(getEventLogsPath(eventOwner));

    const allPlannedReservations = computed<PlannedReservationDoc[]>(function () {
        return reservations.value.filter(function (res) {
            return isPlannedReservation(res);
        });
    });

    const usersHook = useFirestoreCollection<User>(
        createQuery(usersCollection(eventOwner.organisationId)),
        {
            once: true,
        },
    );
    const cancelledReservations = computed(function () {
        return allPlannedReservations.value.filter(property("cancelled"));
    });
    const arrivedReservations = computed(function () {
        return reservations.value.filter(property("arrived"));
    });

    const eventHook = useFirestoreDocument<EventDoc>(getEventPath(eventOwner));

    watch(eventFloorsHook.data, async function (floors) {
        if (floors.length === 0) {
            eventFloors.value = [];
            return;
        }

        for (const floorDoc of floors) {
            eventFloors.value.push(await decompressFloorDoc(floorDoc));
        }
    });

    watch(eventHook.error, function () {
        if (eventHook.error.value) {
            router.replace("/").catch(console.error);
            eventHook.stop();
        }
    });

    const isLoading = computed(function () {
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
        allPlannedReservations,
        cancelledReservations,
        arrivedReservations,
        isLoading,
        logs,
    };
}
