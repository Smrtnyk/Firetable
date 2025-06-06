import type { GuestInGuestListData } from "@firetable/types";
import type { DocumentReference } from "firebase/firestore";

import { addDoc, deleteDoc, updateDoc } from "firebase/firestore";

import type { EventOwner } from "../db.js";

import { guestListCollection, guestListDoc } from "../db.js";

export function addGuestToGuestList(
    owner: EventOwner,
    payload: GuestInGuestListData,
): Promise<DocumentReference> {
    return addDoc(guestListCollection(owner), payload);
}

export function confirmGuestFromGuestList(
    owner: EventOwner,
    guestID: string,
    confirmed: boolean,
): Promise<void> {
    return updateDoc(guestListDoc(owner, guestID), {
        confirmed,
        confirmedTime: confirmed ? Date.now() : null,
    });
}

export function deleteGuestFromGuestList(owner: EventOwner, guestID: string): Promise<void> {
    return deleteDoc(guestListDoc(owner, guestID));
}
