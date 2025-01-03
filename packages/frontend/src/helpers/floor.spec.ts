import type { BaseReservation, PlannedReservation, WalkInReservation } from "@firetable/types";
import { determineTableColor } from "./floor.js";
import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { describe, it, expect } from "vitest";

const colorPalette = {
    reservationArrivedColor: "#1a7722",
    reservationConfirmedColor: "#6247aa",
    reservationCancelledColor: "#ff9f43",
    reservationPendingColor: "#2ab7ca",
    reservationWaitingForResponseColor: "#b5a22c",
};

const mockUser: BaseReservation["creator"] = {
    id: "user123",
    createdAt: Date.now(),
    email: "example@mail.com",
    name: "John Doe",
};

const plannedReservation: PlannedReservation = {
    type: ReservationType.PLANNED,
    reservationConfirmed: false,
    cancelled: false,
    arrived: false,
    waitingForResponse: true,
    consumption: 100,
    guestName: "John Doe",
    reservedBy: mockUser,
    floorId: "floor1",
    tableLabel: "Table 1",
    numberOfGuests: 2,
    time: new Date().toISOString(),
    status: ReservationStatus.ACTIVE,
    isVIP: false,
    creator: mockUser,
    state: ReservationState.PENDING,
};

const walkInReservation: WalkInReservation = {
    type: ReservationType.WALK_IN,
    guestName: "Jane Doe",
    consumption: 50,
    arrived: true,
    floorId: "floor2",
    tableLabel: "Table 2",
    numberOfGuests: 1,
    time: new Date().toISOString(),
    status: ReservationStatus.ACTIVE,
    isVIP: true,
    creator: mockUser,
    state: ReservationState.ARRIVED,
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
            waitingForResponse: false,
            cancelled: true,
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
