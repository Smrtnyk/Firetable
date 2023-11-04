import { initializeFirebase } from "./base.js";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { DocumentReference, collection, doc, CollectionReference } from "firebase/firestore";
import { Collection, EventDoc, PropertyDoc } from "@firetable/types";
import { getEventsPath, getFloorsPath, getPropertiesPath } from "./paths.js";

export type EventOwner = Pick<EventDoc, "organisationId" | "propertyId" | "id">;

function getCollection(collectionName: string): CollectionReference {
    const { firestore } = initializeFirebase();
    return collection(firestore, collectionName);
}

export function eventsCollection(owner: EventOwner): CollectionReference {
    return getCollection(getEventsPath(owner));
}

export function propertiesCollection(organisationId: string): CollectionReference {
    return getCollection(getPropertiesPath(organisationId));
}

export function organisationsCollection(): CollectionReference {
    return getCollection(Collection.ORGANISATIONS);
}

export function floorsCollection(organisationId: string, propertyId: string): CollectionReference {
    return getCollection(getFloorsPath(organisationId, propertyId));
}

export function guestListCollection(owner: EventOwner): CollectionReference {
    return collection(eventsCollection(owner), `${owner.id}/${Collection.GUEST_LIST}`);
}

export function usersCollection(organisationId: string): CollectionReference {
    return getCollection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`);
}

/**
 * Call the 'recursiveDelete' callable function with a path to initiate
 * a server-side delete.
 */
export function deleteDocAndAllSubCollections(
    collectionPath: string,
    docId: string,
): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    const deleteFn = httpsCallable(functions, "deleteCollection");
    return deleteFn({ col: collectionPath, id: docId });
}

// DOCS

export function eventDoc(owner: EventOwner): DocumentReference {
    return doc(eventsCollection(owner), owner.id);
}

export function floorDoc(
    property: Pick<PropertyDoc, "organisationId" | "id">,
    id: string,
): DocumentReference {
    return doc(floorsCollection(property.organisationId, property.id), id);
}

export function propertyDoc(id: string, organisationId: string): DocumentReference {
    return doc(propertiesCollection(organisationId), id);
}

export function organisationDoc(id: string): DocumentReference {
    return doc(organisationsCollection(), id);
}

export function eventFloorDoc(owner: EventOwner, floorId: string): DocumentReference {
    return doc(eventDoc(owner), `${Collection.FLOORS}/${floorId}`);
}

export function guestDoc(owner: EventOwner, guestId: string): DocumentReference {
    return doc(guestListCollection(owner), guestId);
}
