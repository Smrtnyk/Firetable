import type { CallableRequest } from "firebase-functions/v2/https";
import type { GuestDoc } from "../../../types/types";
import { updateGuestDataFn } from "./update-guest-info";
import { MockFirestore } from "../../../test-helpers/MockFirestore";
import * as Init from "../../init";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("updateGuestDataFn", () => {
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFirestore = new MockFirestore();

        // Mock the Firestore instance in Init
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    it("should update guest name when contact remains the same", async () => {
        const organisationId = "org1";
        const guestId = "contact1";
        const oldGuestData: GuestDoc = {
            name: "Old Name",
            contact: guestId,
            visitedProperties: {},
        };
        const updatedData = {
            name: "New Name",
            // Contact remains the same
            contact: guestId,
        };

        // Set up the initial guest document
        await mockFirestore
            .collection(`organisations/${organisationId}/guests`)
            .doc(guestId)
            .set(oldGuestData);

        // Call the Cloud Function
        const result = await updateGuestDataFn({
            data: { updatedData, guestId, organisationId },
        } as CallableRequest<any>);

        expect(result).toEqual({ success: true });

        // Verify that the name was updated
        const updatedGuestDoc = mockFirestore.getDataAtPath(
            `organisations/${organisationId}/guests/${guestId}`,
        );
        expect(updatedGuestDoc.name).toBe(updatedData.name);
        // Contact remains unchanged
        expect(updatedGuestDoc.contact).toBe(guestId);
    });

    it("should update guest contact and name when contact changes", async () => {
        const organisationId = "org1";
        const guestId = "contact1";
        const newContact = "contact2";
        const oldGuestData: GuestDoc = {
            name: "Old Name",
            contact: guestId,
            visitedProperties: {
                property1: {
                    event1: {
                        arrived: true,
                        cancelled: false,
                        date: Date.now(),
                        eventName: "Event 1",
                        isVIPVisit: false,
                    },
                },
            },
        };
        const updatedData = {
            name: "New Name",
            // Contact has changed
            contact: newContact,
        };

        // Set up the initial guest document
        await mockFirestore
            .collection(`organisations/${organisationId}/guests`)
            .doc(guestId)
            .set(oldGuestData);

        // Call the Cloud Function
        const result = await updateGuestDataFn({
            data: { updatedData, guestId, organisationId },
        } as CallableRequest<any>);

        expect(result).toEqual({ success: true });

        // Verify that the old document was deleted
        const oldGuestDoc = mockFirestore.getDataAtPath(
            `organisations/${organisationId}/guests/${guestId}`,
        );
        expect(oldGuestDoc).toBeUndefined();

        // Verify that the new document was created with updated data
        const newGuestDoc = mockFirestore.getDataAtPath(
            `organisations/${organisationId}/guests/${newContact}`,
        );
        expect(newGuestDoc.name).toBe(updatedData.name);
        expect(newGuestDoc.contact).toBe(newContact);
        // Ensure that visitedProperties were preserved
        expect(newGuestDoc.visitedProperties).toEqual(oldGuestData.visitedProperties);
    });

    it("should throw an error if the guest does not exist", async () => {
        const organisationId = "org1";
        const guestId = "nonexistentGuest";
        const updatedData = {
            name: "New Name",
            contact: guestId,
        };

        // Call the Cloud Function without setting up the guest document
        await expect(
            updateGuestDataFn({
                data: { updatedData, guestId, organisationId },
            } as CallableRequest<any>),
        ).rejects.toThrowError("Guest does not exist.");
    });

    it("should throw an error if a guest with the updated contact already exists", async () => {
        const organisationId = "org1";
        const guestId = "contact1";
        const newContact = "contact2";
        const oldGuestData: GuestDoc = {
            name: "Old Name",
            contact: guestId,
            visitedProperties: {},
        };
        const existingGuestData: GuestDoc = {
            name: "Existing Guest",
            contact: newContact,
            visitedProperties: {},
        };
        const updatedData = {
            name: "New Name",
            // Attempting to change contact to an existing one
            contact: newContact,
        };

        // Set up the initial guest document
        await mockFirestore
            .collection(`organisations/${organisationId}/guests`)
            .doc(guestId)
            .set(oldGuestData);

        // Set up another guest with the new contact
        await mockFirestore
            .collection(`organisations/${organisationId}/guests`)
            .doc(newContact)
            .set(existingGuestData);

        // Call the Cloud Function
        await expect(
            updateGuestDataFn({
                data: { updatedData, guestId, organisationId },
            } as CallableRequest<any>),
        ).rejects.toThrowError("A guest with the updated contact already exists.");
    });

    it("should handle errors during transaction", async () => {
        const organisationId = "org1";
        const guestId = "contact1";
        const newContact = "contact2";
        const oldGuestData: GuestDoc = {
            name: "Old Name",
            contact: guestId,
            visitedProperties: {},
        };
        const updatedData = {
            name: "New Name",
            contact: newContact,
        };

        // Set up the initial guest document
        await mockFirestore
            .collection(`organisations/${organisationId}/guests`)
            .doc(guestId)
            .set(oldGuestData);

        // Mock the runTransaction method to throw an error
        vi.spyOn(mockFirestore, "runTransaction").mockRejectedValue(
            new Error("Transaction failed"),
        );

        // Call the Cloud Function
        await expect(
            updateGuestDataFn({
                data: { updatedData, guestId, organisationId },
            } as CallableRequest<any>),
        ).rejects.toThrowError("Transaction failed");
    });
});
