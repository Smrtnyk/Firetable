import type { EventOwner } from "../db.js";
import type { QueuedReservation, Reservation, ReservationDoc } from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";
import { queuedReservationsCollection, reservationsCollection, reservationDoc } from "../db.js";
import { initializeFirebase } from "../base.js";
import { httpsCallable } from "firebase/functions";
import { addDoc, deleteDoc, type DocumentReference, updateDoc } from "firebase/firestore";

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

export function moveReservationToQueue(
    eventOwner: EventOwner,
    reservationId: string,
    preparedQueuedReservation: QueuedReservation,
): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    const moveReservationToQueueFn = httpsCallable(functions, "moveReservationToQueue");
    return moveReservationToQueueFn({ eventOwner, reservationId, preparedQueuedReservation });
}

export function addReservation(
    owner: EventOwner,
    reservation: Reservation,
): Promise<DocumentReference> {
    return addDoc(reservationsCollection(owner), reservation);
}

export function updateReservationDoc(
    owner: EventOwner,
    newReservationData: Partial<ReservationDoc> & Pick<ReservationDoc, "id">,
): Promise<void> {
    return updateDoc(reservationDoc(owner, newReservationData.id), {
        ...newReservationData,
    });
}

export function deleteReservation(owner: EventOwner, reservation: ReservationDoc): Promise<void> {
    return deleteDoc(reservationDoc(owner, reservation.id));
}
