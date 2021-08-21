import {
    eventsCollection,
    guestListCollection,
    deleteCollection,
    guestDoc,
    eventFloorDoc,
} from "./db";
import { CreateEventPayload, EventDoc, GuestData } from "src/types";
import { functions } from "src/services/firebase/base";
import { DocumentData } from "src/types/firebase";
import { httpsCallable } from "@firebase/functions";
import type { Floor } from "src/floor-manager/Floor";
import {
    getDocs,
    orderBy,
    limit,
    startAfter,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
} from "@firebase/firestore";

export async function getEvents(
    lastDocument: DocumentData | null
): Promise<EventDoc[]> {
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

export function createNewEvent(eventPayload: CreateEventPayload) {
    return httpsCallable(functions(), "createEvent")(eventPayload);
}

export function updateEventFloorData(floor: Floor, eventId: string) {
    const { data, id } = floor;
    return updateDoc(eventFloorDoc(eventId, id), { data });
}

export function addGuestToGuestList(eventID: string, payload: GuestData) {
    return addDoc(guestListCollection(eventID), payload);
}

export function deleteGuestFromGuestList(eventID: string, guestID: string) {
    return deleteDoc(guestDoc(eventID, guestID));
}

export function confirmGuestFromGuestList(
    eventID: string,
    guestID: string,
    confirmed: boolean
) {
    return updateDoc(guestDoc(eventID, guestID), { confirmed });
}
