import type { CallableRequest } from "firebase-functions/https";

import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init.js";
import { getQueuedReservationsPath, getReservationsPath } from "../../paths.js";

export interface MoveReservationFromQueueReqPayload {
    eventOwner: {
        id: string;
        organisationId: string;
        propertyId: string;
    };
    preparedPlannedReservation: Record<string, unknown>;
    reservationId: string;
}

interface MoveReservationToQueueResponse {
    message: string;
    queuedReservationId?: string;
    success: boolean;
}

export async function moveReservationFromQueueFn(
    req: CallableRequest<MoveReservationFromQueueReqPayload>,
): Promise<MoveReservationToQueueResponse> {
    const { auth, data } = req;
    // 1. Authenticate the user
    if (!auth) {
        throw new HttpsError(
            "failed-precondition",
            "The function must be called while authenticated.",
        );
    }

    const { eventOwner, preparedPlannedReservation, reservationId } = data;

    // 2. Validate the payload
    if (
        !eventOwner?.organisationId ||
        !eventOwner.propertyId ||
        !eventOwner.id ||
        !reservationId ||
        !preparedPlannedReservation
    ) {
        throw new HttpsError("invalid-argument", "Missing required fields in the request payload.");
    }

    const { id: eventId, organisationId, propertyId } = eventOwner;

    // 3. Define Firestore references
    const queuedReservationsRef = db
        .collection(getQueuedReservationsPath(organisationId, propertyId, eventId))
        .doc(reservationId);

    const reservationRef = db
        .collection(getReservationsPath(organisationId, propertyId, eventId))
        .doc(reservationId);

    try {
        // 4. Run Firestore transaction
        const result = await db.runTransaction(async (transaction) => {
            const reservationDoc = await transaction.get(queuedReservationsRef);
            if (!reservationDoc.exists) {
                throw new HttpsError("not-found", "The queued reservation does not exist.");
            }

            // 5. Set the queued reservation
            transaction.set(reservationRef, preparedPlannedReservation);

            // 6. Delete the reservation from active reservations
            transaction.delete(queuedReservationsRef);

            return reservationId;
        });

        logger.info(`Queued reservation ${result} moved from the queue successfully.`);

        return {
            message: "Queued reservation moved from the queue successfully.",
            queuedReservationId: result,
            success: true,
        };
    } catch (error: any) {
        logger.error("Error moving reservation from queue:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            "internal",
            "An unexpected error occurred while moving the reservation from the queue.",
        );
    }
}
