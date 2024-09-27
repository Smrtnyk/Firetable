import type { HttpsCallableResult } from "firebase/functions";
import type { DocumentData, DocumentReference } from "firebase/firestore";
import type { EventOwner } from "./db.js";
import type {
    CreateEventPayload,
    EventDoc,
    EventLog,
    FloorDoc,
    GuestInGuestListData,
    Reservation,
    ReservationDoc,
    User,
} from "@firetable/types";
import {
    guestListDoc,
    eventLogsDoc,
    eventsCollection,
    guestListCollection,
    eventFloorDoc,
    eventDoc,
    reservationsCollection,
    reservationDoc,
} from "./db.js";
import { initializeFirebase } from "./base.js";
import {
    getDocs,
    orderBy,
    limit,
    startAfter,
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    arrayUnion,
    setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

/**
 * It can throw so should be called inside a try-catch block
 * @param eventOwner The owner of the event
 * @param logMessage The message to be logged
 * @param user The user who created the log
 */
export async function addLogToEvent(
    eventOwner: EventOwner,
    logMessage: string,
    user: User,
): Promise<void> {
    const eventLogsRef = eventLogsDoc(eventOwner);

    const logEntry: EventLog = {
        message: logMessage,
        timestamp: Timestamp.now(),
        creator: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };

    await setDoc(
        eventLogsRef,
        {
            logs: arrayUnion(logEntry),
        },
        { merge: true },
    );
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

export function addReservation(
    owner: EventOwner,
    reservation: Reservation,
): Promise<DocumentReference> {
    return addDoc(reservationsCollection(owner), reservation);
}

export function deleteReservation(owner: EventOwner, reservation: ReservationDoc): Promise<void> {
    return deleteDoc(reservationDoc(owner, reservation.id));
}

export function updateReservationDoc(
    owner: EventOwner,
    newReservationData: Partial<ReservationDoc> & Pick<ReservationDoc, "id">,
): Promise<void> {
    return updateDoc(reservationDoc(owner, newReservationData.id), {
        ...newReservationData,
    });
}

export function updateEventFloorData(
    owner: EventOwner,
    floorData: Pick<FloorDoc, "id" | "json">,
): Promise<void> {
    return updateDoc(eventFloorDoc(owner, floorData.id), {
        json: floorData.json,
    });
}

export function addGuestToGuestList(
    owner: EventOwner,
    payload: GuestInGuestListData,
): Promise<DocumentReference> {
    return addDoc(guestListCollection(owner), payload);
}

export function deleteGuestFromGuestList(owner: EventOwner, guestID: string): Promise<void> {
    return deleteDoc(guestListDoc(owner, guestID));
}

export function confirmGuestFromGuestList(
    owner: EventOwner,
    guestID: string,
    confirmed: boolean,
): Promise<void> {
    return updateDoc(guestListDoc(owner, guestID), { confirmed });
}
