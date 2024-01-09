type MockUser = {
    uid: string;
    email: string;
};

export class MockAuth {
    private readonly users: Record<string, MockUser> = {};

    createUser(user: MockUser): void {
        this.users[user.uid] = user;
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
}
