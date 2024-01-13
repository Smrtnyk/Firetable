import type { OrganisationSettings, Reservation } from "@firetable/types";
import { match } from "ts-pattern";

export function determineTableColor(
    reservation: Reservation | undefined,
    colorPalette: Pick<
        OrganisationSettings["event"],
        | "reservationArrivedColor"
        | "reservationConfirmedColor"
        | "reservationPendingColor"
        | "reservationCancelledColor"
    >,
): string | undefined {
    return match(reservation)
        .with({ cancelled: true }, () => colorPalette.reservationCancelledColor)
        .with({ arrived: true }, () => colorPalette.reservationArrivedColor)
        .with({ reservationConfirmed: true }, () => colorPalette.reservationConfirmedColor)
        .with({ arrived: false }, () => colorPalette.reservationPendingColor)
        .otherwise(() => void 0);
}
