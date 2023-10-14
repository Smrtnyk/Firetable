import { auth, db } from "../../init.js";
import * as functions from "firebase-functions";
import { Collection } from "../../../types/types.js";
import { logger } from "firebase-functions";

export async function deleteUser(userId: string, context: functions.https.CallableContext): Promise<void> {
    logger.info(`Deleting user with id of ${userId}`);
    // Ensure the function is called by an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called by an authenticated user.");
    }

    // Optionally, check if the user has the right permissions
    // if (!context.auth.token.admin) {
    //     throw new functions.https.HttpsError('permission-denied', 'The user does not have the required permissions.');
    // }

    try {
        // Delete from Firebase Auth
        await auth.deleteUser(userId);

        // If we've reached this point, it means the Auth deletion was successful, so we proceed to Firestore deletion
        const userDoc = db.collection(`${Collection.USERS}`).doc(userId);
        if (!(await userDoc.get()).exists) {
            console.warn(`User ${userId} not found in Firestore.`);
            return;
        }
        await userDoc.delete();

    } catch (error) {
        console.error(`Failed to delete user ${userId}`, error);
        throw new functions.https.HttpsError("internal", "Failed to delete user");
    }

    // Optionally, clean up other associated data...
}
