import { db } from "../init.js";
import { Collection } from "../../types/types.js";
import { deleteDocument } from "../delete-document/index.js";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Cleans up associated user-property mappings when a property is deleted.
 * Removes all subcollections of the property.
 *
 * @param params - Context of the event that triggered the function.
 * @throws Throws error if there's an issue cleaning up the user-property mappings.
 */
export async function onPropertyDeletedFn(params: {
    propertyId: string;
    organisationId: string;
}): Promise<void> {
    const { organisationId, propertyId } = params;

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
                logger.info(
                    `Scheduling update to remove property ID from user document with id: ${doc.id}`,
                );
                batch.update(userRef, {
                    relatedProperties: FieldValue.arrayRemove(propertyId),
                });
            });
        }

        // Commit batched operations
        await batch.commit();

        // 2. Delete all the subcollections of the property
        await deleteDocument({
            col: `${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`,
            id: propertyId,
        });

        logger.info(`Successfully handled deletion tasks for property ${propertyId}`);
    } catch (error) {
        logger.error("Error handling property deletion tasks:", error);
        throw new HttpsError(
            "internal",
            `Failed to handle deletion tasks for property ${propertyId}`,
        );
    }
}
