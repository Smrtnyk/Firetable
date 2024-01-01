import type { SimpleReservation } from "../../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../init.js";
import { Collection } from "../../../types/types.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

type Data = {
    reservation: SimpleReservation;
    propertyId: string;
    organisationId: string;
    eventId: string;
};

export async function deleteGuestVisitFn(req: CallableRequest<Data>): Promise<void> {
    if (!req.data.reservation) {
        logger.info("Reservation is not provided");
        return;
    }
    const { organisationId, propertyId, eventId, reservation } = req.data;
    const { guestContact } = reservation;

    const guestRef = db.doc(
        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.GUESTS}/${guestContact}`,
    );

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
