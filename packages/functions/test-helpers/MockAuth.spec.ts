import { beforeEach, describe, expect, it } from "vitest";

import { MockAuth } from "./MockAuth.js";

describe("MockAuth", () => {
    let mockAuth: MockAuth;

    beforeEach(() => {
        mockAuth = new MockAuth();
    });

    describe("createUser method", () => {
        it("should allow creating a user and retrieving by email", async () => {
            const testUser = { email: "test@example.com", password: "123" };
            const createdUser = await mockAuth.createUser(testUser);

            expect(createdUser).toBeDefined();
            expect(createdUser.email).toBe(testUser.email);

            const retrievedUser = await mockAuth.getUserByEmail(testUser.email);
            expect(retrievedUser).toEqual(createdUser);
        });

        it("should assign a unique UID to each user", async () => {
            const user1 = await mockAuth.createUser({
                email: "user1@example.com",
                password: "123",
            });
            const user2 = await mockAuth.createUser({
                email: "user2@example.com",
                password: "123",
            });

            expect(user1.uid).not.toBe(user2.uid);
        });
    });

    describe("updateUser", () => {
        it("should update a user's details", async () => {
            // Create a test user
            const testUser = { email: "user@example.com", password: "dsad" };
            const { uid } = await mockAuth.createUser(testUser);

            // Update user details
            const newPassword = "newPassword";
            await mockAuth.updateUser(uid, { password: newPassword });

            // Retrieve the updated user
            const updatedUser = await mockAuth.getUserByEmail("user@example.com");

            // Check if the user details have been updated
            expect(updatedUser).toBeDefined();
            // @ts-expect-error -- password is not a property of UserRecord but we store it in mock class
            expect(updatedUser?.password).toBe(newPassword);
        });

        it("should throw an error if the user does not exist", async () => {
            const nonExistentUid = "nonExistentUser";

            // Attempt to update a non-existent user
            await expect(
                mockAuth.updateUser(nonExistentUid, { password: "newPassword" }),
            ).rejects.toThrow(`User with UID ${nonExistentUid} not found`);
        });
    });

    describe("getUserByEmail method", () => {
        it("should return null for a non-existent user", () => {
            expect(() => mockAuth.getUserByEmail("nonexistent@example.com")).toThrow(
                "User with email nonexistent@example.com not found",
            );
        });
    });

    describe("deleteUser method", () => {
        it("should delete a user by UID", async () => {
            const user = await mockAuth.createUser({ email: "test@example.com", password: "123" });
            await mockAuth.deleteUser(user.uid);

            expect(() => mockAuth.getUserByEmail("test@example.com")).toThrow();
        });

        it("should throw an error if trying to delete a non-existent user", async () => {
            await expect(mockAuth.deleteUser("nonexistent")).rejects.toThrow("User not found");
        });
    });

    describe("setCustomUserClaims method", () => {
        it("should set custom user claims", async () => {
            const user = await mockAuth.createUser({ email: "test@example.com", password: "123" });

            await mockAuth.setCustomUserClaims(user.uid, { organisationId: "org1", role: "ADMIN" });

            const updatedUser = await mockAuth.getUserByEmail("test@example.com");
            expect(updatedUser?.customClaims).toEqual({ organisationId: "org1", role: "ADMIN" });
        });

        it("should throw an error if user does not exist", async () => {
            await expect(mockAuth.setCustomUserClaims("nonexistent", {})).rejects.toThrow(
                "No user found for UID: nonexistent",
            );
        });
    });

    describe("getUsers method", () => {
        it("should return exactly matching notFound entries for non-existent users", async () => {
            const user = await mockAuth.createUser({
                email: "exists@example.com",
                password: "password123",
            });

            // Using same non-existent identifiers multiple times
            const result = await mockAuth.getUsers([
                { uid: user.uid },
                { uid: "nonexistent-uid" },
                // Duplicate request
                { uid: "nonexistent-uid" },
                { email: "nonexistent@example.com" },
                { phoneNumber: "+1234567890" },
            ]);

            expect(result.users).toHaveLength(1);
            expect(result.users[0].uid).toBe(user.uid);
            // Should have 4 entries in notFound, including the duplicate
            expect(result.notFound).toHaveLength(4);
            expect(result.notFound).toEqual(
                expect.arrayContaining([
                    { uid: "nonexistent-uid" },
                    // Duplicate preserved
                    { uid: "nonexistent-uid" },
                    { email: "nonexistent@example.com" },
                    { phoneNumber: "+1234567890" },
                ]),
            );
        });

        it("should deduplicate found users but preserve input order in notFound", async () => {
            const user = await mockAuth.createUser({
                email: "test@example.com",
                password: "password123",
                phoneNumber: "+1234567890",
            });

            const result = await mockAuth.getUsers([
                { email: "nonexistent1@example.com" },
                { uid: user.uid },
                // Same user as uid
                { email: "test@example.com" },
                // Same user again
                { phoneNumber: "+1234567890" },
                { email: "nonexistent2@example.com" },
            ]);

            // Should only return one user instance
            expect(result.users).toHaveLength(1);
            expect(result.users[0].uid).toBe(user.uid);

            // notFound should preserve original order of non-existent requests
            expect(result.notFound).toEqual([
                { email: "nonexistent1@example.com" },
                { email: "nonexistent2@example.com" },
            ]);
        });

        it("should handle empty identifiers list", async () => {
            const result = await mockAuth.getUsers([]);

            expect(result.users).toHaveLength(0);
            expect(result.notFound).toHaveLength(0);
        });

        it("should handle invalid identifier objects", async () => {
            const result = await mockAuth.getUsers([{} as any, { invalidField: "test" } as any]);

            expect(result.users).toHaveLength(0);
            expect(result.notFound).toHaveLength(2);
            expect(result.notFound).toEqual([{}, { invalidField: "test" }]);
        });
    });
});
