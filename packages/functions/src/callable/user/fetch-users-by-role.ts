import type { AppUser, User } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../init.js";
import { getUsersPath } from "../../paths.js";
import { Role, AdminRole } from "@shared-types";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

type RoleFilter = {
    [key in AdminRole.ADMIN | Role | "default"]: (user: User) => boolean;
};

export type FetchUsersByRoleRequestData = {
    organisationId: string;
};

// Function to split array into chunks
function chunkArray(arr: string[], size: number): string[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
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
 * @param req - Callable request instance
 * @param req.data.organisationId - Organisation id the users belong to
 *
 * @returns - A promise that resolves to an array of User objects.
 */
export async function fetchUsersByRoleFn(
    req: CallableRequest<FetchUsersByRoleRequestData>,
): Promise<User[]> {
    // Ensure authentication
    if (!req.auth) {
        logger.warn("Unauthorized access attempt.");
        throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { organisationId } = req.data;
    const uid = req.auth.uid;
    const userRole = req.auth.token.role as AdminRole.ADMIN | Role;

    if (!userRole) {
        logger.error(`Role not found in custom claims for UID: ${uid}`);
        throw new HttpsError("not-found", "User role not found in custom claims.");
    }

    let users: User[] = [];
    const baseQuery = db.collection(getUsersPath(organisationId));

    if (userRole === AdminRole.ADMIN || userRole === Role.PROPERTY_OWNER) {
        // Admins and Property Owners can fetch all users
        const usersSnapshot = await baseQuery.get();
        users = usersSnapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() } as User;
        });
    } else {
        // For other roles, fetch users based on relatedProperties
        // Get the user's document
        const userDocRef = baseQuery.doc(uid);
        const userSnapshot = await userDocRef.get();

        if (!userSnapshot.exists) {
            throw new HttpsError("not-found", `User document for UID ${uid} not found.`);
        }

        const userData = userSnapshot.data() as User;
        const userRelatedProperties = userData.relatedProperties as string[] | undefined;

        // Return empty array if no related properties
        if (!userRelatedProperties || userRelatedProperties.length === 0) {
            logger.log(`User ${uid} has no related properties.`);
            return [];
        }

        // Firestore limitations: 'array-contains-any' supports up to 10 elements
        const MAX_ARRAY_CONTAINS_ANY = 10;
        const propertyChunks = chunkArray(userRelatedProperties, MAX_ARRAY_CONTAINS_ANY);

        // Use a Map to avoid duplicate users
        const usersMap = new Map<string, User>();

        for (const propertyChunk of propertyChunks) {
            const querySnapshot = await baseQuery
                .where("relatedProperties", "array-contains-any", propertyChunk)
                .get();

            querySnapshot.docs.forEach((doc) => {
                const user = { id: doc.id, ...doc.data() } as User;
                usersMap.set(user.id, user);
            });
        }

        users = Array.from(usersMap.values());
    }

    const roleFilters: RoleFilter = {
        [AdminRole.ADMIN]: () => true,
        [Role.PROPERTY_OWNER]: (user: AppUser) => user.role !== AdminRole.ADMIN,
        [Role.MANAGER]: (user: AppUser) =>
            user.role !== AdminRole.ADMIN && user.role !== Role.PROPERTY_OWNER,
        [Role.STAFF]: (user: AppUser) => user.role === Role.STAFF || user.role === Role.HOSTESS,
        [Role.HOSTESS]: (user: AppUser) =>
            [Role.HOSTESS, Role.STAFF, Role.MANAGER].includes(user.role as Role),
        default: (user: AppUser) => user.role === Role.STAFF,
    };

    const filterFunction = roleFilters[userRole] ?? roleFilters.default;
    users = users.filter(filterFunction);

    logger.log(`Returning ${users.length} users for user ${uid}`);

    return users;
}
