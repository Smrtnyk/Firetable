import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import { deleteDocument } from "../delete-document/index.js";
import { logger } from "firebase-functions/v2";

/**
 * Cleans up associated events and their subcollections when a property is deleted.
 * Removes all events where propertyId matches the ID of the deleted property.
 *
 * @param params - Context of the event that triggered the function.
 * @throws Throws error if there's an issue cleaning up the associated events and their subcollections.
 */
export async function onPropertyDeletedCleanEvents(params: { propertyId: string }): Promise<void> {
    const propertyId = params.propertyId;

    try {
        // Fetch events associated with the property
        const eventsSnapshot = await db
            .collection(Collection.EVENTS)
            .where("propertyId", "==", propertyId)
            .get();

        if (eventsSnapshot.empty) {
            logger.info(`No events associated with property ${propertyId}. Exiting function.`);
            return;
        }

        // Delete all events and their subcollections concurrently using the deleteDocument function.
        const deletePromises = eventsSnapshot.docs.map((eventDoc) =>
            deleteDocument({
                col: Collection.EVENTS,
                id: eventDoc.id,
            }).catch((error) => {
                // Individual error handling for each document delete operation
                logger.error(`Error deleting event with ID ${eventDoc.id}:`, error);
            }),
        );

        await Promise.all(deletePromises);
        logger.info(
            `Successfully deleted all events and their subcollections associated with property ${propertyId}.`,
        );
    } catch (error) {
        logger.error("Error deleting events associated with property:", error);
        throw new Error(
            `Failed to delete events and their subcollections associated with property ${propertyId}`,
        );
    }
}
