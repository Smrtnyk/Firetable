import type { CallableRequest } from "firebase-functions/v2/https";
import type { PreparedGuestData } from "./set-guest-data.js";
import { db } from "../../init.js";
import { getGuestsPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export type DeleteGuestVisitData = {
    preparedGuestData: PreparedGuestData;
    propertyId: string;
    organisationId: string;
    eventId: string;
};

export async function deleteGuestVisitFn(
    req: CallableRequest<DeleteGuestVisitData>,
): Promise<void> {
    if (!req.data.preparedGuestData) {
        logger.info("Prepared guest data is not provided");
        return;
    }
    const { organisationId, propertyId, eventId, preparedGuestData } = req.data;
    const { contact } = preparedGuestData;

    if (!contact) {
        logger.info("Guest contact is not provided");
        throw new HttpsError("invalid-argument", "Guest contact is not provided.");
    }

    const guestsCollectionRef = db.collection(getGuestsPath(organisationId));

    try {
        const querySnapshot = await guestsCollectionRef.where("contact", "==", contact).get();

        if (querySnapshot.empty) {
            logger.info(`Guest document for contact ${contact} does not exist.`);
            return;
        }

        const guestDoc = querySnapshot.docs[0];
        if (!guestDoc) {
            logger.error(`Guest document is undefined even though querySnapshot is not empty.`);
            throw new HttpsError("internal", "Unexpected error occurred.");
        }
        const guestRef = guestDoc.ref;

        const updateData = {
            [`visitedProperties.${propertyId}.${eventId}`]: null,
        };

        await guestRef.update(updateData);
        logger.info(`Visit for eventId ${eventId} set to null for guest ${contact}.`);
    } catch (error) {
        logger.error(`Error processing the request: ${error}`);
        throw new HttpsError("internal", "Error processing the request.", error);
    }
}
