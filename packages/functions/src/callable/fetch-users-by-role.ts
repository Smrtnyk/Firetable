import * as functions from "firebase-functions";
import { db } from "../init.js";
import { ADMIN, Collection, Role, User } from "../../types/types.js";
import { FieldPath } from "firebase-admin/firestore";

const MAX_USERS = 100;

export async function fetchUsersByRoleFn(userIdsToFetch: string[], context: any): Promise<User[]> {
    functions.logger.log("fetchUsersByRoleFn called with userIds:", userIdsToFetch);

    // Ensure authentication
    if (!context.auth) {
        functions.logger.warn("Unauthorized access attempt.");
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const uid = context.auth.uid;
    // Ensure the provided list of userIdsToFetch is not too large
    if (userIdsToFetch.length > MAX_USERS) {
        functions.logger.warn(`User ${uid} provided too many user IDs.`);
        throw new functions.https.HttpsError("invalid-argument", "Too many user IDs provided.");
    }

    const userRole = context.auth.token.role;

    if (!userRole) {
        functions.logger.error(`Role not found in custom claims for UID: ${uid}`);
        throw new functions.https.HttpsError("not-found", "User role not found in custom claims.");
    }

    functions.logger.log(`User ${uid} has role: ${userRole}`);

    let baseQuery;

    if (userRole === ADMIN) {
        baseQuery = db.collection(Collection.USERS)
            .where(FieldPath.documentId(), "!=", uid);
    } else {
        baseQuery = db.collection(Collection.USERS)
            .where(FieldPath.documentId(), "in", userIdsToFetch)
            .where(FieldPath.documentId(), "!=", uid);
    }

    const snapshot = await baseQuery.get();
    let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    switch (userRole) {
        case ADMIN:
            break;
        case Role.PROPERTY_OWNER:
            users = users.filter(u => u.role !== ADMIN);
            break;
        case Role.MANAGER:
            users = users.filter(u => u.role !== ADMIN && u.role !== Role.PROPERTY_OWNER);
            break;
        default:
            users = users.filter(u => u.role === Role.STAFF);
            break;
    }

    if (users.length > MAX_USERS) {
        functions.logger.warn(`User ${uid} fetched too many users.`);
        throw new functions.https.HttpsError("resource-exhausted", "Too many users matched the criteria.");
    }

    functions.logger.log(`Returning ${users.length} users for user ${uid}`);

    return users;
}

