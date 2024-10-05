import type { DeleteGuestVisitData } from "./delete-guest-visit.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { PreparedGuestData } from "../../../types/types";
import { deleteGuestVisitFn } from "./delete-guest-visit.js";
import * as Init from "../../init.js";
import { MockDocumentReference, MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { getGuestsPath } from "../../paths.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const preparedGuestData: PreparedGuestData = {
    contact: "guest1",
    maskedContact: "maskedContact",
    hashedContact: "hashedContact",
    guestName: "guestName",
    arrived: false,
    cancelled: false,
    isVIP: true,
};
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
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const guestData = {
            contact: preparedGuestData.contact,
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
        };
        await guestsCollectionRef.add(guestData);

        // Simulate an error when calling the update method
        vi.spyOn(MockDocumentReference.prototype, "update").mockRejectedValue(
            new Error("Update failed"),
        );

        await expect(
            deleteGuestVisitFn({
                data: {
                    preparedGuestData,
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
                    preparedGuestData: { contact: "nonexistentGuest", arrived: false },
                    propertyId,
                    organisationId,
                    eventId,
                },
            } as CallableRequest<DeleteGuestVisitData>),
        ).resolves.not.toThrow();

        // Verify that no guest document exists for 'nonexistentGuest'
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const querySnapshot = await guestsCollectionRef
            .where("contact", "==", "nonexistentGuest")
            .get();
        expect(querySnapshot.empty).toBe(true);
    });

    it("should delete a guest visit", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const guestData = {
            contact: preparedGuestData.contact,
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
        };
        const guestDocRef = await guestsCollectionRef.add(guestData);

        await deleteGuestVisitFn({
            data: {
                preparedGuestData,
                propertyId,
                organisationId,
                eventId,
            },
        } as CallableRequest<DeleteGuestVisitData>);

        const updatedGuestDocSnapshot = await guestDocRef.get();
        const updatedGuestDoc = updatedGuestDocSnapshot.data();

        expect(updatedGuestDoc.visitedProperties[propertyId][eventId]).toBeNull();
    });
});
