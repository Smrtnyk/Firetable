import type { Reservation } from "@firetable/types";
import { match } from "ts-pattern";

export function determineTableColor(reservation: Reservation | undefined): string | undefined {
    return match(reservation)
        .with({ cancelled: true }, () => "#ff9f43")
        .with({ confirmed: true }, () => "#1a7722")
        .with({ reservationConfirmed: true }, () => "#6247aa")
        .with({ confirmed: false }, () => "#2ab7ca")
        .otherwise(() => void 0);
}
