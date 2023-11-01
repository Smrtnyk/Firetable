import { Reservation } from "@firetable/types";
import { match } from "ts-pattern";
import { fabric } from "fabric";
import { isDefined } from "@firetable/utils";
import { BaseTable } from "./types.js";
import { isTable } from "./type-guards.js";

export function determineTableColor(
    reservation: Reservation | undefined,
    fallback: string,
): string {
    return match(reservation)
        .with({ confirmed: false }, () => "#2ab7ca")
        .with({ confirmed: true }, () => "#1a7722")
        .otherwise(() => fallback);
}

export function containsTables(ev: fabric.IEvent): boolean {
    return isDefined(getTableFromTargetElement(ev));
}

export function getTableFromTargetElement(ev: fabric.IEvent): BaseTable | null {
    // @ts-ignore -- not typed apparently
    return ev.target?._objects.find(isTable);
}

export function calculateCanvasScale(containerWidth: number, floorWidth: number) {
    return containerWidth / floorWidth;
}
