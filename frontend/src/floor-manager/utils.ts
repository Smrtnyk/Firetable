import { Reservation } from "src/types/event";

export function determineTableColor(reservation?: Reservation): string {
    let fillColor = "#444";
    if (reservation) {
        fillColor = "#2ab7ca";
        if (reservation.confirmed) {
            fillColor = "#1a7722";
        }
    }
    return fillColor;
}
