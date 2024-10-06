import type { DocumentData } from "firebase/firestore";
import type { EventOwner } from "../db.js";
import type { CreateEventPayload, EventDoc, FloorDoc } from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";
import { eventFloorDoc, eventDoc, eventsCollection } from "../db.js";
import { initializeFirebase } from "../base.js";
import { updateDoc, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export function updateEventFloorData(
    owner: EventOwner,
    floorData: Pick<FloorDoc, "id" | "json">,
): Promise<void> {
    return updateDoc(eventFloorDoc(owner, floorData.id), {
        json: floorData.json,
    });
}

type CreateNewEventReturn = {
    id: string;
    organisationId: string;
    propertyId: string;
};
export function createNewEvent(
    eventPayload: CreateEventPayload,
): Promise<HttpsCallableResult<CreateNewEventReturn>> {
    const { functions } = initializeFirebase();
    return httpsCallable<CreateEventPayload, CreateNewEventReturn>(
        functions,
        "createEvent",
    )(eventPayload);
}

export function updateEvent(owner: EventOwner, data: Partial<EventDoc>): Promise<void> {
    return updateDoc(eventDoc(owner), {
        ...data,
    });
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

function toEventDoc(doc: DocumentData): EventDoc {
    return {
        ...doc.data(),
        id: doc.id,
        _doc: doc,
    };
}
