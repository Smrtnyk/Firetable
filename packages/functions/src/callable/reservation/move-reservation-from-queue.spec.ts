import type { CallableRequest } from "firebase-functions/v2/https";
import type { MoveReservationFromQueueReqPayload } from "./move-reservation-from-queue.js";
import { moveReservationFromQueueFn } from "./move-reservation-from-queue.js";
import { getQueuedReservationsPath, getReservationsPath } from "../../paths.js";
import { db } from "../../init.js";
import { HttpsError } from "firebase-functions/v2/https";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Transaction } from "firebase-admin/firestore";

describe("moveReservationFromQueueFn", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should throw an error if the user is unauthenticated", async () => {
        const req = {
            auth: null,
            data: {
                eventOwner: {
                    organisationId: "org123",
                    propertyId: "prop456",
                    id: "event789",
                },
                reservationId: "reservation1",
                preparedPlannedReservation: {},
            },
            rawRequest: {},
        } as unknown as CallableRequest<MoveReservationFromQueueReqPayload>;

        await expect(moveReservationFromQueueFn(req)).rejects.toThrow(
            new HttpsError(
                "failed-precondition",
                "The function must be called while authenticated.",
            ),
        );
    });

    it("should throw an error if required fields are missing", async () => {
        const req = {
            auth: { uid: "user1" },
            data: {
                // Missing eventOwner and reservationId
                preparedPlannedReservation: {},
            },
            rawRequest: {},
        } as CallableRequest<MoveReservationFromQueueReqPayload>;

        await expect(moveReservationFromQueueFn(req)).rejects.toThrow(
            new HttpsError("invalid-argument", "Missing required fields in the request payload."),
        );
    });

    it("should throw an error if the reservation does not exist", async () => {
        const req = {
            auth: { uid: "user1" },
            data: {
                eventOwner: {
                    organisationId: "org123",
                    propertyId: "prop456",
                    id: "event789",
                },
                reservationId: "nonexistentReservation",
                preparedPlannedReservation: {},
            },
            rawRequest: {},
        } as CallableRequest<MoveReservationFromQueueReqPayload>;

        await expect(moveReservationFromQueueFn(req)).rejects.toThrow(
            new HttpsError("not-found", "The queued reservation does not exist."),
        );
    });

    it("should successfully move the reservation from the queue", async () => {
        const reservation = {
            arrived: false,
            cancelled: false,
            reservationConfirmed: false,
            waitingForResponse: false,
            type: 1,
            reservedBy: {
                email: "foo@example.com",
                name: "Foo",
                id: "reservedBy1",
            },
            creator: {
                id: "user1",
                email: "creator@example.com",
                name: "Creator",
                createdAt: Date.now(),
            },
            guestName: "John Doe",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "18:00",
            floorId: "floor1",
            tableLabel: "A1",
            status: 1,
        };

        const eventOwner = {
            organisationId: "org123",
            propertyId: "prop456",
            id: "event789",
        };

        const preparedPlannedReservation = {
            guestName: "John Doe",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "18:00",
            reservedBy: {
                email: "foo@example.com",
                name: "Foo",
                id: "reservedBy1",
            },
            creator: {
                id: "user1",
                email: "creator@example.com",
                name: "Creator",
                createdAt: reservation.creator.createdAt,
            },
            status: 1,
            savedAt: 123,
        };

        const req = {
            // Same as reservation.creator.id
            auth: { uid: "user1" },
            data: {
                eventOwner,
                reservationId: "reservation1",
                preparedPlannedReservation,
            },
            rawRequest: {},
        } as unknown as CallableRequest<MoveReservationFromQueueReqPayload>;

        // Add the queued reservation to MockFirestore
        const reservationRef = db
            .collection(getQueuedReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        await reservationRef.set(reservation);

        // Invoke the function
        const response = await moveReservationFromQueueFn(req);

        expect(response).toEqual({
            success: true,
            message: "Queued reservation moved from the queue successfully.",
            queuedReservationId: "reservation1",
        });

        // Verify that the reservation is now in planned reservations
        const plannedReservationRef = db
            .collection(getReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        const queuedReservationSnapshot = await plannedReservationRef.get();
        expect(queuedReservationSnapshot.exists).toBe(true);
        const queuedReservationData = queuedReservationSnapshot.data();

        expect(queuedReservationData).toMatchObject({
            guestName: "John Doe",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "18:00",
            reservedBy: {
                email: "foo@example.com",
                name: "Foo",
                id: "reservedBy1",
            },
            creator: {
                id: "user1",
                email: "creator@example.com",
                name: "Creator",
                createdAt: reservation.creator.createdAt,
            },
            status: 1,
            savedAt: expect.any(Number),
        });

        // Verify that the reservation is deleted from reservations
        const originalReservationSnapshot = await reservationRef.get();
        expect(originalReservationSnapshot.exists).toBe(false);
    });

    it("should handle Firestore transaction failures gracefully", async () => {
        const reservation = {
            arrived: false,
            cancelled: false,
            reservationConfirmed: false,
            waitingForResponse: false,
            type: 1,
            reservedBy: {
                email: "foo@example.com",
                name: "Foo",
                id: "reservedBy1",
            },
            creator: {
                id: "user1",
                email: "creator@example.com",
                name: "Creator",
                createdAt: Date.now(),
            },
            guestName: "John Doe",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "18:00",
            floorId: "floor1",
            tableLabel: "A1",
            status: 1,
        };

        const eventOwner = {
            organisationId: "org123",
            propertyId: "prop456",
            id: "event789",
        };

        const preparedPlannedReservation = {
            guestName: "John Doe",
            consumption: 0,
            isVIP: false,
            numberOfGuests: 2,
            time: "18:00",
            reservedBy: {
                email: "foo@example.com",
                name: "Foo",
                id: "reservedBy1",
            },
            creator: {
                id: "user1",
                email: "creator@example.com",
                name: "Creator",
                createdAt: reservation.creator.createdAt,
            },
            date: 123,
            status: 1,
        };

        const req = {
            // Same as reservation.creator.id
            auth: { uid: "user1" },
            data: {
                eventOwner,
                reservationId: "reservation1",
                preparedPlannedReservation,
            },
            rawRequest: {},
        } as unknown as CallableRequest<MoveReservationFromQueueReqPayload>;

        // Add the reservation to MockFirestore
        const queuedReservationRef = db
            .collection(getQueuedReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        await queuedReservationRef.set(reservation);

        // Mock the set operation to throw an error to simulate transaction failure
        vi.spyOn(Transaction.prototype, "set").mockImplementation(() => {
            throw new Error("Firestore set failed");
        });

        // Invoke the function and expect it to throw an internal error
        await expect(moveReservationFromQueueFn(req)).rejects.toThrow(
            new HttpsError(
                "internal",
                "An unexpected error occurred while moving the reservation from the queue.",
            ),
        );

        // Verify that the reservation was not deleted due to the transaction failure
        const originalReservationSnapshot = await queuedReservationRef.get();
        expect(originalReservationSnapshot.exists).toBe(true);

        // Verify that the queued reservation was not set
        const plannedReservationRef = db
            .collection(getReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        const plannedReservationSnapshot = await plannedReservationRef.get();
        expect(plannedReservationSnapshot.exists).toBe(false);
    });
});
