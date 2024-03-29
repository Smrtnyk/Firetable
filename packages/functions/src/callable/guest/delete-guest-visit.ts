import type { SimpleReservation } from "../../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../init.js";
import { getGuestPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export type DeleteGuestVisitData = {
    reservation: SimpleReservation;
    propertyId: string;
    organisationId: string;
    eventId: string;
};

export async function deleteGuestVisitFn(
    req: CallableRequest<DeleteGuestVisitData>,
): Promise<void> {
    if (!req.data.reservation) {
        logger.info("Reservation is not provided");
        return;
    }
    const { organisationId, propertyId, eventId, reservation } = req.data;
    const { guestContact } = reservation;

    if (!guestContact) {
        logger.info("Guest contact is not provided");
        throw new HttpsError("invalid-argument", "Guest contact is not provided.");
    }

    const guestRef = db.doc(getGuestPath(organisationId, guestContact));

    try {
        const guestDoc = await guestRef.get();

        if (!guestDoc.exists) {
            logger.info(`Guest document for contact ${guestContact} does not exist.`);
            return;
        }

        const updateData = {
            [`visitedProperties.${propertyId}.${eventId}`]: null,
        };

        await guestRef.update(updateData);
        logger.info(`Visit for eventId ${eventId} set to null for guest ${guestContact}.`);
    } catch (error) {
        logger.error(`Error processing the request: ${error}`);
        throw new HttpsError("internal", "Error processing the request.", error);
    }
}
