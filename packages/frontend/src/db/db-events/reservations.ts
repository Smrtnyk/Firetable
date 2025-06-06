import type {
    PlannedReservation,
    QueuedReservation,
    Reservation,
    ReservationDoc,
} from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";

import { addDoc, deleteDoc, type DocumentReference, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import type { EventOwner } from "../db.js";

import { initializeFirebase } from "../base.js";
import {
    queuedReservationDoc,
    queuedReservationsCollection,
    reservationDoc,
    reservationsCollection,
} from "../db.js";

export function addReservation(
    owner: EventOwner,
    reservation: Reservation,
): Promise<DocumentReference> {
    return addDoc(reservationsCollection(owner), reservation);
}

export function deleteQueuedReservation(
    eventOwner: EventOwner,
    queuedReservationId: string,
): Promise<void> {
    return deleteDoc(queuedReservationDoc(eventOwner, queuedReservationId));
}

export function deleteReservation(owner: EventOwner, reservation: ReservationDoc): Promise<void> {
    return deleteDoc(reservationDoc(owner, reservation.id));
}

export function moveReservationFromQueue(
    eventOwner: EventOwner,
    reservationId: string,
    preparedPlannedReservation: PlannedReservation,
): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    const moveReservationFromQueueFn = httpsCallable(functions, "moveReservationFromQueue");
    return moveReservationFromQueueFn({ eventOwner, preparedPlannedReservation, reservationId });
}

export function moveReservationToQueue(
    eventOwner: EventOwner,
    reservationId: string,
    preparedQueuedReservation: QueuedReservation,
): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    const moveReservationToQueueFn = httpsCallable(functions, "moveReservationToQueue");
    return moveReservationToQueueFn({ eventOwner, preparedQueuedReservation, reservationId });
}

/**
 * Saves a queued reservation to Firestore.
 *
 * @param eventOwner - An object containing organisationId, propertyId, and eventId.
 * @param queuedReservation - The queued reservation object to be saved.
 * @returns A promise that resolves when the reservation is successfully saved.
 */
export function saveQueuedReservation(
    eventOwner: EventOwner,
    queuedReservation: QueuedReservation,
): Promise<DocumentReference> {
    return addDoc(queuedReservationsCollection(eventOwner), queuedReservation);
}

export function updateReservationDoc(
    owner: EventOwner,
    newReservationData: Partial<ReservationDoc> & Pick<ReservationDoc, "id">,
): Promise<void> {
    return updateDoc(reservationDoc(owner, newReservationData.id), {
        ...newReservationData,
    });
}
