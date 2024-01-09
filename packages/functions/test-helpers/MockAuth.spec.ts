import { MockAuth } from "./MockAuth.js";
import { describe, it, expect } from "vitest";

describe("MockAuth", () => {
    it("should allow creating and retrieving a user by email", async () => {
        const mockAuth = new MockAuth();
        const testUser = { uid: "user123", email: "test@example.com" };

        mockAuth.createUser(testUser);

        const retrievedUser = mockAuth.getUserByEmail("test@example.com");

        expect(retrievedUser).toBeDefined();
        expect(retrievedUser).toEqual(testUser);
    });

    it("should return null when retrieving a non-existent user", () => {
        const mockAuth = new MockAuth();

        const retrievedUser = mockAuth.getUserByEmail("nonexistent@example.com");

        expect(retrievedUser).toBeNull();
    });
});
