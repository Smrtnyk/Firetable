import type { HttpsCallableResult } from "firebase/functions";
import type { DocumentReference, CollectionReference } from "firebase/firestore";
import type { EventDoc, PropertyDoc } from "@firetable/types";
import { initializeFirebase } from "./base.js";
import {
    getEventsPath,
    getFloorsPath,
    getGuestsPath,
    getInventoryPath,
    getPropertiesPath,
} from "./paths.js";
import { EVENT_LOGS_DOCUMENT, Collection } from "@firetable/types";
import { httpsCallable } from "firebase/functions";
import { collection, doc } from "firebase/firestore";

export type EventOwner = Pick<EventDoc, "id" | "organisationId" | "propertyId">;

function getCollection(collectionName: string): CollectionReference {
    const { firestore } = initializeFirebase();
    return collection(firestore, collectionName);
}

export function getInventoryCollection(
    organisationId: string,
    propertyId: string,
): CollectionReference {
    return getCollection(getInventoryPath(organisationId, propertyId));
}

export function guestsCollection(organisationId: string): CollectionReference {
    return getCollection(getGuestsPath(organisationId));
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

export function reservationsCollection(owner: EventOwner): CollectionReference {
    return collection(eventDoc(owner), Collection.RESERVATIONS);
}

export function queuedReservationsCollection(owner: EventOwner): CollectionReference {
    return collection(eventDoc(owner), Collection.QUEUED_RESERVATIONS);
}

export function reservationDoc(owner: EventOwner, reservationId: string): DocumentReference {
    return doc(reservationsCollection(owner), reservationId);
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

export function eventLogsDoc(owner: EventOwner): DocumentReference {
    return doc(eventsCollection(owner), owner.id, Collection.EVENT_LOGS, EVENT_LOGS_DOCUMENT);
}

export function floorDoc(
    property: Pick<PropertyDoc, "id" | "organisationId">,
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

export function guestListDoc(owner: EventOwner, guestId: string): DocumentReference {
    return doc(guestListCollection(owner), guestId);
}

export function guestDoc(organisationId: string, guestId: string): DocumentReference {
    return doc(guestsCollection(organisationId), guestId);
}
