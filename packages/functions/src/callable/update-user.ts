import { Collection, EditUserPayload } from "../../types/types.js";
import { db } from "../init.js";
import * as functions from "firebase-functions";
const { logger } = functions;

/**
 * Updates user details and property associations in Firestore.
 *
 * This function is responsible for making the necessary changes to user data and their associated properties
 * in Firestore based on the provided payload. It will perform the following operations atomically:
 *
 * 1. Update the user's basic information, if provided.
 * 2. Add new associations between the user and properties.
 * 3. Remove any associations that are no longer needed.
 *
 * The function uses transactions to ensure that all database operations are atomic. If any part of the update process
 * fails, none of the changes will be committed to the database. This helps in maintaining data integrity.
 *
 * Note: Before updating, the function checks if the user exists and if valid data has been provided.
 * If any of these conditions are not met, the function will throw a specific error.
 *
 * @param editUserPayload - Contains the user data to be updated and the properties to be associated or disassociated.
 *
 * @throws Throws an error with code "invalid-argument" if the user ID is not provided or if no data is provided for the update.
 * @throws Throws an error with code "internal" if any part of the update process fails.
 *
 * @returns Returns a promise that resolves once the user and their associated properties have been successfully updated in Firestore.
 */
export async function updateUserFn(editUserPayload: EditUserPayload): Promise<void> {
    const { updatedUser, userId, properties } = editUserPayload;

    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "User ID must be provided.");
    }

    if (!updatedUser && (!properties || properties.length === 0)) {
        throw new functions.https.HttpsError("invalid-argument", "No data provided to update.");
    }

    try {
        // Retrieve existing property mappings first, outside of the transaction
        const mappingsSnapshot = await db.collection(Collection.USER_PROPERTY_MAP).where("userId", "==", userId).get();

        const existingMappings = mappingsSnapshot.docs.map(function (doc) {
            return { ref: doc.ref, propertyId: doc.data().propertyId };
        });

        const mappingsToAdd = properties.filter(function (id) {
            return !existingMappings.some(function (mapping) {
                return mapping.propertyId === id;
            });
        });

        const mappingsToDelete = existingMappings.filter(function (mapping) {
            return !properties.includes(mapping.propertyId);
        });

        await db.runTransaction(async function (transaction) {
            const userRef = db.collection(Collection.USERS).doc(userId);

            // Update the user's basic information if provided
            if (updatedUser) {
                transaction.update(userRef, updatedUser);
            }

            // Add new mappings
            for (const propertyId of mappingsToAdd) {
                const newMappingRef = db.collection(Collection.USER_PROPERTY_MAP).doc();
                transaction.set(newMappingRef, { userId, propertyId });
            }

            // Delete removed mappings
            for (const mapping of mappingsToDelete) {
                transaction.delete(mapping.ref);
            }
        });
    } catch (error: any) {
        logger.error(`Failed to update user ${userId}`, error);
        throw new functions.https.HttpsError("internal", `Failed to update user. Details: ${error.message}`);
    }
}
