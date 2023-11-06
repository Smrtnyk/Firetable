import {
    eventsCollection,
    guestListCollection,
    guestDoc,
    eventFloorDoc,
    eventDoc,
    EventOwner,
} from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import {
    DocumentData,
    getDocs,
    orderBy,
    limit,
    startAfter,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    where,
    DocumentReference,
} from "firebase/firestore";
import { CreateEventPayload, EventDoc, GuestData } from "@firetable/types";
import { Floor } from "@firetable/floor-creator";

export async function getEvents(
    lastDocument: DocumentData | null,
    countPerPage: number,
    owner: EventOwner,
): Promise<EventDoc[]> {
    const orderByDateQuery = orderBy("date", "desc"); // Newest date first
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

export function updateEvent(owner: EventOwner, data: Partial<EventDoc>): Promise<void> {
    return updateDoc(eventDoc(owner), {
        ...data,
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

export function updateEventFloorData(owner: EventOwner, floor: Floor): Promise<void> {
    return updateDoc(eventFloorDoc(owner, floor.id), {
        json: floor.json,
    });
}

export function addGuestToGuestList(
    owner: EventOwner,
    payload: GuestData,
): Promise<DocumentReference> {
    return addDoc(guestListCollection(owner), payload);
}

export function deleteGuestFromGuestList(owner: EventOwner, guestID: string): Promise<void> {
    return deleteDoc(guestDoc(owner, guestID));
}

export function confirmGuestFromGuestList(
    owner: EventOwner,
    guestID: string,
    confirmed: boolean,
): Promise<void> {
    return updateDoc(guestDoc(owner, guestID), { confirmed });
}
