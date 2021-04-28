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
import type { Floor } from "src/floor-manager/Floor";

export async function getEvents(
    lastDocument: DocumentData | null
): Promise<EventDoc[]> {
    const eventsDocs = await eventsCollection()
        .orderBy("date")
        .limit(20)
        .startAfter(lastDocument)
        .get();

    if (eventsDocs.empty) {
        return [];
    }

    return eventsDocs.docs.map(
        (doc) =>
            ({
                ...doc.data(),
                id: doc.id,
                _doc: doc,
            } as EventDoc)
    );
}

export function deleteEvent(id: string) {
    return deleteCollection(id);
}

export function createNewEvent(eventPayload: CreateEventPayload) {
    return functions().httpsCallable("createEvent")(eventPayload);
}

export function updateEventFloorData(floor: Floor, eventId: string) {
    const { data, id } = floor;
    return eventFloorDoc(eventId, id).update({ data });
}

export function addGuestToGuestList(eventID: string, payload: GuestData) {
    return guestListCollection(eventID).add(payload);
}

export function deleteGuestFromGuestList(eventID: string, guestID: string) {
    return guestDoc(eventID, guestID).delete();
}

export function confirmGuestFromGuestList(
    eventID: string,
    guestID: string,
    confirmed: boolean
) {
    return guestDoc(eventID, guestID).update({ confirmed });
}
