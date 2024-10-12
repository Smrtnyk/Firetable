import type { PlannedReservation, QueuedReservation } from "@firetable/types";
import { ReservationType } from "@firetable/types";

export function queuedToPlannedReservation(
    queuedReservation: QueuedReservation,
    floorId: string,
    tableLabel: string,
): PlannedReservation {
    return {
        ...queuedReservation,
        floorId,
        tableLabel,
        type: ReservationType.PLANNED,
        arrived: false,
        cancelled: false,
        reservationConfirmed: false,
        waitingForResponse: false,
    };
}
