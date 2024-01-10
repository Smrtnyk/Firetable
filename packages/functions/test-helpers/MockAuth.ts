import { generateRandomId } from "./utils.js";

type MockUser = {
    uid: string;
    email: string;
    customClaims?: Record<string, any>;
    password?: string;
};

export class MockAuth {
    private readonly users: Record<string, MockUser> = {};

    async createUser(userDetails: { email: string; password: string }): Promise<MockUser> {
        const uid = generateRandomId();
        const newUser: MockUser = {
            uid,
            email: userDetails.email,
        };
        this.users[uid] = newUser;
        return newUser;
    }

    async updateUser(uid: string, updates: { password?: string }): Promise<void> {
        const user = this.users[uid];
        if (!user) {
            throw new Error(`User with UID ${uid} not found`);
        }

        Object.assign(user, updates);
    }

    getUserByEmail(email: string): MockUser | null {
        return Object.values(this.users).find((user) => user.email === email) ?? null;
    }

    async deleteUser(uid: string): Promise<void> {
        if (!this.users[uid]) {
            throw new Error("User not found"); // Or a more specific error as Firebase Auth would do
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- this is intentional
        delete this.users[uid];
    }

    async setCustomUserClaims(uid: string, customClaims: Record<string, any>): Promise<void> {
        const user = this.users[uid];
        if (!user) {
            throw new Error(`No user found for UID: ${uid}`);
        }
        user.customClaims = customClaims;
    }
}
