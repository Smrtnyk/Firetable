import { auth, db } from "../init.js";
import * as functions from "firebase-functions";
import { ACTIVITY_STATUS, Collection, CreateUserPayload } from "@firetable/types";

export async function createUser(user: CreateUserPayload): Promise<void> {
    const { name, password, email, role, floors } = user;
    try {
        const createdUser = await auth.createUser({
            email,
            password,
        });
        await auth.setCustomUserClaims(createdUser.uid, { role });
        await db.collection(Collection.USERS).doc(createdUser.uid).set({
            name,
            email,
            role,
            floors,
            status: ACTIVITY_STATUS.OFFLINE,
        });
    } catch (e: any) {
        throw new functions.https.HttpsError(e.code, e.message);
    }
}
