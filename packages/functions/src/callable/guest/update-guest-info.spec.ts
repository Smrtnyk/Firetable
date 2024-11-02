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
    const guestId = "guestDocId";
    const initialContact = "oldContact";
    const updatedContact = "newContact";
    const guestName = "Guest Name";
    const updatedName = "Updated Guest Name";

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFirestore = new MockFirestore();

        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    it("updates guest name when contact remains the same", async () => {
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

        expect(updatedData.name).toBe(updatedName);
        expect(updatedData.contact).toBe(initialContact);
        expect(updatedData.lastModified).toBeGreaterThan(0);
    });

    it("updates guest contact and name when contact changes", async () => {
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

        expect(updatedData.name).toBe(updatedName);
        expect(updatedData.contact).toBe(updatedContact);
        expect(updatedData.lastModified).toBeGreaterThan(0);
    });

    it("throws an error if guest does not exist", async () => {
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

    it("throws an error if updated contact already exists", async () => {
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

    it("updates guest tags when tags are provided", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const oldDocRef = guestsCollectionRef.doc(guestId);

        // Set up initial guest document with existing tags
        await oldDocRef.set({
            contact: initialContact,
            name: guestName,
            tags: ["Existing Tag"],
        });

        const newTags = ["Updated Tag 1", "Updated Tag 2"];

        const req = {
            data: {
                updatedData: {
                    contact: initialContact,
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    name: updatedName,
                    tags: newTags,
                },
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        const result = await updateGuestDataFn(req);

        expect(result.success).toBe(true);

        const updatedDocSnapshot = await oldDocRef.get();
        const updatedData = updatedDocSnapshot.data();

        expect(updatedData.name).toBe(updatedName);
        expect(updatedData.contact).toBe(initialContact);
        expect(updatedData.tags).toEqual(newTags);
        expect(updatedData.lastModified).toBeGreaterThan(0);
    });

    it("removes guest tags when tags are set to an empty array", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const oldDocRef = guestsCollectionRef.doc(guestId);

        // Set up initial guest document with existing tags
        await oldDocRef.set({
            contact: initialContact,
            name: guestName,
            tags: ["Existing Tag"],
        });

        const req = {
            data: {
                updatedData: {
                    contact: initialContact,
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    name: updatedName,
                    tags: [],
                },
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        const result = await updateGuestDataFn(req);

        expect(result.success).toBe(true);

        const updatedDocSnapshot = await oldDocRef.get();
        const updatedData = updatedDocSnapshot.data();

        expect(updatedData.tags).toEqual([]);
    });

    it("retains existing tags when tags are not provided in the update", async () => {
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const oldDocRef = guestsCollectionRef.doc(guestId);

        // Set up initial guest document with existing tags
        await oldDocRef.set({
            contact: initialContact,
            name: guestName,
            tags: ["Existing Tag"],
        });

        const req = {
            data: {
                updatedData: {
                    contact: initialContact,
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    name: updatedName,
                    // Note: tags are not provided here
                },
                guestId,
                organisationId,
            },
        } as CallableRequest<UpdateGuestInfo>;

        const result = await updateGuestDataFn(req);

        expect(result.success).toBe(true);

        const updatedDocSnapshot = await oldDocRef.get();
        const updatedData = updatedDocSnapshot.data();

        // The tags remain unchanged
        expect(updatedData.tags).toEqual(["Existing Tag"]);
    });
});
