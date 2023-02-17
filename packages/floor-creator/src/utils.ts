import { Reservation } from "@firetable/types";
import { match } from "ts-pattern";

export function determineTableColor(reservation?: Reservation): string {
    return match(reservation)
        .with({ confirmed: false }, () => "#2ab7ca")
        .with({ confirmed: true }, () => "#1a7722")
        .otherwise(() => "#444");
}
