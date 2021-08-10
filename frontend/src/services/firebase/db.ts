import { firestore, functions } from "./base";
import { Collection } from "src/types";
import { httpsCallable } from "@firebase/functions";

function collection(collectionName: Collection) {
    return firestore().collection(collectionName);
}

export function eventsCollection() {
    return collection(Collection.EVENTS);
}

export function floorsCollection() {
    return collection(Collection.FLOORS);
}

export function eventFloorsCollection(eventId: string) {
    return eventsCollection().doc(eventId).collection(Collection.FLOORS);
}

export const eventFeedCollection = (eventId: string) => {
    return eventsCollection().doc(eventId).collection(Collection.EVENT_FEED);
};

export function guestListCollection(eventId: string) {
    return eventsCollection().doc(eventId).collection(Collection.GUEST_LIST);
}

export function usersCollection() {
    return collection(Collection.USERS);
}

export function fcm() {
    return collection(Collection.FCM);
}

/**
 * Call the 'recursiveDelete' callable function with a path to initiate
 * a server-side delete.
 */
export function deleteCollection(id: string) {
    const deleteFn = httpsCallable(functions(), "deleteCollection");
    return deleteFn({ col: Collection.EVENTS, id });
}

// DOCS

export function eventDoc(eventId: string) {
    return eventsCollection().doc(eventId);
}

export function floorDoc(id: string) {
    return floorsCollection().doc(id);
}

export function eventFloorDoc(eventId: string, floorId: string) {
    return eventDoc(eventId).collection(Collection.FLOORS).doc(floorId);
}

export function guestDoc(eventId: string, guestId: string) {
    return guestListCollection(eventId).doc(guestId);
}
