import type { CallableRequest } from "firebase-functions/v2/https";
import type { UpdateGuestInfo } from "./update-guest-info";
import { updateGuestDataFn } from "./update-guest-info";
import { MockFirestore } from "../../../test-helpers/MockFirestore";
import * as Init from "../../init";
import { getGuestsPath } from "../../paths";
import { HttpsError } from "firebase-functions/v2/https";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("updateGuestDataFn", () => {
    let mockFirestore: MockFirestore;

    const organisationId = "orgId";
    // Firestore-generated ID
    const guestId = "guestDocId";
    const initialContact = "oldContact";
    const updatedContact = "newContact";
    const guestName = "Guest Name";
    const updatedName = "Updated Guest Name";

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFirestore = new MockFirestore();

        // Mock the Firestore instance in Init
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    it("should update guest name when contact remains the same", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const oldDocRef = guestsCollectionRef.doc(guestId);

        // Set up initial guest document
        await oldDocRef.set({
            contact: initialContact,
            name: guestName,
        });

        const req = {
            data: {
                updatedData: {
                    contact: initialContact,
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    name: updatedName,
                },
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        const result = await updateGuestDataFn(req);

        expect(result.success).toBe(true);

        const updatedDocSnapshot = await oldDocRef.get();
        const updatedData = updatedDocSnapshot.data();

        expect(updatedData?.name).toBe(updatedName);
        expect(updatedData?.contact).toBe(initialContact);
    });

    it("should update guest contact and name when contact changes", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const oldDocRef = guestsCollectionRef.doc(guestId);

        // Set up initial guest document
        await oldDocRef.set({
            contact: initialContact,
            name: guestName,
        });

        const req = {
            data: {
                updatedData: {
                    // New contact
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    contact: updatedContact,
                    name: updatedName,
                },
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        const result = await updateGuestDataFn(req);

        expect(result.success).toBe(true);

        const updatedDocSnapshot = await oldDocRef.get();
        const updatedData = updatedDocSnapshot.data();

        expect(updatedData?.name).toBe(updatedName);
        expect(updatedData?.contact).toBe(updatedContact);
    });

    it("should throw an error if guest does not exist", async () => {
        const req = {
            data: {
                updatedData: {
                    contact: updatedContact,
                    name: updatedName,
                },
                // This guestId does not exist
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        await expect(updateGuestDataFn(req)).rejects.toThrowError(
            new HttpsError("not-found", "Guest does not exist."),
        );
    });

    it("should throw an error if updated contact already exists", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const oldDocRef = guestsCollectionRef.doc(guestId);

        // Set up initial guest document
        await oldDocRef.set({
            contact: initialContact,
            name: guestName,
        });

        // Set up another guest with the updated contact
        await guestsCollectionRef.add({
            contact: updatedContact,
            name: "Another Guest",
        });

        const req = {
            data: {
                updatedData: {
                    contact: updatedContact,
                    name: updatedName,
                },
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        await expect(updateGuestDataFn(req)).rejects.toThrowError(
            new HttpsError("already-exists", "A guest with the updated contact already exists."),
        );
    });
});
