import type { GuestDoc, SimpleReservation, Visit } from "../../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../init.js";
import { getGuestPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export type GuestData = {
    reservation: SimpleReservation;
    propertyId: string;
    organisationId: string;
    eventId: string;
    eventName: string;
    eventDate: number;
};

/**
 * Handles the creation of a reservation and updates a guest's visit history in Firestore.
 *
 * This function is triggered when a new reservation is created. It performs the following actions:
 * - Retrieves reservation details from Firestore based on the provided reservation ID.
 * - Checks if the reservation's guestContact is numeric. If it is not numeric or does not exist, the function exits.
 * - Fetches event details associated with the reservation.
 * - Determines whether a guest document exists for the given guestContact.
 * - If the guest document exists, updates the document with the new visit information.
 * - If the guest document does not exist, creates a new guest document with guestContact as the document ID and the visit information.
 *
 * @param {req} req - The parameters for the function.
 * @param {string} req.data.reservation - The reservation data.
 * @param {string} req.data.propertyId - The ID of the property where the reservation is made.
 * @param {string} req.data.organisationId - The ID of the organisation under which the property and reservation fall.
 * @param {string} req.data.eventId - The ID of the event associated with the reservation.
 *
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function setGuestDataFn(req: CallableRequest<GuestData>): Promise<void> {
    const { reservation, propertyId, organisationId, eventId, eventDate, eventName } = req.data;

    if (!reservation) {
        logger.info("Reservation is not provided");
        throw new HttpsError("invalid-argument", "Reservation is not provided");
    }

    const { guestContact, guestName, arrived, cancelled } = reservation;

    if (!guestContact) {
        logger.info("Guest contact is not provided");
        throw new HttpsError("invalid-argument", "Guest contact is not provided");
    }

    logger.info("Guest contact is eligible for processing ", guestContact);

    const guestRef = db.doc(getGuestPath(organisationId, guestContact));

    const visit: Visit = {
        eventName,
        date: eventDate,
        arrived,
        cancelled: !!cancelled,
    };

    try {
        const guestDoc = await guestRef.get();

        if (!guestDoc.exists) {
            logger.info("Creating new guest document with name: ", guestName);
            const guestData: GuestDoc = {
                contact: guestContact,
                name: guestName,
                visitedProperties: {
                    [propertyId]: {
                        [eventId]: visit,
                    },
                },
            };
            await guestRef.set(guestData);
            return;
        }

        const guestData = guestDoc.data() as GuestDoc;
        const propertyVisits = guestData.visitedProperties?.[propertyId] ?? {};

        if (propertyVisits[eventId]) {
            logger.info(
                "Visit with this eventId already exists for this propertyId, will update existing visit",
            );
        }

        logger.info("Updating existing guest document with name:", guestName);
        await guestRef.update({
            [`visitedProperties.${propertyId}.${eventId}`]: visit,
        });
    } catch (error) {
        logger.error("Error processing reservation: ", error);
    }
}
