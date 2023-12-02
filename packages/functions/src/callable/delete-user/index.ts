import { auth, db } from "../../init.js";
import { Collection, User } from "../../../types/types.js";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export async function deleteUser(req: CallableRequest<User>): Promise<void> {
    // Ensure the function is called by an authenticated user
    if (!req.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called by an authenticated user.",
        );
    }
    const user = req.data;

    logger.info(`Deleting user with id of ${user.id}`);

    try {
        // Delete from Firebase Auth
        await auth.deleteUser(user.id);

        // If we've reached this point, it means the Auth deletion was successful, so we proceed to Firestore deletion
        const userDoc = db
            .collection(`${Collection.ORGANISATIONS}/${user.organisationId}/${Collection.USERS}`)
            .doc(user.id);
        if (!(await userDoc.get()).exists) {
            console.warn(`User ${user.id} not found in Firestore.`);
            return;
        }
        await userDoc.delete();
    } catch (error) {
        console.error(`Failed to delete user ${user.id}`, error);
        throw new HttpsError("internal", "Failed to delete user");
    }
}
