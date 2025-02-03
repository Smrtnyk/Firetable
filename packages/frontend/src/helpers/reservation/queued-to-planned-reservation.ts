import type { PlannedReservation, QueuedReservation } from "@firetable/types";

import { ReservationState, ReservationType } from "@firetable/types";

export function queuedToPlannedReservation(
    queuedReservation: QueuedReservation,
    floorId: string,
    tableLabel: string,
): PlannedReservation {
    return {
        ...queuedReservation,
        arrived: false,
        cancelled: false,
        floorId,
        reservationConfirmed: false,
        state: ReservationState.PENDING,
        tableLabel,
        type: ReservationType.PLANNED,
        waitingForResponse: false,
    };
}
