import type { EventOwner } from "@firetable/backend";
import type {
    EventDoc,
    EventFloorDoc,
    EventLogsDoc,
    PlannedReservationDoc,
    ReservationDoc,
    User,
} from "@firetable/types";

import {
    getEventFloorsPath,
    getEventLogsPath,
    getEventPath,
    getReservationsPath,
    usersCollection,
} from "@firetable/backend";
import { isPlannedReservation } from "@firetable/types";
import { property } from "es-toolkit/compat";
import {
    createQuery,
    useFirestoreCollection,
    useFirestoreDocument,
} from "src/composables/useFirestore";
import { decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { AppLogger } from "src/logger/FTLogger.js";
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useAdminEvent(eventOwner: EventOwner) {
    const router = useRouter();

    const { data: eventFloorsData, pending: eventFloorsIsPending } =
        useFirestoreCollection<EventFloorDoc>(createQuery(getEventFloorsPath(eventOwner)), {
            converter: {
                fromFirestore(snapshot) {
                    const data = snapshot.data() as EventFloorDoc;
                    return {
                        ...decompressFloorDoc(data),
                        id: snapshot.id,
                        // Default to end if no order is set
                        order: data.order ?? 999_999,
                    };
                },
                toFirestore: (floor: EventFloorDoc) => ({
                    ...floor,
                    id: floor.id,
                    order: floor.order ?? 999_999,
                }),
            },
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

    watch(eventHook.error, function () {
        if (eventHook.error.value) {
            router.replace("/").catch(AppLogger.error.bind(AppLogger));
            eventHook.stop();
        }
    });

    const isLoading = computed(function () {
        return (
            eventFloorsIsPending.value ||
            usersHook.pending.value ||
            eventHook.pending.value ||
            reservations.pending.value
        );
    });

    return {
        allPlannedReservations,
        allReservations: reservations.data,
        arrivedReservations,
        cancelledReservations,
        event: eventHook.data,
        eventFloors: eventFloorsData,
        isLoading,
        logs,
        users: usersHook.data,
    };
}
