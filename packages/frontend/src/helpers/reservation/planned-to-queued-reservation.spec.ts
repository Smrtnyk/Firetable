import type { PlannedReservation, QueuedReservation } from "@firetable/types";
import { plannedToQueuedReservation } from "./planned-to-queued-reservation";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { describe, expect, it, vi } from "vitest";
import { omit } from "es-toolkit";

describe("plannedToQueuedReservation", () => {
    it("should correctly transform a full PlannedReservation to QueuedReservation", () => {
        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            floorId: "floor1",
            reservationConfirmed: false,
            tableLabel: "A1",
            waitingForResponse: false,
            reservedBy: {
                email: "guest@example.com",
                name: "Guest Name",
                id: "guest1",
            },
            creator: {
                id: "creator1",
                email: "creator@example.com",
                name: "Creator Name",
                // Some past timestamp
                createdAt: 1_670_000_000_000,
            },
            guestName: "John Doe",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "18:00",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
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

    it("should omit the specified fields from the PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: true,
            cancelled: true,
            floorId: "floor2",
            reservationConfirmed: true,
            tableLabel: "B2",
            waitingForResponse: true,
            reservedBy: {
                email: "anotherguest@example.com",
                name: "Another Guest",
                id: "guest2",
            },
            creator: {
                id: "creator2",
                email: "creator2@example.com",
                name: "Creator Two",
                createdAt: 1_670_000_000_000,
            },
            guestName: "Jane Smith",
            consumption: 5,
            isVIP: true,
            numberOfGuests: 4,
            time: "20:00",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
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

    it("should add createdAt timestamp correctly", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            floorId: "floor3",
            reservationConfirmed: false,
            tableLabel: "C3",
            waitingForResponse: false,
            reservedBy: {
                email: "vipguest@example.com",
                name: "VIP Guest",
                id: "guest3",
            },
            creator: {
                id: "creator3",
                email: "creator3@example.com",
                name: "Creator Three",
                createdAt: fixedTimestamp,
            },
            guestName: "Alice Johnson",
            consumption: 10,
            isVIP: true,
            numberOfGuests: 5,
            time: "19:00",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
        };

        const queued = plannedToQueuedReservation(planned);

        expect(queued.creator.createdAt).toBe(fixedTimestamp);
    });

    it("should handle missing optional fields in PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            floorId: "floor4",
            reservationConfirmed: false,
            tableLabel: "D4",
            waitingForResponse: false,
            reservedBy: {
                email: "minimalguest@example.com",
                name: "Minimal Guest",
                id: "guest4",
            },
            creator: {
                id: "creator4",
                email: "creator4@example.com",
                name: "Creator Four",
                createdAt: 1_670_000_000_000,
            },
            guestName: "Bob Brown",
            consumption: 1,
            isVIP: false,
            numberOfGuests: 1,
            time: "17:00",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
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

    it("should not mutate the original PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            floorId: "floor5",
            reservationConfirmed: false,
            tableLabel: "E5",
            waitingForResponse: false,
            reservedBy: {
                email: "immutable@example.com",
                name: "Immutable Guest",
                id: "guest5",
            },
            creator: {
                id: "creator5",
                email: "creator5@example.com",
                name: "Creator Five",
                createdAt: 1_670_000_000_000,
            },
            guestName: "Charlie Davis",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 3,
            time: "18:00",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
        };

        const plannedCopy = { ...planned };

        plannedToQueuedReservation(planned);

        expect(planned).toStrictEqual(plannedCopy);
    });

    it("should handle empty PlannedReservation", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation = {
            arrived: false,
            cancelled: false,
            floorId: "",
            reservationConfirmed: false,
            tableLabel: "",
            waitingForResponse: false,
            reservedBy: {
                email: "",
                name: "",
                id: "",
            },
            creator: {
                id: "",
                email: "",
                name: "",
                createdAt: 0,
            },
            guestName: "",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 0,
            time: "",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
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

    it("should include additional fields not in omit list", () => {
        const fixedTimestamp = 1_680_000_000_000;
        vi.setSystemTime(new Date(fixedTimestamp));

        const planned: PlannedReservation & { extraField: string } = {
            arrived: false,
            cancelled: false,
            floorId: "floor6",
            reservationConfirmed: false,
            tableLabel: "F6",
            waitingForResponse: false,
            reservedBy: {
                email: "extra@example.com",
                name: "Extra Guest",
                id: "guest6",
            },
            creator: {
                id: "creator6",
                email: "creator6@example.com",
                name: "Creator Six",
                createdAt: 1_670_000_000_000,
            },
            guestName: "Diana Evans",
            consumption: 3,
            isVIP: true,
            numberOfGuests: 4,
            time: "16:00",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
            // Additional field not in omit list
            extraField: "extraValue",
        };

        const queued = plannedToQueuedReservation(planned);

        expect(queued).toHaveProperty("extraField", "extraValue");
    });
});
