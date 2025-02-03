import type { BaseReservation, PlannedReservation, WalkInReservation } from "@firetable/types";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { describe, expect, it } from "vitest";

import { determineTableColor } from "./floor.js";

const colorPalette = {
    reservationArrivedColor: "#1a7722",
    reservationCancelledColor: "#ff9f43",
    reservationConfirmedColor: "#6247aa",
    reservationPendingColor: "#2ab7ca",
    reservationWaitingForResponseColor: "#b5a22c",
};

const mockUser: BaseReservation["creator"] = {
    createdAt: Date.now(),
    email: "example@mail.com",
    id: "user123",
    name: "John Doe",
};

const plannedReservation: PlannedReservation = {
    arrived: false,
    cancelled: false,
    consumption: 100,
    creator: mockUser,
    floorId: "floor1",
    guestName: "John Doe",
    isVIP: false,
    numberOfGuests: 2,
    reservationConfirmed: false,
    reservedBy: mockUser,
    state: ReservationState.PENDING,
    status: ReservationStatus.ACTIVE,
    tableLabel: "Table 1",
    time: new Date().toISOString(),
    type: ReservationType.PLANNED,
    waitingForResponse: true,
};

const walkInReservation: WalkInReservation = {
    arrived: true,
    consumption: 50,
    creator: mockUser,
    floorId: "floor2",
    guestName: "Jane Doe",
    isVIP: true,
    numberOfGuests: 1,
    state: ReservationState.ARRIVED,
    status: ReservationStatus.ACTIVE,
    tableLabel: "Table 2",
    time: new Date().toISOString(),
    type: ReservationType.WALK_IN,
};

describe("determineTableColor", () => {
    it("returns an empty string when reservation is undefined", () => {
        const result = determineTableColor(undefined, colorPalette);
        expect(result).toBe("");
    });

    it("returns the reservationWaitingForResponseColor when PlannedReservation is waiting for response", () => {
        const result = determineTableColor(plannedReservation, colorPalette);
        expect(result).toBe(colorPalette.reservationWaitingForResponseColor);
    });

    it("returns the reservationCancelledColor when PlannedReservation is cancelled", () => {
        const cancelledReservation = {
            ...plannedReservation,
            cancelled: true,
            waitingForResponse: false,
        };
        const result = determineTableColor(cancelledReservation, colorPalette);
        expect(result).toBe(colorPalette.reservationCancelledColor);
    });

    it("returns the reservationArrivedColor when the reservation has arrived", () => {
        const result = determineTableColor(walkInReservation, colorPalette);
        expect(result).toBe(colorPalette.reservationArrivedColor);
    });

    it("returns the reservationConfirmedColor when the reservation is confirmed", () => {
        const confirmedReservation = {
            ...plannedReservation,
            reservationConfirmed: true,
            waitingForResponse: false,
        };
        const result = determineTableColor(confirmedReservation, colorPalette);
        expect(result).toBe(colorPalette.reservationConfirmedColor);
    });

    it("returns the reservationPendingColor when the reservation has arrived === false", () => {
        const pendingReservation = {
            ...plannedReservation,
            arrived: false,
            waitingForResponse: false,
        };
        const result = determineTableColor(pendingReservation, colorPalette);
        expect(result).toBe(colorPalette.reservationPendingColor);
    });
});
