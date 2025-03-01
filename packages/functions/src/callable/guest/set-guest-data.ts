import type { GuestDoc, Visit } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";

import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init.js";
import { getGuestsPath } from "../../paths.js";

export type GuestData = {
    eventDate: number;
    eventId: string;
    eventName: string;
    organisationId: string;
    preparedGuestData: PreparedGuestData;
    propertyId: string;
};

export interface PreparedGuestData {
    arrived: boolean;
    cancelled: boolean | undefined;
    contact: string;
    guestName: string;
    hashedContact: string;
    isVIP: boolean;
    maskedContact: string;
}

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
    const { eventDate, eventId, eventName, organisationId, preparedGuestData, propertyId } =
        req.data;

    if (!preparedGuestData) {
        logger.info("Reservation is not provided");
        throw new HttpsError("invalid-argument", "Guest data is not provided");
    }

    const { arrived, cancelled, contact, guestName, hashedContact, isVIP, maskedContact } =
        preparedGuestData;

    if (!contact) {
        logger.info("Guest contact is not provided");
        throw new HttpsError("invalid-argument", "Guest contact is not provided");
    }

    logger.info("Guest contact is eligible for processing ", contact);

    const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
    const visit: Visit = {
        arrived,
        cancelled: Boolean(cancelled),
        date: eventDate,
        eventName,
        isVIPVisit: isVIP,
    };

    try {
        const querySnapshot = await guestsCollectionRef.where("contact", "==", contact).get();

        if (querySnapshot.empty) {
            logger.info("Creating new guest document with name:", guestName);
            const guestData: Omit<GuestDoc, "id"> = {
                contact,
                hashedContact,
                lastModified: Date.now(),
                maskedContact,
                name: guestName,
                visitedProperties: {
                    [propertyId]: {
                        [eventId]: visit,
                    },
                },
            };
            await guestsCollectionRef.add(guestData);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guest exists, update the document, snapshot not empty
            const guestDoc = querySnapshot.docs[0]!;
            const guestRef = guestDoc.ref;
            const guestData = guestDoc.data() as GuestDoc;

            const propertyVisits = guestData.visitedProperties?.[propertyId] ?? {};

            if (propertyVisits[eventId]) {
                logger.info(
                    "Visit with this eventId already exists for this propertyId, updating existing visit",
                );
            }

            logger.info("Updating existing guest document with name:", guestName);
            await guestRef.update({
                [`visitedProperties.${propertyId}.${eventId}`]: visit,
                lastModified: Date.now(),
            });
        }
    } catch (error) {
        logger.error("Error processing reservation: ", error);
    }
}
