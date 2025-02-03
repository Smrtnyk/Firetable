import type { PlannedReservation, QueuedReservation } from "@firetable/types";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { omit } from "es-toolkit";
import { describe, expect, it, vi } from "vitest";

import { plannedToQueuedReservation } from "./planned-to-queued-reservation";

describe("plannedToQueuedReservation", () => {
    it("correctly transforms a full PlannedReservation to QueuedReservation", () => {
        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            consumption: 0,
            creator: {
                // Some past timestamp
                createdAt: 1_670_000_000_000,
                email: "creator@example.com",
                id: "creator1",
                name: "Creator Name",
            },
            floorId: "floor1",
            guestName: "John Doe",
            isVIP: false,
            numberOfGuests: 2,
            reservationConfirmed: false,
            reservedBy: {
                email: "guest@example.com",
                id: "guest1",
                name: "Guest Name",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "A1",
            time: "18:00",
            type: ReservationType.PLANNED,
            waitingForResponse: false,
        };

        const queued = plannedToQueuedReservation(planned);

        const expectedQueued: QueuedReservation = {
            ...omit(planned, [
                "arrived",
                "cancelled",
                "floorId",
                "reservationConfirmed",
                "tableLabel",
                "waitingForResponse",
            ]),
            type: ReservationType.QUEUED,
        };

        expect(queued).toEqual(expectedQueued);
    });

    it("omits the specified fields from the PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: true,
            cancelled: true,
            consumption: 5,
            creator: {
                createdAt: 1_670_000_000_000,
                email: "creator2@example.com",
                id: "creator2",
                name: "Creator Two",
            },
            floorId: "floor2",
            guestName: "Jane Smith",
            isVIP: true,
            numberOfGuests: 4,
            reservationConfirmed: true,
            reservedBy: {
                email: "anotherguest@example.com",
                id: "guest2",
                name: "Another Guest",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "B2",
            time: "20:00",
            type: ReservationType.PLANNED,
            waitingForResponse: true,
        };

        const queued = plannedToQueuedReservation(planned);

        // Ensure omitted fields are not present
        expect(queued).not.toHaveProperty("arrived");
        expect(queued).not.toHaveProperty("cancelled");
        expect(queued).not.toHaveProperty("floorId");
        expect(queued).not.toHaveProperty("reservationConfirmed");
        expect(queued).not.toHaveProperty("tableLabel");
        expect(queued).not.toHaveProperty("waitingForResponse");
    });

    it("adds createdAt timestamp correctly", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            consumption: 10,
            creator: {
                createdAt: fixedTimestamp,
                email: "creator3@example.com",
                id: "creator3",
                name: "Creator Three",
            },
            floorId: "floor3",
            guestName: "Alice Johnson",
            isVIP: true,
            numberOfGuests: 5,
            reservationConfirmed: false,
            reservedBy: {
                email: "vipguest@example.com",
                id: "guest3",
                name: "VIP Guest",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "C3",
            time: "19:00",
            type: ReservationType.PLANNED,
            waitingForResponse: false,
        };

        const queued = plannedToQueuedReservation(planned);

        expect(queued.creator.createdAt).toBe(fixedTimestamp);
    });

    it("handles missing optional fields in PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            consumption: 1,
            creator: {
                createdAt: 1_670_000_000_000,
                email: "creator4@example.com",
                id: "creator4",
                name: "Creator Four",
            },
            floorId: "floor4",
            guestName: "Bob Brown",
            isVIP: false,
            numberOfGuests: 1,
            reservationConfirmed: false,
            reservedBy: {
                email: "minimalguest@example.com",
                id: "guest4",
                name: "Minimal Guest",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "D4",
            time: "17:00",
            type: ReservationType.PLANNED,
            waitingForResponse: false,
        };

        const queued = plannedToQueuedReservation(planned);

        const expectedQueued: QueuedReservation = {
            ...omit(planned, [
                "arrived",
                "cancelled",
                "floorId",
                "reservationConfirmed",
                "tableLabel",
                "waitingForResponse",
            ]),
            type: ReservationType.QUEUED,
        };

        expect(queued).toEqual(expectedQueued);
    });

    it("doesn't mutate the original PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            consumption: 0,
            creator: {
                createdAt: 1_670_000_000_000,
                email: "creator5@example.com",
                id: "creator5",
                name: "Creator Five",
            },
            floorId: "floor5",
            guestName: "Charlie Davis",
            isVIP: false,
            numberOfGuests: 3,
            reservationConfirmed: false,
            reservedBy: {
                email: "immutable@example.com",
                id: "guest5",
                name: "Immutable Guest",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "E5",
            time: "18:00",
            type: ReservationType.PLANNED,
            waitingForResponse: false,
        };

        const plannedCopy = { ...planned };

        plannedToQueuedReservation(planned);

        expect(planned).toStrictEqual(plannedCopy);
    });

    it("handles empty PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            consumption: 0,
            creator: {
                createdAt: 0,
                email: "",
                id: "",
                name: "",
            },
            floorId: "",
            guestName: "",
            isVIP: false,
            numberOfGuests: 0,
            reservationConfirmed: false,
            reservedBy: {
                email: "",
                id: "",
                name: "",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "",
            time: "",
            type: ReservationType.PLANNED,
            waitingForResponse: false,
        };

        const queued = plannedToQueuedReservation(planned);

        const expectedQueued: QueuedReservation = {
            ...omit(planned, [
                "arrived",
                "cancelled",
                "floorId",
                "reservationConfirmed",
                "tableLabel",
                "waitingForResponse",
            ]),
            type: ReservationType.QUEUED,
        };

        expect(queued).toEqual(expectedQueued);
    });

    it("includes additional fields not in omit list", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation & { extraField: string } = {
            arrived: false,
            cancelled: false,
            consumption: 3,
            creator: {
                createdAt: 1_670_000_000_000,
                email: "creator6@example.com",
                id: "creator6",
                name: "Creator Six",
            },
            // Additional field not in omit list
            extraField: "extraValue",
            floorId: "floor6",
            guestName: "Diana Evans",
            isVIP: true,
            numberOfGuests: 4,
            reservationConfirmed: false,
            reservedBy: {
                email: "extra@example.com",
                id: "guest6",
                name: "Extra Guest",
            },
            state: ReservationState.PENDING,
            status: ReservationStatus.ACTIVE,
            tableLabel: "F6",
            time: "16:00",
            type: ReservationType.PLANNED,
            waitingForResponse: false,
        };

        const queued = plannedToQueuedReservation(planned);

        expect(queued).toHaveProperty("extraField", "extraValue");
    });
});
