import type { Reservation } from "@firetable/types";
import { match } from "ts-pattern";

export function determineTableColor(
    reservation: Reservation | undefined,
    fallback: string,
): string {
    return match(reservation)
        .with({ confirmed: false }, () => "#2ab7ca")
        .with({ confirmed: true }, () => "#1a7722")
        .otherwise(() => fallback);
}

export function calculateCanvasScale(containerWidth: number, floorWidth: number): number {
    return containerWidth / floorWidth;
}
