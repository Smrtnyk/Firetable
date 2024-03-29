import type { CallableRequest } from "firebase-functions/v2/https";
import type { CreateUserPayload } from "../../../types/types.js";
import { MockAuth } from "../../../test-helpers/MockAuth.js";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import * as Init from "../../init.js";
import { getUserPath } from "../../paths.js";
import { createUser } from "./index.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const testUserData = {
    name: "Test User",
    password: "testpassword",
    email: "test@example.com",
    role: "ADMIN",
    relatedProperties: ["property1", "property2"],
    organisationId: "org1",
    username: "testuser",
};

describe("createUser", () => {
    let mockAuth: MockAuth;
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        mockAuth = new MockAuth();
        mockFirestore = new MockFirestore();

        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
    });

    it("should throw an error if the user already exists", async () => {
        // Setup to simulate existing user
        await mockAuth.createUser({ email: "test@example.com", password: "testpassword" });

        // Expect function to throw 'already-exists' error
        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("A user with this email already exists.");
    });

    it("should create a new user and store their data in Firestore", async () => {
        const result = await createUser({
            data: testUserData,
        } as CallableRequest<CreateUserPayload>);

        expect(result.uid).toBeDefined();
        expect(result.message).toBe("User created successfully!");

        // Verify Firestore data
        const userDoc = mockFirestore.getDataAtPath(
            getUserPath(testUserData.organisationId, result.uid),
        );
        expect(userDoc).toEqual(
            expect.objectContaining({
                name: "Test User",
                email: "test@example.com",
            }),
        );
    });

    it("should handle failure in creating a user in Firebase Auth", async () => {
        // Mock createUser to throw an error
        vi.spyOn(mockAuth, "createUser").mockRejectedValue(new Error("Auth creation failed"));

        // Expect function to throw an error
        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("Auth creation failed");

        // Verify that no data was written to Firestore
        expect(mockFirestore.data.size).toBe(0);
    });

    it("should clean up by deleting the user from Auth if there's an exception after user creation", async () => {
        vi.spyOn(mockFirestore, "runTransaction").mockRejectedValue(
            new Error("Some post-creation error"),
        );

        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("Some post-creation error");

        // Verify user cleanup in Auth
        expect(() => mockAuth.getUserByEmail(testUserData.email)).toThrow();
    });
});
