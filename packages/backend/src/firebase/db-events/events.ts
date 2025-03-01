import type { CreateEventPayload, EventDoc, EventFloorDoc, FloorDoc } from "@firetable/types";
import type { DocumentData } from "firebase/firestore";
import type { HttpsCallableResult } from "firebase/functions";

import { Collection } from "@firetable/types";
import {
    addDoc,
    collection,
    deleteDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import type { EventOwner } from "../db.js";

import { initializeFirebase } from "../base.js";
import { eventDoc, eventFloorDoc, eventsCollection } from "../db.js";

type CreateNewEventReturn = {
    id: string;
    organisationId: string;
    propertyId: string;
};

/**
 * Adds a new floor to an event's floors subcollection
 * @param owner Event owner information
 * @param floorData Floor data to add
 * @returns Promise that resolves when the floor is added
 */
export function addEventFloor(owner: EventOwner, floorData: FloorDoc): Promise<DocumentData> {
    return addDoc(collection(eventDoc(owner), Collection.FLOORS), floorData);
}
export function createNewEvent(
    eventPayload: CreateEventPayload,
): Promise<HttpsCallableResult<CreateNewEventReturn>> {
    const { functions } = initializeFirebase();
    return httpsCallable<CreateEventPayload, CreateNewEventReturn>(
        functions,
        "createEvent",
    )(eventPayload);
}

/**
 * Deletes a floor from an event's floors subcollection
 * @param owner Event owner information
 * @param floorId ID of the floor to delete
 * @returns Promise that resolves when the floor is deleted
 */
export function deleteEventFloor(owner: EventOwner, floorId: string): Promise<void> {
    return deleteDoc(eventFloorDoc(owner, floorId));
}

export async function getEvents(
    lastDocument: DocumentData | undefined,
    countPerPage: number,
    owner: EventOwner,
): Promise<EventDoc[]> {
    // Newest date first
    const orderByDateQuery = orderBy("date", "desc");
    const limitQuery = limit(countPerPage);
    const propertyIdQuery = where("propertyId", "==", owner.propertyId);

    let finalQuery;
    if (lastDocument) {
        const startAfterQuery = startAfter(lastDocument);
        finalQuery = query(
            eventsCollection(owner),
            propertyIdQuery,
            orderByDateQuery,
            limitQuery,
            startAfterQuery,
        );
    } else {
        finalQuery = query(eventsCollection(owner), propertyIdQuery, orderByDateQuery, limitQuery);
    }

    const eventsDocs = await getDocs(finalQuery);

    return eventsDocs.docs.map(toEventDoc);
}

export function updateEvent(owner: EventOwner, data: Partial<EventDoc>): Promise<void> {
    return updateDoc(eventDoc(owner), {
        ...data,
    });
}

export function updateEventFloorData(
    owner: EventOwner,
    floorData: Pick<FloorDoc, "height" | "id" | "json" | "width">,
): Promise<void> {
    return updateDoc(eventFloorDoc(owner, floorData.id), {
        height: floorData.height,
        json: floorData.json,
        width: floorData.width,
    });
}

/**
 * Updates the order of floors in an event
 * @param owner Event owner information
 * @param floors Array of floors with their new order
 */
export async function updateEventFloorsOrder(
    owner: EventOwner,
    floors: EventFloorDoc[],
): Promise<void> {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    floors.forEach(function (floor) {
        const ref = eventFloorDoc(owner, floor.id);
        batch.update(ref, { order: floor.order });
    });

    await batch.commit();
}

function toEventDoc(doc: DocumentData): EventDoc {
    return {
        ...doc.data(),
        _doc: doc,
        id: doc.id,
    };
}
