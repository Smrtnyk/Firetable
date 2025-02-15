import type { CreateEventPayload } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";

import { Collection } from "@shared-types";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init.js";
import { getEventsPath } from "../../paths.js";

/**
 * Creates a new event in the Firestore database, uploads associated event images, and associates the event with specific floor plans.
 *
 * @param req - The payload containing details for the event creation.
 * @param req.date - The date and time of the event in unix timestamp.
 * @param req.img - The optional img url.
 * @param req.floors - An array of floor objects associated with the event. Each floor object must have an ID.
 * @param req.entryPrice - The entry price for the event.
 * @param req.guestListLimit - The limit for the guest list for the event.
 * @param req.name - The name of the event.
 * @param req.propertyId - The ID of the property associated with the event.
 *
 * @throws - Throws an "invalid-argument" error if no floors are provided.
 * @throws - Throws a "failed-precondition" error if the user is not authenticated.
 * @throws - Throws an "invalid-argument" error if any floor does not have an ID.
 *
 * @returns A promise that resolves to the ID of the newly created event.
 *
 * @description
 * This function does the following:
 * 1. Validates the presence of floors and the authentication of the user.
 * 2. Generates a unique ID for the event.
 * 3. If an image is provided, uploads the image to Firebase Storage.
 * 4. In a transaction, creates a new event document with the provided data.
 * 5. Associates the event with the provided floors.
 */
export function createEvent(
    req: CallableRequest<CreateEventPayload>,
): Promise<{ id: string; organisationId: string; propertyId: string }> {
    // Authentication check.
    if (!req.auth) {
        throw new HttpsError(
            "failed-precondition",
            "The function must be called while authenticated.",
        );
    }

    const { date, entryPrice, floors, guestListLimit, img, name, organisationId, propertyId } =
        req.data;

    // Check for the presence of floors.
    if (!floors || floors.length === 0) {
        throw new HttpsError("invalid-argument", "Floors data is required.");
    }

    // Validate floor data
    for (const floor of floors) {
        if (!floor.json) {
            throw new HttpsError(
                "invalid-argument",
                "Invalid floor data provided - missing floor plan.",
            );
        }
    }

    const id = db.collection(Collection.EVENTS).doc().id;
    logger.info(`Creating event with ID: ${id}`);

    const creator = req.auth.token.email;

    // eslint-disable-next-line require-await -- Firestore transaction requires an async function
    return db.runTransaction(async function (transaction) {
        const eventRef = db.collection(getEventsPath(organisationId, propertyId)).doc(id);

        transaction.set(eventRef, {
            creator,
            date,
            entryPrice,
            guestListLimit,
            img,
            name,
            organisationId,
            propertyId,
        });

        for (const floor of floors) {
            const floorRef = eventRef.collection(Collection.FLOORS).doc();
            transaction.set(floorRef, floor);
        }

        return { id, organisationId, propertyId };
    });
}
