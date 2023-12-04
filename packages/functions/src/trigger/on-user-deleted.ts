import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Cleans up associated data for a user when they are deleted.
 * Specifically, removes the user's ID from the relatedUsers field of properties they were associated with.
 *
 * @param context - Context of the event that triggered the function.
 * @throws Throws error if there's an issue cleaning up the data.
 */
export async function onUserDeletedFn(context: {
    userId: string;
    organisationId: string;
}): Promise<void> {
    const userId = context.userId;
    const organisationId = context.organisationId;
    logger.info(`Cleaning up data for deleted user with id: ${userId}`);

    try {
        // Fetch properties associated with the user
        const propertiesSnapshot = await db
            .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`)
            .where("relatedUsers", "array-contains", userId)
            .get();

        if (propertiesSnapshot.empty) {
            logger.info(`No properties associated with user ${userId}. Exiting function.`);
            return;
        }

        const batch = db.batch();
        propertiesSnapshot.docs.forEach((doc) => {
            const propertyRef = doc.ref;
            logger.debug(
                `Scheduling update to remove user ID from property document with id: ${doc.id}`,
            );
            batch.update(propertyRef, {
                relatedUsers: FieldValue.arrayRemove(userId),
            });
        });

        await batch.commit();
        logger.info(
            `Successfully removed user ${userId} from associated properties' relatedUsers field.`,
        );
    } catch (error) {
        logger.error(`Error cleaning up data for user ${userId}:`, error);
        throw new HttpsError("internal", `Error cleaning up data for user ${userId}`);
    }
}
