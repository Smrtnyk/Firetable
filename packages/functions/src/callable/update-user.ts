import { Collection, EditUserPayload } from "../../types/types.js";
import { db } from "../init.js";
import * as functions from "firebase-functions";
import { logger } from "firebase-functions";

export async function updateUserFn({ updatedUser, userId, properties }: EditUserPayload): Promise<void> {
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "User ID must be provided.");
    }

    if (!updatedUser && (!properties || properties.length === 0)) {
        throw new functions.https.HttpsError("invalid-argument", "No data provided to update.");
    }

    try {
        // Retrieve existing property mappings first, outside of the transaction
        const mappingsSnapshot = await db.collection(Collection.USER_PROPERTY_MAP).where("userId", "==", userId).get();

        const existingPropertyIds = mappingsSnapshot.docs.map(doc => doc.data().propertyId);

        const mappingsToAdd = properties.filter(id => !existingPropertyIds.includes(id));
        const mappingsToDelete = existingPropertyIds.filter(id => !properties.includes(id));

        await db.runTransaction(async (transaction) => {
            const userRef = db.collection(Collection.USERS).doc(userId);

            // Update the user's basic information if provided
            if (updatedUser) {
                transaction.update(userRef, updatedUser);
            }

            // Add new mappings
            for (const propertyId of mappingsToAdd) {
                const newMappingRef = db.collection(Collection.USER_PROPERTY_MAP).doc(); // or some id generation logic
                transaction.set(newMappingRef, { userId, propertyId });
            }

            // Delete removed mappings
            for (const propertyId of mappingsToDelete) {
                const mappingDoc = mappingsSnapshot.docs.find(doc => doc.data().propertyId === propertyId);
                if (mappingDoc) {
                    transaction.delete(mappingDoc.ref);
                }
            }
        });
    } catch (error) {
        logger.error(`Failed to update user ${userId}`, error);
        throw new functions.https.HttpsError("internal", "Failed to update user.");
    }
}
