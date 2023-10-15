import { ACTIVITY_STATUS, Collection, CreateUserPayload } from "../../../types/types.js";
import { auth, db } from "../../init.js";
import * as functions from "firebase-functions";

/**
 * Creates a new user in Firebase Authentication and stores associated user information in Firestore.
 *
 * This function performs the following steps:
 * 1. Checks if a user with the provided email already exists. If yes, throws an error.
 * 2. Creates a new user in Firebase Authentication with the provided email and password.
 * 3. Assigns a custom claim (role) to the created user in Firebase Authentication.
 * 4. Stores user metadata (name, email, role, status) in the Firestore USERS collection.
 * 5. Maps the user to one or more properties by storing entries in the USER_PROPERTY_MAP collection.
 *
 * If any of the steps fail after the user has been created in Firebase Authentication, the function performs a cleanup by deleting the created user.
 *
 * @param user - Payload containing user information and associated properties.
 * @param user.user - Object containing name, password, email, and role of the user.
 * @param user.user.name - Full name of the user.
 * @param user.user.password - Password for the user (to be stored in Firebase Authentication).
 * @param user.user.email - Email address of the user (also serves as the username).
 * @param user.user.role - Role of the user (e.g., ADMIN, PROPERTY_OWNER, etc.).
 * @param user.properties - An array of property IDs to which the user should be mapped.
 *
 * @returns - A Promise resolving to an object containing the UID of the created user and a success message.
 *
 * @throws - Throws an "already-exists" error if a user with the provided email already exists.
 * @throws - Throws a "unknown" error if there's an unknown issue while checking for user existence.
 * @throws - Throws appropriate errors for any other exceptions encountered during user creation or data storage.
 */
export async function createUser(user: CreateUserPayload): Promise<{ uid: string, message: string }> {
    const { name, password, email, role } = user.user;
    const { properties } = user;

    let createdUserUid: string | null = null;

    try {
        const existingUser = await auth.getUserByEmail(email);
        if (existingUser) {
            throw new functions.https.HttpsError("already-exists", "A user with this email already exists.");
        }
    } catch (error: any) {
        if (error.code !== "auth/user-not-found") {
            throw new functions.https.HttpsError("unknown", "An error occurred while checking for user existence.");
        }
    }

    try {
        const createdUser = await auth.createUser({ email, password });
        createdUserUid = createdUser.uid; // Storing the UID for potential cleanup
        await auth.setCustomUserClaims(createdUser.uid, { role });

        const userDoc = {
            name,
            email,
            role,
            status: ACTIVITY_STATUS.OFFLINE,
        };

        await db.runTransaction(async (transaction) => {
            const userRef = db.collection(Collection.USERS).doc(createdUser.uid);
            transaction.set(userRef, userDoc);

            properties.forEach(property => {
                const entryRef = db.collection(Collection.USER_PROPERTY_MAP).doc();
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
        const errorCode = e.code || "unknown";
        const errorMessage = e.message || "An unknown error occurred.";
        throw new functions.https.HttpsError(errorCode, errorMessage);
    }
}
