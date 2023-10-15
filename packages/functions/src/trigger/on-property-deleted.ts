import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Cleans up associated user-property mappings when a property is deleted.
 * Removes the property's ID from relatedUsers fields of associated users.
 *
 * @param snap - The snapshot of the deleted property data.
 * @param context - Context of the event that triggered the function.
 * @throws Throws error if there's an issue cleaning up the user-property mappings.
 */
export async function onPropertyDeletedFn(
    snap: functions.firestore.QueryDocumentSnapshot,
    context: functions.EventContext
): Promise<void> {
    const propertyId = context.params.propertyId;

    try {
        // Fetch users associated with the property
        const usersSnapshot = await db.collection(Collection.USERS)
            .where("relatedProperties", "array-contains", propertyId)
            .get();

        if (usersSnapshot.empty) {
            functions.logger.info(`No users associated with property ${propertyId}. Exiting function.`);
            return;
        }

        const batch = db.batch();
        usersSnapshot.docs.forEach(doc => {
            const userRef = doc.ref;
            functions.logger.debug(`Scheduling update to remove property ID from user document with id: ${doc.id}`);
            batch.update(userRef, {
                relatedProperties: FieldValue.arrayRemove(propertyId) // Use admin.firestore.FieldValue
            });
        });

        await batch.commit();
        functions.logger.info(`Successfully removed property ${propertyId} from associated users' relatedProperties field.`);

    } catch (error) {
        functions.logger.error("Error updating relatedProperties field for users:", error);
        throw new Error(`Failed to update relatedProperties field for users associated with property ${propertyId}`);
    }
}
