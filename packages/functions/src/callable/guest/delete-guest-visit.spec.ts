import type { CallableRequest } from "firebase-functions/v2/https";

import { DocumentReference } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeleteGuestVisitData } from "./delete-guest-visit.js";
import type { PreparedGuestData } from "./set-guest-data.js";

import { db } from "../../init.js";
import { getGuestsPath } from "../../paths.js";
import { deleteGuestVisitFn } from "./delete-guest-visit.js";

const preparedGuestData: PreparedGuestData = {
    arrived: false,
    cancelled: false,
    contact: "guest1",
    guestName: "guestName",
    hashedContact: "hashedContact",
    isVIP: true,
    maskedContact: "maskedContact",
};
const propertyId = "propertyId";
const organisationId = "orgId";
const eventId = "event1";
const date = Date.now();

describe("deleteGuestVisitFn", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should handle errors", async () => {
        const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
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
        vi.spyOn(DocumentReference.prototype, "update").mockRejectedValue(
            new Error("Update failed"),
        );

        await expect(
            deleteGuestVisitFn({
                data: {
                    eventId,
                    organisationId,
                    preparedGuestData,
                    propertyId,
                },
            } as CallableRequest<DeleteGuestVisitData>),
        ).rejects.toThrow("Error processing the request.");
    });

    it("should handle non-existent guest", async () => {
        await expect(
            deleteGuestVisitFn({
                data: {
                    eventId,
                    organisationId,
                    preparedGuestData: { arrived: false, contact: "nonexistentGuest" },
                    propertyId,
                },
            } as CallableRequest<DeleteGuestVisitData>),
        ).resolves.not.toThrow();

        // Verify that no guest document exists for 'nonexistentGuest'
        const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
        const querySnapshot = await guestsCollectionRef
            .where("contact", "==", "nonexistentGuest")
            .get();
        expect(querySnapshot.empty).toBe(true);
    });

    it("should delete a guest visit", async () => {
        const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
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
                eventId,
                organisationId,
                preparedGuestData,
                propertyId,
            },
        } as CallableRequest<DeleteGuestVisitData>);

        const updatedGuestDocSnapshot = await guestDocRef.get();
        const updatedGuestDoc = updatedGuestDocSnapshot.data();

        expect(updatedGuestDoc?.visitedProperties[propertyId][eventId]).toBeNull();
    });
});
