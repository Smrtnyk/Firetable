import type { EventOwner } from "../db.js";
import type { QueuedReservation, ReservationDoc } from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";
import { reservationDoc } from "../db.js";
import { initializeFirebase } from "../base.js";
import { httpsCallable } from "firebase/functions";
import { deleteDoc, updateDoc } from "firebase/firestore";

export function moveReservationToQueue(
    eventOwner: EventOwner,
    reservationId: string,
    preparedQueuedReservation: QueuedReservation,
): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    const moveReservationToQueueFn = httpsCallable(functions, "moveReservationToQueue");
    return moveReservationToQueueFn({ eventOwner, reservationId, preparedQueuedReservation });
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
