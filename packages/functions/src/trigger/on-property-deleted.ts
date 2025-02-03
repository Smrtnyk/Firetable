import type { FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/firestore";

import { Collection } from "@shared-types";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";

import { deleteDocument } from "../delete-document/index.js";
import { db } from "../init.js";
import { deletePropertyImage } from "../utils/property/delete-property-image.js";

/**
 * Cleans up associated user-property mappings when a property is deleted.
 * Removes all subcollections of the property.
 *
 * @param event - Firestore event object, containing the organisation ID and property ID in the params
 * @throws Throws error if there's an issue cleaning up the user-property mappings.
 */
export async function onPropertyDeletedFn(
    event: FirestoreEvent<
        QueryDocumentSnapshot | undefined,
        { organisationId: string; propertyId: string }
    >,
): Promise<void> {
    const { organisationId, propertyId } = event.params;

    try {
        const propertyData = event.data?.data();
        // 1. Delete property image if exists
        if (propertyData?.img) {
            await deletePropertyImage(organisationId, propertyId, propertyData.img);
        }

        // 2. Cleanup associated user-property mappings
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
        await batch.commit();

        // 3. Delete all the subcollections of the property
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
