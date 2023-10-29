import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";
import { collection, doc } from "firebase/firestore";
import { Collection, EventDoc, PropertyDoc } from "@firetable/types";

export type EventOwner = Pick<EventDoc, "organisationId" | "propertyId" | "id">;

function getCollection(collectionName: string) {
    const { firestore } = initializeFirebase();
    return collection(firestore, collectionName);
}

export function eventsCollection(owner: EventOwner) {
    return getCollection(
        `${Collection.ORGANISATIONS}/${owner.organisationId}/${Collection.PROPERTIES}/${owner.propertyId}/${Collection.EVENTS}`,
    );
}

export function propertiesCollection(organisationId: string) {
    return getCollection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`);
}

export function organisationsCollection() {
    return getCollection(Collection.ORGANISATIONS);
}

export function floorsCollection(organisationId: string, propertyId: string) {
    return getCollection(
        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}/${propertyId}/${Collection.FLOORS}`,
    );
}

export function guestListCollection(owner: EventOwner) {
    return collection(eventsCollection(owner), `${owner.id}/${Collection.GUEST_LIST}`);
}

export function usersCollection(organisationId: string) {
    return getCollection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`);
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
export function userDoc(organisationId: string, userId: string) {
    return doc(usersCollection(organisationId), userId);
}

export function eventDoc(owner: EventOwner) {
    return doc(eventsCollection(owner), owner.id);
}

export function floorDoc(property: Pick<PropertyDoc, "organisationId" | "id">, id: string) {
    return doc(floorsCollection(property.organisationId, property.id), id);
}

export function propertyDoc(id: string, organisationId: string) {
    return doc(propertiesCollection(organisationId), id);
}

export function organisationDoc(id: string) {
    return doc(organisationsCollection(), id);
}

export function eventFloorDoc(owner: EventOwner, floorId: string) {
    return doc(eventDoc(owner), `${Collection.FLOORS}/${floorId}`);
}

export function guestDoc(owner: EventOwner, guestId: string) {
    return doc(guestListCollection(owner), guestId);
}
