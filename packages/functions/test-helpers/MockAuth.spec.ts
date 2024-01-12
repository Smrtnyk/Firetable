import { MockAuth } from "./MockAuth.js";
import { describe, it, expect } from "vitest";

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
        it("should return null for a non-existent user", async () => {
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

            await mockAuth.setCustomUserClaims(user.uid, { role: "ADMIN", organisationId: "org1" });

            const updatedUser = await mockAuth.getUserByEmail("test@example.com");
            expect(updatedUser?.customClaims).toEqual({ role: "ADMIN", organisationId: "org1" });
        });

        it("should throw an error if user does not exist", async () => {
            await expect(mockAuth.setCustomUserClaims("nonexistent", {})).rejects.toThrow(
                "No user found for UID: nonexistent",
            );
        });
    });
});
