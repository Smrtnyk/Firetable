import { auth, db } from "../../init.js";
import * as functions from "firebase-functions";
import { Collection, User } from "../../../types/types.js";
import { logger } from "firebase-functions";

export async function deleteUser(user: User, context: functions.https.CallableContext): Promise<void> {
    logger.info(`Deleting user with id of ${user.id}`);
    // Ensure the function is called by an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called by an authenticated user.");
    }

    try {
        // Delete from Firebase Auth
        await auth.deleteUser(user.id);

        // If we've reached this point, it means the Auth deletion was successful, so we proceed to Firestore deletion
        const userDoc = db.collection(`${Collection.ORGANISATIONS}/${user.organisationId}/${Collection.USERS}`).doc(user.id);
        if (!(await userDoc.get()).exists) {
            console.warn(`User ${user.id} not found in Firestore.`);
            return;
        }
        await userDoc.delete();

    } catch (error) {
        console.error(`Failed to delete user ${user.id}`, error);
        throw new functions.https.HttpsError("internal", "Failed to delete user");
    }
}
