import { isSome, Option, Reservation } from "@firetable/types";

export function determineTableColor(reservation: Option<Reservation>): string {
    let fillColor = "#444";
    if (isSome(reservation)) {
        fillColor = "#2ab7ca";
        if (reservation.value.confirmed) {
            fillColor = "#1a7722";
        }
    }
    return fillColor;
}
