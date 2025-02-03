import type { CreateGuestPayload, GuestDataPayload, GuestDoc, Visit } from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";

import {
    addDoc,
    collection,
    deleteDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { initializeFirebase } from "./base.js";
import { guestDoc } from "./db.js";
import { getGuestsPath } from "./paths.js";

export type GuestsSubscriptionCallback = {
    onAdd: (guest: GuestDoc) => void;
    onError?: (error: Error) => void;
    onModify: (guest: GuestDoc) => void;
    onReady?: () => void;
    onRemove: (guestId: string) => void;
};

export async function batchDeleteGuests(organisationId: string, guestIds: string[]): Promise<void> {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    for (const guestId of guestIds) {
        const guestRef = guestDoc(organisationId, guestId);
        batch.delete(guestRef);
    }

    await batch.commit();
}

export async function createGuest(
    organisationId: string,
    guestData: CreateGuestPayload,
): Promise<void> {
    const { firestore } = initializeFirebase();
    const guestsCollectionRef = collection(firestore, getGuestsPath(organisationId));
    await addDoc(guestsCollectionRef, guestData);
}

export function deleteGuest(organisationId: string, guestId: string): Promise<void> {
    return deleteDoc(guestDoc(organisationId, guestId));
}

export function deleteGuestVisit(guestData: GuestDataPayload): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "deleteGuestVisit")(guestData);
}

export function setGuestData(guestData: GuestDataPayload): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "setGuestData")(guestData);
}

export function subscribeToGuests(
    organisationId: string,
    callbacks: GuestsSubscriptionCallback,
): () => void {
    const { firestore } = initializeFirebase();
    return onSnapshot(
        collection(firestore, getGuestsPath(organisationId)),
        function (snapshot) {
            snapshot.docChanges().forEach(function (change) {
                const guest = {
                    ...change.doc.data(),
                    id: change.doc.id,
                } as GuestDoc;

                switch (change.type) {
                    case "added":
                        callbacks.onAdd(guest);
                        break;
                    case "modified":
                        callbacks.onModify(guest);
                        break;
                    case "removed":
                        callbacks.onRemove(guest.id);
                        break;
                }
            });

            callbacks.onReady?.();
        },
        function (error) {
            callbacks.onError?.(error);
        },
    );
}

/**
 * Updates a guest's contact and/or name via Cloud Function.
 *
 * @param organisationId - The ID of the organisation.
 * @param guestId - The current guest ID (current contact information).
 * @param updatedData - The updated guest data (name and contact).
 * @returns A promise that resolves when the update is complete.
 */
export async function updateGuestInfo(
    organisationId: string,
    guestId: string,
    updatedData: CreateGuestPayload,
): Promise<void> {
    const { functions } = initializeFirebase();
    const updateGuestInfoFn = httpsCallable(functions, "updateGuestData");

    await updateGuestInfoFn({
        guestId,
        organisationId,
        updatedData,
    });
}

export async function updateGuestVisit(
    organisationId: string,
    propertyId: string,
    guestId: string,
    visit: Visit,
): Promise<void> {
    const guestRef = guestDoc(organisationId, guestId);

    // Find the event ID by matching the date and event name
    const guestData = (await getDoc(guestDoc(organisationId, guestId))).data() as GuestDoc;

    if (!guestData?.visitedProperties?.[propertyId]) {
        throw new Error("Property or visit not found");
    }

    const events = guestData.visitedProperties[propertyId];
    const eventId = Object.entries(events).find(function ([, visitVal]) {
        return visitVal && visitVal.date === visit.date && visitVal.eventName === visit.eventName;
    })?.[0];

    if (!eventId) {
        throw new Error("Visit not found");
    }

    return updateDoc(guestRef, {
        [`visitedProperties.${propertyId}.${eventId}`]: visit,
        lastModified: Date.now(),
    });
}
