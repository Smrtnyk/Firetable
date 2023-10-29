import {
    eventsCollection,
    guestListCollection,
    deleteCollection,
    guestDoc,
    eventFloorDoc,
    eventDoc,
    EventOwner,
} from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";
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

export const deleteEvent = deleteCollection;

export function updateEventProperty<T extends keyof EventDoc>(
    owner: EventOwner,
    key: T,
    value: EventDoc[T],
) {
    return updateDoc(eventDoc(owner), {
        [key]: value,
    });
}

export function createNewEvent(eventPayload: CreateEventPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable<
        CreateEventPayload,
        {
            id: string;
            organisationId: string;
            propertyId: string;
        }
    >(
        functions,
        "createEvent",
    )(eventPayload);
}

export function updateEventFloorData(owner: EventOwner, floor: Floor) {
    return updateDoc(eventFloorDoc(owner, floor.id), {
        json: floor.json,
    });
}

export function addGuestToGuestList(owner: EventOwner, payload: GuestData) {
    return addDoc(guestListCollection(owner), payload);
}

export function deleteGuestFromGuestList(owner: EventOwner, guestID: string) {
    return deleteDoc(guestDoc(owner, guestID));
}

export function confirmGuestFromGuestList(owner: EventOwner, guestID: string, confirmed: boolean) {
    return updateDoc(guestDoc(owner, guestID), { confirmed });
}
