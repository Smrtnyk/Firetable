import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";
import { collection, doc } from "firebase/firestore";
import { Collection } from "@firetable/types";

function getCollection(collectionName: Collection) {
    const { firestore } = initializeFirebase();
    return collection(firestore, collectionName);
}

export function eventsCollection() {
    return getCollection(Collection.EVENTS);
}

export function clubsCollection() {
    return getCollection(Collection.CLUBS);
}

export function floorsCollection() {
    return getCollection(Collection.FLOORS);
}

export function guestListCollection(eventId: string) {
    return collection(eventsCollection(), `${eventId}/${Collection.GUEST_LIST}`);
}

export function usersCollection() {
    return getCollection(Collection.USERS);
}

export function fcm() {
    return getCollection(Collection.FCM);
}

/**
 * Call the 'recursiveDelete' callable function with a path to initiate
 * a server-side delete.
 */
export function deleteCollection(id: string) {
    const { functions } = initializeFirebase();
    const deleteFn = httpsCallable(functions, "deleteCollection");
    return deleteFn({ col: Collection.EVENTS, id });
}

// DOCS
export function userDoc(userId: string) {
    return doc(usersCollection(), userId);
}

export function eventDoc(eventId: string) {
    return doc(eventsCollection(), eventId);
}

export function floorDoc(id: string) {
    return doc(floorsCollection(), id);
}

export function eventFloorDoc(eventId: string, floorId: string) {
    return doc(eventDoc(eventId), `${Collection.FLOORS}/${floorId}`);
}

export function guestDoc(eventId: string, guestId: string) {
    return doc(guestListCollection(eventId), guestId);
}
