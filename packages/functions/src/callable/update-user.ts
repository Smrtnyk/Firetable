import type { EditUserPayload } from "../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { Collection } from "../../types/types.js";
import { auth, db } from "../init.js";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

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
 * @param req - Contains the user data to be updated and the properties to be associated or disassociated.
 *
 * @throws Throws an error with code "invalid-argument" if the user ID is not provided or if no data is provided for the update.
 * @throws Throws an error with code "internal" if any part of the update process fails.
 *
 * @returns Returns a promise that resolves once the user and their associated properties have been successfully updated in Firestore.
 */
export async function updateUserFn(
    req: CallableRequest<EditUserPayload>,
): Promise<{ success: boolean; message: string }> {
    const { updatedUser, userId, organisationId } = req.data;

    if (!userId) {
        throw new HttpsError("invalid-argument", "User ID must be provided.");
    }

    if (!userId || !updatedUser) {
        throw new HttpsError("invalid-argument", "User data to update must be provided.");
    }

    const { relatedProperties } = updatedUser;

    if (!relatedProperties) {
        throw new HttpsError("invalid-argument", "Related properties field is not set.");
    }

    // Check and update password
    if (updatedUser.password) {
        try {
            await auth.updateUser(userId, {
                password: updatedUser.password,
            });
        } catch (error: any) {
            logger.error(`Failed to update password for user ${userId}`, error);
            throw new HttpsError(
                "internal",
                `Failed to update password. Details: ${error.message}`,
            );
        }
    }

    try {
        // Fetch the properties associated with this user by checking relatedUsers field
        const existingPropertiesSnapshot = await db
            .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`)
            .where("relatedUsers", "array-contains", userId)
            .get();

        const existingProperties = existingPropertiesSnapshot.docs.map((doc) => doc.id);

        const propertiesToAdd = relatedProperties.filter((id) => !existingProperties.includes(id));
        const propertiesToRemove = existingProperties.filter(
            (id) => !relatedProperties.includes(id),
        );

        await db.runTransaction(async (transaction) => {
            const userRef = db
                .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`)
                .doc(userId);

            transaction.update(userRef, {
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                relatedProperties: updatedUser.relatedProperties,
                capabilities: updatedUser.capabilities,
            });

            // Add the user to relatedUsers field of the property document for new associations
            for (const propertyId of propertiesToAdd) {
                const propertyRef = db
                    .collection(
                        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`,
                    )
                    .doc(propertyId);
                transaction.update(propertyRef, {
                    relatedUsers: FieldValue.arrayUnion(userId),
                });
            }

            // Remove the user from relatedUsers field of the property document for removed associations
            for (const propertyId of propertiesToRemove) {
                const propertyRef = db
                    .collection(
                        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`,
                    )
                    .doc(propertyId);
                transaction.update(propertyRef, {
                    relatedUsers: FieldValue.arrayRemove(userId),
                });
            }
        });

        return { success: true, message: "User updated successfully." };
    } catch (error: any) {
        logger.error(`Failed to update user ${userId}`, error);
        throw new HttpsError("internal", `Failed to update user. Details: ${error.message}`);
    }
}
