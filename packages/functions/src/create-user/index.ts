import { ACTIVITY_STATUS, Collection, CreateUserPayload } from "../../types/types.js";
import { auth, db } from "../init.js";
import * as functions from "firebase-functions";

export async function createUser(user: CreateUserPayload): Promise<{uid: string, message: string}> {
    const { name, password, email, role } = user.user;
    const { properties } = user;

    let createdUserUid: string | null = null;

    try {
        // Check if user already exists
        try {
            await auth.getUserByEmail(email);
            throw new functions.https.HttpsError("already-exists", "A user with this email already exists.");
        } catch (error: any) {
            if (error.code !== "auth/user-not-found") {
                throw new functions.https.HttpsError("unknown", "An error occurred while checking for user existence.");
            }
        }

        // Create new user
        const createdUser = await auth.createUser({ email, password });
        createdUserUid = createdUser.uid; // Storing the UID for potential cleanup
        await auth.setCustomUserClaims(createdUser.uid, { role });

        const userDoc = {
            name,
            email,
            role,
            status: ACTIVITY_STATUS.OFFLINE,
        };

        // Use transaction for atomic write operations to Firestore
        await db.runTransaction(async (transaction) => {
            const userRef = db.collection(Collection.USERS).doc(createdUser.uid);
            transaction.set(userRef, userDoc);

            properties.forEach(property => {
                const entryRef = db.collection(Collection.USER_PROPERTY_MAP).doc(); // Create a new doc with a random ID
                transaction.set(entryRef, {
                    userId: createdUser.uid,
                    propertyId: property
                });
            });
        });

        return { uid: createdUser.uid, message: "User created successfully!" };

    } catch (e: any) {
        // If we've created a user but failed at a later step, cleanup by deleting the created user
        if (createdUserUid) {
            await auth.deleteUser(createdUserUid);
        }

        const errorCode = e.code ? e.code : "unknown";
        const errorMessage = e.message ? e.message : "An unknown error occurred.";
        throw new functions.https.HttpsError(errorCode, errorMessage);
    }
}
