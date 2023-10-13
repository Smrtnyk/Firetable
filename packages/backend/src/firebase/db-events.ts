import {
    eventsCollection,
    guestListCollection,
    deleteCollection,
    guestDoc,
    eventFloorDoc,
    eventDoc,
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
    propertyId: string,
): Promise<EventDoc[]> {
    const orderByDateQuery = orderBy("date");
    const limitQuery = limit(countPerPage);
    const startAfterQuery = startAfter(lastDocument);
    const propertyIdQuery = where("propertyId", "==", propertyId);
    const eventsDocs = await getDocs(
        query(eventsCollection(), propertyIdQuery, orderByDateQuery, limitQuery, startAfterQuery),
    );

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
    eventId: string,
    key: T,
    value: EventDoc[T],
) {
    return updateDoc(eventDoc(eventId), {
        [key]: value,
    });
}

export function createNewEvent(eventPayload: CreateEventPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable<CreateEventPayload, string>(functions, "createEvent")(eventPayload);
}

export function updateEventFloorData(floor: Floor, eventId: string) {
    return updateDoc(eventFloorDoc(eventId, floor.id), {
        json: floor.canvas.toJSON(["label", "reservation", "name", "type"]),
    });
}

export function addGuestToGuestList(eventID: string, payload: GuestData) {
    return addDoc(guestListCollection(eventID), payload);
}

export function deleteGuestFromGuestList(eventID: string, guestID: string) {
    return deleteDoc(guestDoc(eventID, guestID));
}

export function confirmGuestFromGuestList(eventID: string, guestID: string, confirmed: boolean) {
    return updateDoc(guestDoc(eventID, guestID), { confirmed });
}
