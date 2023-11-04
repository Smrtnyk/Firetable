import * as functions from "firebase-functions";
import { db } from "../../init.js";
import { Collection, CreateEventPayload } from "../../../types/types.js";

const { logger } = functions;

/**
 * Creates a new event in the Firestore database, uploads associated event images, and associates the event with specific floor plans.
 *
 * @param eventPayload - The payload containing details for the event creation.
 * @param eventPayload.date - The date and time of the event in the format "DD-MM-YYYY HH:mm".
 * @param eventPayload.img - The base64 encoded image string for the event.
 * @param eventPayload.floors - An array of floor objects associated with the event. Each floor object must have an ID.
 * @param eventPayload.entryPrice - The entry price for the event.
 * @param eventPayload.guestListLimit - The limit for the guest list for the event.
 * @param eventPayload.name - The name of the event.
 * @param eventPayload.propertyId - The ID of the property associated with the event.
 * @param context - The context of the callable function, provided by Firebase Functions.
 *                                                   This includes details about the authenticated user making the request.
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
export async function createEvent(
    eventPayload: CreateEventPayload,
    context: functions.https.CallableContext,
): Promise<{ id: string; propertyId: string; organisationId: string }> {
    // Check for the presence of floors.
    if (!eventPayload.floors || eventPayload.floors.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Floors data is required.");
    }

    // Authentication check.
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "The function must be called while authenticated.",
        );
    }

    const { date, floors, entryPrice, guestListLimit, name, propertyId, organisationId } =
        eventPayload;
    const id = db.collection(Collection.EVENTS).doc().id;
    logger.info(`Creating event with ID: ${id}`);

    const creator = context.auth.token.email;

    return db.runTransaction(async (transaction) => {
        const eventRef = db
            .collection(
                [
                    Collection.ORGANISATIONS,
                    organisationId,
                    Collection.PROPERTIES,
                    propertyId,
                    Collection.EVENTS,
                ].join("/"),
            )
            .doc(id);

        transaction.set(eventRef, {
            name,
            entryPrice,
            date,
            creator,
            reservedPercentage: 0,
            guestListLimit,
            propertyId,
            organisationId,
        });

        floors.forEach((floor) => {
            if (floor.id) {
                const floorRef = eventRef.collection(Collection.FLOORS).doc(floor.id);
                transaction.set(floorRef, floor);
            } else {
                throw new functions.https.HttpsError(
                    "invalid-argument",
                    "Invalid floor data provided.",
                );
            }
        });

        return { id, propertyId, organisationId };
    });
}
