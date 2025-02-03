import {
    type EventDoc,
    type ReservationDocWithEventId,
    ReservationState,
    ReservationStatus,
    ReservationType,
} from "@firetable/types";
import { describe, expect, it } from "vitest";

import { bucketizeReservations } from "./bucketize-reservations.js";

const mockEvents: EventDoc[] = [
    {
        _doc: {} as any,
        creator: "user1",
        date: 1_690_000_000_000,
        entryPrice: 50,
        guestListLimit: 100,
        id: "event1",
        name: "Event 1",
        organisationId: "org1",
        propertyId: "prop1",
    },
    {
        _doc: {} as any,
        creator: "user2",
        date: 1_690_000_100_000,
        entryPrice: 100,
        guestListLimit: 200,
        id: "event2",
        name: "Event 2",
        organisationId: "org2",
        propertyId: "prop1",
    },
];

const mockReservations: ReservationDocWithEventId[] = [
    {
        arrived: true,
        cancelled: false,
        consumption: 100,
        creator: {
            createdAt: Date.now(),
            email: "creator1@example.com",
            id: "creator1",
            name: "Creator One",
        },
        eventId: "event1",
        floorId: "floor1",
        guestName: "John Doe",
        id: "res1",
        isVIP: true,
        numberOfGuests: 4,
        reservationConfirmed: true,
        reservedBy: { email: "reserver@example.com", id: "reserver", name: "Reserver One" },
        state: ReservationState.PENDING,
        status: ReservationStatus.ACTIVE,
        tableLabel: "Table 1",
        time: "18:00",
        type: ReservationType.PLANNED,
    },
    {
        arrived: true,
        consumption: 50,
        creator: {
            createdAt: Date.now(),
            email: "creator2@example.com",
            id: "creator2",
            name: "Creator Two",
        },
        eventId: "event1",
        floorId: "floor1",
        guestName: "Jane Doe",
        id: "res2",
        isVIP: false,
        numberOfGuests: 2,
        state: ReservationState.ARRIVED,
        status: ReservationStatus.ACTIVE,
        tableLabel: "Table 2",
        time: "19:00",
        type: ReservationType.WALK_IN,
    },
    {
        arrived: false,
        cancelled: true,
        consumption: 70,
        creator: {
            createdAt: Date.now(),
            email: "creator3@example.com",
            id: "creator3",
            name: "Creator Three",
        },
        eventId: "event1",
        floorId: "floor2",
        guestName: "Alice",
        id: "res3",
        isVIP: false,
        numberOfGuests: 3,
        reservationConfirmed: true,
        reservedBy: { email: "reserver@example.com", id: "reserver", name: "Reserver One" },
        state: ReservationState.PENDING,
        status: ReservationStatus.ACTIVE,
        tableLabel: "Table 3",
        time: "20:00",
        type: ReservationType.PLANNED,
    },
];

describe("bucketizeReservations", () => {
    it("adds planned reservations to the bucket", () => {
        const result = bucketizeReservations(mockEvents, mockReservations);

        expect(result.plannedReservations.length).toBe(1);
        expect(result.plannedReservations[0].guestName).toBe("John Doe");
    });

    it("adds walk-in reservations to the bucket", () => {
        const result = bucketizeReservations(mockEvents, mockReservations);

        expect(result.walkInReservations.length).toBe(1);
        expect(result.walkInReservations[0].guestName).toBe("Jane Doe");
    });

    it("excludes canceled planned reservations", () => {
        const result = bucketizeReservations(mockEvents, mockReservations);

        expect(result.plannedReservations.length).toBe(1);
        expect(result.plannedReservations[0].guestName).toBe("John Doe");
    });

    it("only includes reservations matching the eventId", () => {
        const newReservation = { ...mockReservations[0], eventId: "event2", id: "res4" };
        const result = bucketizeReservations(mockEvents, [newReservation]);

        expect(result.plannedReservations.length).toBe(1);
        expect(result.plannedReservations[0].id).toBe("res4");
    });

    it("handles events without any reservations", () => {
        const result = bucketizeReservations(mockEvents, []);

        expect(result.plannedReservations.length).toBe(0);
        expect(result.walkInReservations.length).toBe(0);
    });

    // TODO: need to evaluate this scenario
    it.skip("excludes inactive reservations", () => {
        const inactiveReservation = {
            ...mockReservations[0],
            status: ReservationStatus.DELETED,
        };

        const result = bucketizeReservations(mockEvents, [inactiveReservation]);

        expect(result.plannedReservations.length).toBe(0);
    });

    it("handles multiple events for the property", () => {
        const multipleEvents: EventDoc[] = [
            mockEvents[0],
            {
                _doc: {} as any,
                creator: "user3",
                date: 1_690_000_200_000,
                entryPrice: 75,
                guestListLimit: 150,
                id: "event3",
                name: "Event 3",
                organisationId: "org3",
                propertyId: "prop1",
            },
        ];

        const result = bucketizeReservations(multipleEvents, mockReservations);

        expect(result.plannedReservations.length).toBe(1);
        expect(result.walkInReservations.length).toBe(1);
    });

    it("correctly adds mixed planned and walk-in reservations", () => {
        const mixedReservations: ReservationDocWithEventId[] = [
            mockReservations[0],
            mockReservations[1],
        ];

        const result = bucketizeReservations(mockEvents, mixedReservations);

        expect(result.plannedReservations.length).toBe(1);
        expect(result.walkInReservations.length).toBe(1);
    });
});
