import { logger } from "firebase-functions";
import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import * as functions from "firebase-functions";

/**
 * Cleans up associated data for a user when they are deleted.
 * Specifically, deletes related documents in the userPropertyMap collection.
 *
 * @param snap - The snapshot of the deleted user data.
 * @param context - Context of the event that triggered the function.
 * @throws Throws error if there's an issue cleaning up the data.
 */
export async function onUserDeletedFn(snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext<{ userId: string }>): Promise<void> {
    const userId = context.params.userId;
    logger.info(`Cleaning up data for deleted user with id: ${userId}`);

    try {
        // Get all userPropertyMap documents associated with the user
        const userPropertyMapsSnapshot = await db.collection(`${Collection.USER_PROPERTY_MAP}`)
            .where("userId", "==", userId)
            .get();

        // Check if there are any documents to delete
        if (userPropertyMapsSnapshot.empty) {
            logger.info(`No userPropertyMap documents found for user ${userId}. Exiting function.`);
            return;
        }

        const batch = db.batch();
        userPropertyMapsSnapshot.docs.forEach(doc => {
            logger.debug(`Scheduling delete for userPropertyMap document with id: ${doc.id}`);
            batch.delete(doc.ref);
        });

        await batch.commit();
        logger.info(`Successfully deleted userPropertyMap documents for user ${userId}`);

    } catch (error) {
        logger.error(`Error cleaning up data for user ${userId}:`, error);
        throw new functions.https.HttpsError("internal", `Error cleaning up data for user ${userId}`);
    }
}
