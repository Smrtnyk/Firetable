import type { CreateUserPayload } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";

import { HttpsError } from "firebase-functions/v2/https";

import { auth, db } from "../../init.js";
import { getUsersPath } from "../../paths.js";

/**
 * Creates a new user in Firebase Authentication and stores associated user information in Firestore.
 *
 * This function performs the following steps:
 * 1. Checks if a user with the provided email already exists. If yes, throws an error.
 * 2. Creates a new user in Firebase Authentication with the provided email and password.
 * 3. Assigns a custom claim (role) to the created user in Firebase Authentication.
 * 4. Stores user metadata (name, email, role, status) in the Firestore USERS collection.
 *
 * If any of the steps fail after the user has been created in Firebase Authentication, the function performs a cleanup by deleting the created user.
 *
 * @param req.data - Payload containing user information and associated properties.
 * @param req.data.user - Object containing name, password, email, and role of the user.
 * @param req.data.user.name - Full name of the user.
 * @param req.data.user.password - Password for the user (to be stored in Firebase Authentication).
 * @param req.data.user.email - Email address of the user (also serves as the username).
 * @param req.data.user.role - Role of the user (e.g., ADMIN, PROPERTY_OWNER, etc.).
 * @param req.data.properties - An array of property IDs to which the user should be mapped.
 *
 * @returns - A Promise resolving to an object containing the UID of the created user and a success message.
 *
 * @throws - Throws an "already-exists" error if a user with the provided email already exists.
 * @throws - Throws a "unknown" error if there's an unknown issue while checking for user existence.
 * @throws - Throws appropriate errors for any other exceptions encountered during user creation or data storage.
 */
export async function createUser(
    req: CallableRequest<CreateUserPayload>,
): Promise<{ message: string; uid: string }> {
    const { email, name, organisationId, password, relatedProperties, role, username } = req.data;

    let createdUserUid: string | undefined;

    try {
        const existingUser = await auth.getUserByEmail(email);
        if (existingUser) {
            throw new HttpsError("already-exists", "A user with this email already exists.");
        }
    } catch (error: any) {
        if (error.code === "already-exists") {
            throw error;
        }
        if (error.code !== "auth/user-not-found") {
            throw new HttpsError("unknown", "An error occurred while checking for user existence.");
        }
    }

    try {
        const createdUser = await auth.createUser({ email, password });
        createdUserUid = createdUser.uid;
        await auth.setCustomUserClaims(createdUser.uid, { organisationId, role });

        const userDoc = {
            email,
            name,
            organisationId,
            relatedProperties,
            role,
            username,
        };

        await db.collection(getUsersPath(organisationId)).doc(createdUser.uid).set(userDoc);

        return { message: "User created successfully!", uid: createdUser.uid };
    } catch (e: any) {
        if (createdUserUid) {
            await auth.deleteUser(createdUserUid);
        }

        // Map Firebase Auth error codes to HttpsError codes
        let errorCode: HttpsError["code"];
        let errorMessage: string;

        switch (e.code) {
            case "auth/email-already-exists":
                errorCode = "already-exists";
                errorMessage = "A user with this email already exists.";
                break;
            case "auth/invalid-email":
                errorCode = "invalid-argument";
                errorMessage = "The provided email is invalid.";
                break;
            case "auth/invalid-password":
                errorCode = "invalid-argument";
                errorMessage =
                    "The provided password is invalid. It must be at least 6 characters long and contain a mix of characters.";
                break;
            default:
                errorCode = "internal";
                errorMessage = e.message ?? "An internal error occurred.";
        }

        throw new HttpsError(errorCode, errorMessage);
    }
}
