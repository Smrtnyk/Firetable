import * as functions from "firebase-functions";
import { db } from "../init.js";
import { Role, Collection, User, ADMIN } from "../../types/types.js";
import { FieldPath, Query } from "firebase-admin/firestore";

type RoleFilter = {
    [key in Role | typeof ADMIN | "default"]: (user: User) => boolean;
};

const MAX_USERS = 100;

/**
 * Fetches users from the Firestore database based on the role of the authenticated user.
 *
 * - Admin users can fetch details of all users except themselves.
 * - Property Owner users can fetch details of all users except Admins and themselves.
 * - Manager users can fetch details of Managers and Staff, but not Property Owners, Admins, or themselves.
 * - Staff users can only fetch details of other Staff users.
 *
 * This function also supports fetching a specific subset of users by passing their IDs, but Admins can ignore this and fetch all users.
 *
 * @param userIdsToFetch - An array of user IDs to fetch. For Admin users, this can be ignored.
 * @param organisationId - Organisation id the users belong to
 * @param context - The context of the callable function, provided by Firebase Functions.
 *                                                   This includes details about the authenticated user making the request.
 *
 * @throws - Throws an "unauthenticated" error if the user is not authenticated.
 * @throws - Throws an "invalid-argument" error if too many user IDs are provided.
 * @throws - Throws a "not-found" error if user role not found in custom claims.
 *
 * @returns - A promise that resolves to an array of User objects.
 *
 * @description
 * The function uses the role of the authenticated user to determine which users it can fetch.
 * It also applies a limit to the number of users that can be fetched to prevent overloading.
 */
export async function fetchUsersByRoleFn(
    { userIdsToFetch, organisationId }: { userIdsToFetch: string[]; organisationId: string },
    context: functions.https.CallableContext,
): Promise<User[]> {
    functions.logger.log("fetchUsersByRoleFn called with userIds:", userIdsToFetch);

    // Ensure authentication
    if (!context.auth) {
        functions.logger.warn("Unauthorized access attempt.");
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const uid = context.auth.uid;
    const userRole = context.auth.token.role as Role | typeof ADMIN;

    if (!userRole) {
        functions.logger.error(`Role not found in custom claims for UID: ${uid}`);
        throw new functions.https.HttpsError("not-found", "User role not found in custom claims.");
    }

    functions.logger.log(`User ${uid} has role: ${userRole}`);

    let users: User[] = [];

    if (userRole === ADMIN) {
        const organisationsSnapshot = await db.collection(Collection.ORGANISATIONS).get();

        for (const orgDoc of organisationsSnapshot.docs) {
            const usersSnapshot = await orgDoc.ref.collection(Collection.USERS).get();
            const orgUsers = usersSnapshot.docs.map(
                (doc) => ({ id: doc.id, ...doc.data() }) as User,
            );
            users = [...users, ...orgUsers];
        }
    } else {
        let baseQuery: Query = db.collection(
            `${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`,
        );

        if (userIdsToFetch.length > MAX_USERS) {
            functions.logger.warn(`User ${uid} provided too many user IDs.`);
            throw new functions.https.HttpsError("invalid-argument", "Too many user IDs provided.");
        }

        baseQuery = baseQuery.where(FieldPath.documentId(), "in", userIdsToFetch).limit(MAX_USERS);

        const snapshot = await baseQuery.get();
        users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);

        const roleFilters: RoleFilter = {
            [ADMIN]: () => true,
            [Role.PROPERTY_OWNER]: (user: User) => user.role !== ADMIN,
            [Role.MANAGER]: (user: User) =>
                user.role !== ADMIN && user.role !== Role.PROPERTY_OWNER,
            [Role.STAFF]: (user: User) => user.role === Role.STAFF,
            [Role.HOSTESS]: (user: User) =>
                [Role.HOSTESS, Role.STAFF, Role.MANAGER].includes(user.role as Role),
            default: (user: User) => user.role === Role.STAFF,
        };

        users = users.filter(roleFilters[userRole] || roleFilters.default);
    }

    functions.logger.log(`Returning ${users.length} users for user ${uid}`);

    return users;
}
