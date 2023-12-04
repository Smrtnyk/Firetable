import type { User } from "../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../init.js";
import { Role, Collection, ADMIN } from "../../types/types.js";
import { FieldPath } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

type RoleFilter = {
    [key in Role | typeof ADMIN | "default"]: (user: User) => boolean;
};

const MAX_USERS = 100;

// Function to split array into chunks
function chunkArray(arr: string[], size: number): string[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size),
    );
}

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
 * @param req - Callable request instance
 * @param req.data.userIdsToFetch - An array of user IDs to fetch. For Admin users, this can be ignored.
 * @param req.data.organisationId - Organisation id the users belong to
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
    req: CallableRequest<{ userIdsToFetch: string[]; organisationId: string }>,
): Promise<User[]> {
    // Ensure authentication
    if (!req.auth) {
        logger.warn("Unauthorized access attempt.");
        throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { userIdsToFetch, organisationId } = req.data;

    logger.log("fetchUsersByRoleFn called with userIds:", userIdsToFetch);

    const uid = req.auth.uid;
    const userRole = req.auth.token.role as Role | typeof ADMIN;

    if (!userRole) {
        logger.error(`Role not found in custom claims for UID: ${uid}`);
        throw new HttpsError("not-found", "User role not found in custom claims.");
    }

    logger.log(`User ${uid} has role: ${userRole}`);

    let users: User[] = [];

    const baseQuery = db.collection(
        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`,
    );
    if (userRole === ADMIN) {
        const usersSnapshot = await baseQuery.get();
        const orgUsers = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
        users = [...users, ...orgUsers];
    } else {
        if (userIdsToFetch.length > MAX_USERS) {
            logger.warn(`User ${uid} provided too many user IDs.`);
            throw new HttpsError("invalid-argument", "Too many user IDs provided.");
        }

        // Split userIdsToFetch into chunks of 30
        const userIdChunks = chunkArray(userIdsToFetch, 30);

        for (const chunk of userIdChunks) {
            const snapshot = await baseQuery
                .where(FieldPath.documentId(), "in", chunk)
                .limit(MAX_USERS)
                .get();

            const chunkUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
            users = [...users, ...chunkUsers];
        }

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

    logger.log(`Returning ${users.length} users for user ${uid}`);

    return users;
}
