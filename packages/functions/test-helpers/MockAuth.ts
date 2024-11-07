// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- this is intentional
// @ts-nocheck
import type { Auth, UserRecord } from "firebase-admin/auth";
import { generateRandomId } from "./utils.js";

export class MockAuth implements Partial<Auth> {
    private readonly users: Record<string, UserRecord> = {};

    getUser(uid: string): Promise<UserRecord> {
        const user = this.users[uid];
        if (!user) {
            return Promise.reject(new UserNotFoundError(`User with UID ${uid} not found`));
        }
        return Promise.resolve(user);
    }

    getUsers(identifiers: { uid?: string; email?: string; phoneNumber?: string }[]): Promise<{
        users: UserRecord[];
        notFound: { uid?: string; email?: string; phoneNumber?: string }[];
    }> {
        // Process each identifier independently
        const foundUsers = new Set<UserRecord>();
        const notFound: Array<{ uid?: string; email?: string; phoneNumber?: string }> = [];

        // Process each identifier, including duplicates
        for (const identifier of identifiers) {
            let isFound = false;

            // Check if user exists
            if (identifier.uid) {
                const user = this.users[identifier.uid];
                if (user) {
                    foundUsers.add(user);
                    isFound = true;
                }
            } else if (identifier.email) {
                const user = Object.values(this.users).find(
                    ({ email }) => email === identifier.email,
                );
                if (user) {
                    foundUsers.add(user);
                    isFound = true;
                }
            } else if (identifier.phoneNumber) {
                const user = Object.values(this.users).find(
                    ({ phoneNumber }) => phoneNumber === identifier.phoneNumber,
                );
                if (user) {
                    foundUsers.add(user);
                    isFound = true;
                }
            }

            // If not found, add to notFound array (including duplicates)
            if (!isFound) {
                notFound.push({ ...identifier });
            }
        }

        return Promise.resolve({
            users: Array.from(foundUsers),
            notFound,
        });
    }

    createUser(userDetails: {
        email?: string;
        password?: string;
        displayName?: string;
        photoURL?: string;
        phoneNumber?: string;
        emailVerified?: boolean;
        disabled?: boolean;
    }): Promise<UserRecord> {
        const uid = generateRandomId();
        const newUser: UserRecord = {
            uid,
            email: userDetails.email,
            displayName: userDetails.displayName,
            photoURL: userDetails.photoURL,
            phoneNumber: userDetails.phoneNumber,
            emailVerified: userDetails.emailVerified ?? false,
            disabled: userDetails.disabled ?? false,
            metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: "",
                toJSON() {
                    return this;
                },
            },
            providerData: [],
            toJSON() {
                return this;
            },
        };
        if (userDetails.password) {
            // Simulate password hashing
            (newUser as any).passwordHash = Buffer.from(userDetails.password).toString("base64");
        }
        this.users[uid] = newUser;
        return Promise.resolve(newUser);
    }

    updateUser(uid: string, updates: { password?: string }): Promise<UserRecord> {
        const user = this.users[uid];
        if (!user) {
            return Promise.reject(new UserNotFoundError(`User with UID ${uid} not found`));
        }

        Object.assign(user, updates);

        return Promise.resolve(user);
    }

    getUserByEmail(email: string): Promise<UserRecord> {
        const userRecord = Object.values(this.users).find((user) => user.email === email);
        if (!userRecord) {
            throw new UserNotFoundError(`User with email ${email} not found`);
        }
        return Promise.resolve(userRecord);
    }

    deleteUser(uid: string): Promise<void> {
        if (!this.users[uid]) {
            return Promise.reject(new UserNotFoundError("User not found"));
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- this is intentional
        delete this.users[uid];
        return Promise.resolve();
    }

    setCustomUserClaims(uid: string, customClaims: Record<string, any>): Promise<void> {
        const user = this.users[uid];
        if (!user) {
            return Promise.reject(new UserNotFoundError(`No user found for UID: ${uid}`));
        }

        if (!user.customClaims) {
            Object.assign(user, { customClaims: {} });
        }
        Object.assign(user.customClaims, { ...user.customClaims, ...customClaims });

        return Promise.resolve();
    }

    listUsers(
        maxResults = 1000,
        pageToken?: string,
    ): Promise<{ users: UserRecord[]; pageToken?: string }> {
        const allUsers = Object.values(this.users);
        let startIndex = 0;
        if (pageToken) {
            startIndex = Number.parseInt(pageToken);
            if (Number.isNaN(startIndex)) startIndex = 0;
        }
        const users = allUsers.slice(startIndex, startIndex + maxResults);
        const newPageToken =
            startIndex + maxResults < allUsers.length ? String(startIndex + maxResults) : undefined;
        return Promise.resolve({ users, pageToken: newPageToken });
    }

    createCustomToken(uid: string, developerClaims?: object): Promise<string> {
        const user = this.users[uid];
        if (!user) {
            return Promise.reject(new UserNotFoundError(`User with UID ${uid} not found`));
        }
        const tokenPayload = {
            uid,
            claims: developerClaims ?? {},
        };
        const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
        return Promise.resolve(token);
    }

    revokeRefreshTokens(uid: string): Promise<void> {
        const user = this.users[uid];
        if (!user) {
            return Promise.reject(new UserNotFoundError(`User with UID ${uid} not found`));
        }
        (user as any).tokensValidAfterTime = new Date().toISOString();
        return Promise.resolve();
    }
}

class AuthError extends Error {
    constructor(
        public code: string,
        message: string,
    ) {
        super(message);
        this.name = "FirebaseAuthError";
    }
}

class UserNotFoundError extends AuthError {
    constructor(message: string) {
        super("auth/user-not-found", message);
    }
}
