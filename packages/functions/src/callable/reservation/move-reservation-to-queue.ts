import type { CallableRequest } from "firebase-functions/https";
import { db } from "../../init.js";
import { getQueuedReservationsPath, getReservationsPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export interface MoveReservationToQueueReqPayload {
    eventOwner: {
        organisationId: string;
        propertyId: string;
        id: string;
    };
    reservationId: string;
    preparedQueuedReservation: Record<string, unknown>;
}

interface MoveReservationToQueueResponse {
    success: boolean;
    message: string;
    queuedReservationId?: string;
}

export async function moveReservationToQueueFn(
    req: CallableRequest<MoveReservationToQueueReqPayload>,
): Promise<MoveReservationToQueueResponse> {
    const { auth, data } = req;
    // 1. Authenticate the user
    if (!auth) {
        throw new HttpsError(
            "failed-precondition",
            "The function must be called while authenticated.",
        );
    }

    const { eventOwner, reservationId, preparedQueuedReservation } = data;

    // 2. Validate the payload
    if (
        !eventOwner?.organisationId ||
        !eventOwner.propertyId ||
        !eventOwner.id ||
        !reservationId ||
        !preparedQueuedReservation
    ) {
        throw new HttpsError("invalid-argument", "Missing required fields in the request payload.");
    }

    const { organisationId, propertyId, id: eventId } = eventOwner;

    // 3. Define Firestore references
    const reservationRef = db
        .collection(getReservationsPath(organisationId, propertyId, eventId))
        .doc(reservationId);

    const queuedReservationsRef = db
        .collection(getQueuedReservationsPath(organisationId, propertyId, eventId))
        .doc(reservationId);

    try {
        // 4. Run Firestore transaction
        const result = await db.runTransaction(async (transaction) => {
            const reservationDoc = await transaction.get(reservationRef);
            if (!reservationDoc.exists) {
                throw new HttpsError("not-found", "The reservation does not exist.");
            }

            // 5. Set the queued reservation
            transaction.set(queuedReservationsRef, preparedQueuedReservation);

            // 6. Delete the reservation from active reservations
            transaction.delete(reservationRef);

            return reservationId;
        });

        logger.info(`Reservation ${result} moved to queue successfully.`);

        return {
            success: true,
            message: "Reservation moved to queue successfully.",
            queuedReservationId: result,
        };
    } catch (error: any) {
        logger.error("Error moving reservation to queue:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError(
            "internal",
            "An unexpected error occurred while moving the reservation to the queue.",
        );
    }
}
