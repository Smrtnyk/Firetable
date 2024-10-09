import type { OrganisationSettings, Reservation } from "@firetable/types";
import { isPlannedReservation } from "@firetable/types";

type ColorPalette = Pick<
    OrganisationSettings["event"],
    | "reservationArrivedColor"
    | "reservationCancelledColor"
    | "reservationConfirmedColor"
    | "reservationPendingColor"
    | "reservationWaitingForResponseColor"
>;

export function determineTableColor(
    reservation: Reservation | undefined,
    colorPalette: ColorPalette,
): string {
    if (!reservation) {
        return "";
    }

    if (isPlannedReservation(reservation) && reservation.waitingForResponse) {
        return colorPalette.reservationWaitingForResponseColor;
    }

    if (isPlannedReservation(reservation) && reservation.cancelled) {
        return colorPalette.reservationCancelledColor;
    }

    if (reservation.arrived) {
        return colorPalette.reservationArrivedColor;
    }

    if (reservation.reservationConfirmed) {
        return colorPalette.reservationConfirmedColor;
    }

    if (!reservation.arrived) {
        return colorPalette.reservationPendingColor;
    }

    return "";
}
