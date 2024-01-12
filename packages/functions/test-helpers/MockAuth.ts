import type { Auth, UserRecord } from "firebase-admin/auth";
import { generateRandomId } from "./utils.js";

export class MockAuth implements Partial<Auth> {
    private readonly users: Record<string, UserRecord> = {};

    async createUser(userDetails: { email: string; password: string }): Promise<UserRecord> {
        const uid = generateRandomId();
        const newUser: UserRecord = {
            disabled: false,
            emailVerified: false,
            metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
                toJSON() {
                    return this;
                },
            },
            providerData: [],
            toJSON() {
                return this;
            },
            uid,
            email: userDetails.email,
            // @ts-expect-error -- this is intentional
            password: userDetails.password,
        };
        this.users[uid] = newUser;

        return newUser;
    }

    async updateUser(uid: string, updates: { password?: string }): Promise<UserRecord> {
        const user = this.users[uid];
        if (!user) {
            throw new UserNotFoundError(`User with UID ${uid} not found`);
        }

        Object.assign(user, updates);

        return user;
    }

    getUserByEmail(email: string): Promise<UserRecord> {
        const userRecord = Object.values(this.users).find((user) => user.email === email);
        if (!userRecord) {
            throw new UserNotFoundError(`User with email ${email} not found`);
        }
        return Promise.resolve(userRecord);
    }

    async deleteUser(uid: string): Promise<void> {
        if (!this.users[uid]) {
            throw new UserNotFoundError("User not found");
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- this is intentional
        delete this.users[uid];
    }

    async setCustomUserClaims(uid: string, customClaims: Record<string, any>): Promise<void> {
        const user = this.users[uid];
        if (!user) {
            throw new UserNotFoundError(`No user found for UID: ${uid}`);
        }

        Object.assign(user, {
            customClaims: {
                ...user.customClaims,
                ...customClaims,
            },
        });
    }
}

class UserNotFoundError extends Error {
    code = "auth/user-not-found";

    constructor(message: string) {
        super(message);
        this.name = "UserNotFoundError";
    }
}
