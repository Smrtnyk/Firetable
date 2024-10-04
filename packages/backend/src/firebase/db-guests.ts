import type { CreateGuestPayload, GuestDataPayload } from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";
import { initializeFirebase } from "./base.js";
import { guestDoc } from "./db.js";
import { getGuestsPath } from "./paths.js";
import { setDoc, deleteDoc, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export function setGuestData(guestData: GuestDataPayload): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "setGuestData")(guestData);
}

export function deleteGuestVisit(guestData: GuestDataPayload): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "deleteGuestVisit")(guestData);
}

export function deleteGuest(organisationId: string, guestId: string): Promise<void> {
    return deleteDoc(guestDoc(organisationId, guestId));
}

export function createGuest(organisationId: string, guestData: CreateGuestPayload): Promise<void> {
    const { firestore } = initializeFirebase();
    const newDoc = doc(firestore, getGuestsPath(organisationId), guestData.contact);
    return setDoc(newDoc, guestData);
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
        organisationId,
        guestId,
        updatedData,
    });
}
