import type { CallableRequest } from "firebase-functions/v2/https";

import { Transaction } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MoveReservationToQueueReqPayload } from "./move-reservation-to-queue.js";

import { db } from "../../init.js";
import { getQueuedReservationsPath, getReservationsPath } from "../../paths.js";
import { moveReservationToQueueFn } from "./move-reservation-to-queue.js";

describe("moveReservationToQueueFn", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should throw an error if the user is unauthenticated", async () => {
        const req = {
            auth: null,
            data: {
                eventOwner: {
                    id: "event789",
                    organisationId: "org123",
                    propertyId: "prop456",
                },
                preparedQueuedReservation: {},
                reservationId: "reservation1",
            },
            rawRequest: {},
        } as unknown as CallableRequest<MoveReservationToQueueReqPayload>;

        await expect(moveReservationToQueueFn(req)).rejects.toThrow(
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
                preparedQueuedReservation: {},
            },
            rawRequest: {},
        } as CallableRequest<MoveReservationToQueueReqPayload>;

        await expect(moveReservationToQueueFn(req)).rejects.toThrow(
            new HttpsError("invalid-argument", "Missing required fields in the request payload."),
        );
    });

    it("should throw an error if the reservation does not exist", async () => {
        const req = {
            auth: { uid: "user1" },
            data: {
                eventOwner: {
                    id: "event789",
                    organisationId: "org123",
                    propertyId: "prop456",
                },
                preparedQueuedReservation: {},
                reservationId: "nonexistentReservation",
            },
            rawRequest: {},
        } as CallableRequest<MoveReservationToQueueReqPayload>;

        await expect(moveReservationToQueueFn(req)).rejects.toThrow(
            new HttpsError("not-found", "The reservation does not exist."),
        );
    });

    it("should successfully move the reservation to the queue", async () => {
        const reservation = {
            arrived: false,
            cancelled: false,
            consumption: 0,
            creator: {
                createdAt: Date.now(),
                email: "creator@example.com",
                id: "user1",
                name: "Creator",
            },
            floorId: "floor1",
            guestName: "John Doe",
            isVIP: false,
            numberOfGuests: 2,
            reservationConfirmed: false,
            reservedBy: {
                email: "foo@example.com",
                id: "reservedBy1",
                name: "Foo",
            },
            status: 1,
            tableLabel: "A1",
            time: "18:00",
            type: 1,
            waitingForResponse: false,
        };

        const eventOwner = {
            id: "event789",
            organisationId: "org123",
            propertyId: "prop456",
        };

        const preparedQueuedReservation = {
            consumption: 0,
            creator: {
                createdAt: reservation.creator.createdAt,
                email: "creator@example.com",
                id: "user1",
                name: "Creator",
            },
            guestName: "John Doe",
            isVIP: false,
            numberOfGuests: 2,
            reservedBy: {
                email: "foo@example.com",
                id: "reservedBy1",
                name: "Foo",
            },
            savedAt: 123,
            status: 1,
            time: "18:00",
        };

        const req = {
            // Same as reservation.creator.id
            auth: { uid: "user1" },
            data: {
                eventOwner,
                preparedQueuedReservation,
                reservationId: "reservation1",
            },
            rawRequest: {},
        } as unknown as CallableRequest<MoveReservationToQueueReqPayload>;

        // Add the reservation to MockFirestore
        const reservationRef = db
            .collection(getReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        await reservationRef.set(reservation);

        // Invoke the function
        const response = await moveReservationToQueueFn(req);

        expect(response).toEqual({
            message: "Reservation moved to queue successfully.",
            queuedReservationId: "reservation1",
            success: true,
        });

        // Verify that the reservation is now in queuedReservations
        const queuedReservationRef = db
            .collection(getQueuedReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        const queuedReservationSnapshot = await queuedReservationRef.get();
        expect(queuedReservationSnapshot.exists).toBe(true);
        const queuedReservationData = queuedReservationSnapshot.data();

        expect(queuedReservationData).toMatchObject({
            consumption: 0,
            creator: {
                createdAt: reservation.creator.createdAt,
                email: "creator@example.com",
                id: "user1",
                name: "Creator",
            },
            guestName: "John Doe",
            isVIP: false,
            numberOfGuests: 2,
            reservedBy: {
                email: "foo@example.com",
                id: "reservedBy1",
                name: "Foo",
            },
            savedAt: expect.any(Number),
            status: 1,
            time: "18:00",
        });

        // Verify that the reservation is deleted from reservations
        const originalReservationSnapshot = await reservationRef.get();
        expect(originalReservationSnapshot.exists).toBe(false);
    });

    it("should handle Firestore transaction failures gracefully", async () => {
        const reservation = {
            arrived: false,
            cancelled: false,
            consumption: 0,
            creator: {
                createdAt: Date.now(),
                email: "creator@example.com",
                id: "user1",
                name: "Creator",
            },
            floorId: "floor1",
            guestName: "John Doe",
            isVIP: false,
            numberOfGuests: 2,
            reservationConfirmed: false,
            reservedBy: {
                email: "foo@example.com",
                id: "reservedBy1",
                name: "Foo",
            },
            status: 1,
            tableLabel: "A1",
            time: "18:00",
            type: 1,
            waitingForResponse: false,
        };

        const eventOwner = {
            id: "event789",
            organisationId: "org123",
            propertyId: "prop456",
        };

        const preparedQueuedReservation = {
            consumption: 0,
            creator: {
                createdAt: reservation.creator.createdAt,
                email: "creator@example.com",
                id: "user1",
                name: "Creator",
            },
            date: 123,
            guestName: "John Doe",
            isVIP: false,
            numberOfGuests: 2,
            reservedBy: {
                email: "foo@example.com",
                id: "reservedBy1",
                name: "Foo",
            },
            status: 1,
            time: "18:00",
        };

        const req = {
            // Same as reservation.creator.id
            auth: { uid: "user1" },
            data: {
                eventOwner,
                preparedQueuedReservation,
                reservationId: "reservation1",
            },
            rawRequest: {},
        } as unknown as CallableRequest<MoveReservationToQueueReqPayload>;

        // Add the reservation to MockFirestore
        const reservationRef = db
            .collection(getReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        await reservationRef.set(reservation);

        // Mock the set operation to throw an error to simulate transaction failure
        vi.spyOn(Transaction.prototype, "set").mockImplementation(() => {
            throw new Error("Firestore set failed");
        });

        // Invoke the function and expect it to throw an internal error
        await expect(moveReservationToQueueFn(req)).rejects.toThrow(
            new HttpsError(
                "internal",
                "An unexpected error occurred while moving the reservation to the queue.",
            ),
        );

        // Verify that the reservation was not deleted due to the transaction failure
        const originalReservationSnapshot = await reservationRef.get();
        expect(originalReservationSnapshot.exists).toBe(true);

        // Verify that the queued reservation was not set
        const queuedReservationRef = db
            .collection(getQueuedReservationsPath("org123", "prop456", "event789"))
            .doc("reservation1");

        const queuedReservationSnapshot = await queuedReservationRef.get();
        expect(queuedReservationSnapshot.exists).toBe(false);
    });
});
