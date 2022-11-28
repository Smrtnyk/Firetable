import {
    eventsCollection,
    guestListCollection,
    deleteCollection,
    guestDoc,
    eventFloorDoc,
    eventDoc,
} from "./db";
import { initializeFirebase } from "./base";
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
} from "firebase/firestore";
import { CreateEventPayload, EventDoc, GuestData, Option } from "@firetable/types";
import { Floor } from "@firetable/floor-creator";

export async function getEvents(lastDocument: Option<DocumentData>): Promise<EventDoc[]> {
    const orderByDateQuery = orderBy("date");
    const limitQuery = limit(20);
    const startAfterQuery = startAfter(lastDocument);
    const eventsDocs = await getDocs(
        query(eventsCollection(), orderByDateQuery, limitQuery, startAfterQuery)
    );

    if (eventsDocs.empty) {
        return [];
    }

    return eventsDocs.docs.map((doc) => {
        return {
            ...doc.data(),
            id: doc.id,
            _doc: doc,
        };
    }) as unknown as EventDoc[];
}

export function deleteEvent(id: string) {
    return deleteCollection(id);
}

export function updateEventProperty<T extends keyof EventDoc>(
    eventId: string,
    key: T,
    value: EventDoc[T]
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
    return updateDoc(eventFloorDoc(eventId, floor.id), { json: floor.canvas.toJSON() });
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
