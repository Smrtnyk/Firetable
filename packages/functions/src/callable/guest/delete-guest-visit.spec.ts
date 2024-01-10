import type { DeleteGuestVisitData } from "./delete-guest-visit.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { deleteGuestVisitFn } from "./delete-guest-visit.js";
import * as Init from "../../init.js";
import { MockDocumentReference, MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { getGuestPath } from "../../paths.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const testReservation = { guestContact: "guest1", arrived: false };
const propertyId = "propertyId";
const organisationId = "orgId";
const eventId = "event1";
const date = Date.now();

describe("deleteGuestVisitFn", () => {
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFirestore = new MockFirestore();
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    it("should handle errors", async () => {
        const testPath = getGuestPath(organisationId, testReservation.guestContact);

        // Setup initial guest document
        await mockFirestore.doc(testPath).set({
            visitedProperties: {
                [propertyId]: {
                    [eventId]: {
                        arrived: false,
                        cancelled: false,
                        date,
                        eventName: "eventName",
                    },
                },
            },
        });

        // Simulate an error when calling the update method
        vi.spyOn(MockDocumentReference.prototype, "update").mockRejectedValue(
            new Error("Update failed"),
        );

        await expect(
            deleteGuestVisitFn({
                data: {
                    reservation: testReservation,
                    propertyId,
                    organisationId,
                    eventId,
                },
            } as CallableRequest<DeleteGuestVisitData>),
        ).rejects.toThrow("Error processing the request.");
    });

    it("should handle non-existent guest", async () => {
        await expect(
            deleteGuestVisitFn({
                data: {
                    reservation: { guestContact: "nonexistentGuest", arrived: false },
                    propertyId,
                    organisationId,
                    eventId,
                },
            } as CallableRequest<DeleteGuestVisitData>),
        ).resolves.not.toThrow();

        const nonExistentGuestDoc = mockFirestore.getDataAtPath(
            getGuestPath(organisationId, "nonexistentGuest"),
        );
        expect(nonExistentGuestDoc).toBeUndefined();
    });

    it("should delete a guest visit", async () => {
        const testPath = getGuestPath(organisationId, testReservation.guestContact);

        // Setup initial guest document
        await mockFirestore.doc(testPath).set({
            visitedProperties: {
                [propertyId]: {
                    [eventId]: {
                        arrived: false,
                        cancelled: false,
                        date,
                        eventName: "eventName",
                    },
                },
            },
        });

        await deleteGuestVisitFn({
            data: {
                reservation: testReservation,
                propertyId,
                organisationId,
                eventId,
            },
        } as CallableRequest<DeleteGuestVisitData>);

        const updatedGuestDoc = mockFirestore.getDataAtPath(testPath);
        expect(updatedGuestDoc.visitedProperties[propertyId][eventId]).toBeNull();
    });
});
