import * as functions from "firebase-functions";
import { storage } from "../../init.js";
import { Collection } from "../../../types/types.js";

/**
 * Deletes an event image from storage when the corresponding event is deleted in Firestore.
 *
 * The function listens to the deletion of an event document in Firestore. When an event is deleted,
 * this function is triggered to ensure that the associated image in the storage is also removed,
 * ensuring data consistency and freeing up storage space.
 *
 * @param snapshot - The snapshot of the Firestore document that was deleted.
 * @param context - Provides metadata about the function's execution environment, including the event ID.
 *
 * @throws Throws an error if the deletion operation fails.
 *
 * @returns A promise indicating the completion of the deletion process.
 */
export async function deleteEventImage(snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext): Promise<void> {
    const eventID = context.params.eventId;
    const file = storage.file(`${Collection.EVENTS}/${eventID}.jpg`);

    try {
        await file.delete({ ignoreNotFound: true });
    } catch (error) {
        functions.logger.error(`Failed to delete image for event ${eventID}:`, error);
        throw new functions.https.HttpsError("internal", "Failed to delete event image.");
    }
}
