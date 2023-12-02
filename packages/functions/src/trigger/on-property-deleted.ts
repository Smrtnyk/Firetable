import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Cleans up associated user-property mappings when a property is deleted.
 * Removes the property's ID from relatedUsers fields of associated users.
 *
 * @param params - Context of the event that triggered the function.
 * @throws Throws error if there's an issue cleaning up the user-property mappings.
 */
export async function onPropertyDeletedFn(params: {
    propertyId: string;
    organisationId: string;
}): Promise<void> {
    const propertyId = params.propertyId;
    const organisationId = params.organisationId;

    try {
        // 1. Cleanup associated user-property mappings
        const usersSnapshot = await db
            .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`)
            .where("relatedProperties", "array-contains", propertyId)
            .get();

        const batch = db.batch();

        if (!usersSnapshot.empty) {
            usersSnapshot.docs.forEach((doc) => {
                const userRef = doc.ref;
                functions.logger.debug(
                    `Scheduling update to remove property ID from user document with id: ${doc.id}`,
                );
                batch.update(userRef, {
                    relatedProperties: FieldValue.arrayRemove(propertyId),
                });
            });
        }

        // 2. Delete associated floors
        const floorsSnapshot = await db
            .collection(Collection.FLOORS)
            .where("propertyId", "==", propertyId)
            .get();

        if (!floorsSnapshot.empty) {
            floorsSnapshot.docs.forEach((doc) => {
                functions.logger.debug(`Scheduling deletion of floor document with id: ${doc.id}`);
                batch.delete(doc.ref);
            });
        }

        // Commit batched operations
        await batch.commit();

        functions.logger.info(`Successfully handled deletion tasks for property ${propertyId}`);
    } catch (error) {
        functions.logger.error("Error handling property deletion tasks:", error);
        throw new Error(`Failed to handle deletion tasks for property ${propertyId}`);
    }
}
