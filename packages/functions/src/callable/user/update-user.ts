import type { EditUserPayload } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";
import { auth, db } from "../../init.js";
import { getUserPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

/**
 * Updates user details in Firestore and in firebase auth.
 *
 * It will perform the following operations atomically:
 *
 * 1. Update the user's basic information, if provided.
 * 2. Add new associations between the user and properties.
 * 3. Remove any associations that are no longer needed.
 *
 * Note: Before updating, the function checks if the user exists and if valid data has been provided.
 * If any of these conditions are not met, the function will throw a specific error.
 *
 * @param req - Contains the user data to be updated and the properties to be as
 *
 * @returns Returns a promise that resolves once the user has been successfully updated in Firestore.
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

    if (!updatedUser.relatedProperties) {
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

    const currentUser = await auth.getUser(userId);
    const currentCustomClaims = currentUser.customClaims ?? {};
    if (updatedUser.role && currentCustomClaims.role !== updatedUser.role) {
        try {
            const updatedCustomClaims = { ...currentCustomClaims, role: updatedUser.role };
            await auth.setCustomUserClaims(userId, updatedCustomClaims);
        } catch (error: any) {
            logger.error(`Failed to update custom claims for user ${userId}`, error);
            throw new HttpsError(
                "internal",
                `Failed to update custom claims. Details: ${error.message}`,
            );
        }
    }

    // Prepare the data to update
    const updateData: Record<string, any> = {
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        relatedProperties: updatedUser.relatedProperties,
    };

    // Conditionally include 'capabilities' if it's provided and not undefined
    if (updatedUser.capabilities !== undefined) {
        updateData.capabilities = updatedUser.capabilities;
    }

    try {
        await db.doc(getUserPath(organisationId, userId)).update(updateData);

        return { success: true, message: "User updated successfully." };
    } catch (error: any) {
        logger.error(`Failed to update user ${userId}`, error);
        throw new HttpsError("internal", `Failed to update user. Details: ${error.message}`);
    }
}
