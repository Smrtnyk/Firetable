import { bucketizeReservations } from "./bucketize-reservations.js";
import {
    ReservationStatus,
    ReservationType,
    type EventDoc,
    type ReservationDocWithEventId,
} from "@firetable/types";
import { describe, it, expect } from "vitest";

const mockEvents: EventDoc[] = [
    {
        id: "event1",
        propertyId: "prop1",
        date: 1_690_000_000_000,
        name: "Event 1",
        guestListLimit: 100,
        entryPrice: 50,
        creator: "user1",
        organisationId: "org1",
        _doc: {} as any,
    },
    {
        id: "event2",
        propertyId: "prop1",
        date: 1_690_000_100_000,
        name: "Event 2",
        guestListLimit: 200,
        entryPrice: 100,
        creator: "user2",
        organisationId: "org2",
        _doc: {} as any,
    },
];

const mockReservations: ReservationDocWithEventId[] = [
    {
        id: "res1",
        eventId: "event1",
        type: ReservationType.PLANNED,
        status: ReservationStatus.ACTIVE,
        floorId: "floor1",
        tableLabel: "Table 1",
        guestName: "John Doe",
        numberOfGuests: 4,
        time: "18:00",
        creator: {
            email: "creator1@example.com",
            id: "creator1",
            name: "Creator One",
            createdAt: Date.now(),
        },
        isVIP: true,
        reservationConfirmed: true,
        cancelled: false,
        arrived: true,
        consumption: 100,
        reservedBy: { email: "reserver@example.com", id: "reserver", name: "Reserver One" },
    },
    {
        id: "res2",
        eventId: "event1",
        type: ReservationType.WALK_IN,
        status: ReservationStatus.ACTIVE,
        floorId: "floor1",
        tableLabel: "Table 2",
        guestName: "Jane Doe",
        numberOfGuests: 2,
        time: "19:00",
        creator: {
            email: "creator2@example.com",
            id: "creator2",
            name: "Creator Two",
            createdAt: Date.now(),
        },
        isVIP: false,
        arrived: true,
        consumption: 50,
    },
    {
        id: "res3",
        eventId: "event1",
        type: ReservationType.PLANNED,
        status: ReservationStatus.ACTIVE,
        floorId: "floor2",
        tableLabel: "Table 3",
        guestName: "Alice",
        numberOfGuests: 3,
        time: "20:00",
        creator: {
            email: "creator3@example.com",
            id: "creator3",
            name: "Creator Three",
            createdAt: Date.now(),
        },
        isVIP: false,
        reservationConfirmed: true,
        cancelled: true,
        arrived: false,
        consumption: 70,
        reservedBy: { email: "reserver@example.com", id: "reserver", name: "Reserver One" },
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
                id: "event3",
                propertyId: "prop1",
                date: 1_690_000_200_000,
                name: "Event 3",
                guestListLimit: 150,
                entryPrice: 75,
                creator: "user3",
                organisationId: "org3",
                _doc: {} as any,
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
