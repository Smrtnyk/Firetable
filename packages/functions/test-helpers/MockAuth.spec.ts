import { MockAuth } from "./MockAuth.js";
import { describe, it, expect } from "vitest";

describe("MockAuth", () => {
    it("should allow creating and retrieving a user by email", async () => {
        const mockAuth = new MockAuth();
        const testUser = { email: "test@example.com", password: "123" };

        await mockAuth.createUser(testUser);

        const retrievedUser = mockAuth.getUserByEmail("test@example.com");

        expect(retrievedUser).toBeDefined();
        expect(retrievedUser).toEqual({
            uid: retrievedUser?.uid,
            email: "test@example.com",
        });
    });

    it("should return null when retrieving a non-existent user", () => {
        const mockAuth = new MockAuth();

        const retrievedUser = mockAuth.getUserByEmail("nonexistent@example.com");

        expect(retrievedUser).toBeNull();
    });

    it("should set custom user claims", async () => {
        const mockAuth = new MockAuth();
        const testUser = { uid: "user123", email: "test@example.com", password: "123" };

        await mockAuth.createUser(testUser);

        const user = mockAuth.getUserByEmail("test@example.com");
        expect(user).toBeDefined();
        // @ts-expect-error -- user if not defined test will fail anyway
        await mockAuth.setCustomUserClaims(user.uid, { role: "ADMIN", organisationId: "org1" });

        expect(user?.customClaims).toEqual({ role: "ADMIN", organisationId: "org1" });
    });
});
