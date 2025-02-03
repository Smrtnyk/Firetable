import type { PlannedReservation, QueuedReservation } from "@firetable/types";

import { ReservationType } from "@firetable/types";
import { omit } from "es-toolkit";

export function plannedToQueuedReservation(planned: PlannedReservation): QueuedReservation {
    return {
        ...omit(planned, [
            "arrived",
            "cancelled",
            "floorId",
            "reservationConfirmed",
            "tableLabel",
            "waitingForResponse",
        ]),
        type: ReservationType.QUEUED,
    };
}
