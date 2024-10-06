import type { EventOwner } from "../db.js";
import type { GuestInGuestListData } from "@firetable/types";
import type { DocumentReference } from "firebase/firestore";
import { guestListDoc, guestListCollection } from "../db.js";
import { updateDoc, deleteDoc, addDoc } from "firebase/firestore";

export function confirmGuestFromGuestList(
    owner: EventOwner,
    guestID: string,
    confirmed: boolean,
): Promise<void> {
    return updateDoc(guestListDoc(owner, guestID), { confirmed });
}

export function deleteGuestFromGuestList(owner: EventOwner, guestID: string): Promise<void> {
    return deleteDoc(guestListDoc(owner, guestID));
}

export function addGuestToGuestList(
    owner: EventOwner,
    payload: GuestInGuestListData,
): Promise<DocumentReference> {
    return addDoc(guestListCollection(owner), payload);
}
