import { auth, db } from "../init.js";
import * as functions from "firebase-functions";
import { ACTIVITY_STATUS, Collection, CreateUserPayload } from "@firetable/types";

export async function createUser(user: CreateUserPayload): Promise<{uid: string, message: string}> {
    const { name, password, email, role, clubs } = user;

    let createdUserUid: string | null = null;

    // Check if user already exists
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
        const createdUser = await auth.createUser({
            email,
            password,
        });
        createdUserUid = createdUser.uid; // Storing the UID

        await auth.setCustomUserClaims(createdUser.uid, { role });

        await db.collection(Collection.USERS).doc(createdUser.uid).set({
            name,
            email,
            role,
            clubs,
            status: ACTIVITY_STATUS.OFFLINE,
        });

        return {
            uid: createdUser.uid,
            message: "User created successfully!"
        };

    } catch (e: any) {
        // If we've created a user but failed at a later step, cleanup by deleting the created user
        if (createdUserUid) {
            await auth.deleteUser(createdUserUid);
        }

        const errorCode = e && e.code ? e.code : "unknown";
        const errorMessage = e && e.message ? e.message : "An unknown error occurred.";

        throw new functions.https.HttpsError(errorCode, errorMessage);
    }
}
