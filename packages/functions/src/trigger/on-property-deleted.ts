import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import * as functions from "firebase-functions";

/**
 * Cleans up associated user-property mappings when a property is deleted.
 * Deletes related documents in the USER_PROPERTY_MAP collection.
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
        const snapshot = await db.collection(Collection.USER_PROPERTY_MAP)
            .where("propertyId", "==", propertyId)
            .get();

        if (snapshot.empty) {
            functions.logger.info(`No userPropertyMap entries found for property ${propertyId}. Exiting function.`);
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        functions.logger.error("Error deleting userPropertyMap entries:", error);
        throw new Error(`Failed to delete userPropertyMap entries for property ${propertyId}`);
    }
}
