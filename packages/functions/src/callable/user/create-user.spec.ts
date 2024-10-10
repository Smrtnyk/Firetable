import type { CallableRequest } from "firebase-functions/v2/https";
import type { CreateUserPayload } from "../../../types/types";
import { createUser } from "./create-user";
import { MockAuth } from "../../../test-helpers/MockAuth";
import { MockFirestore } from "../../../test-helpers/MockFirestore";
import * as Init from "../../init";
import { getUserPath } from "../../paths";
import { HttpsError } from "firebase-functions/v2/https";
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

    it("throws an error if the user already exists", async () => {
        // Setup to simulate existing user
        await mockAuth.createUser({ email: "test@example.com", password: "testpassword" });

        // Expect function to throw 'already-exists' error
        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("A user with this email already exists.");
    });

    it("creates a new user and store their data in Firestore", async () => {
        // create related properties
        for (const propertyId of testUserData.relatedProperties) {
            await mockFirestore
                .collection(`organisations/${testUserData.organisationId}/properties`)
                .doc(propertyId)
                .set({ id: propertyId });
        }

        const result = await createUser({
            data: testUserData,
        } as CallableRequest<CreateUserPayload>);

        expect(result.uid).toBeDefined();
        expect(result.message).toBe("User created successfully!");

        // Verify Firestore data
        const userDoc = mockFirestore.getDataAtPath(
            getUserPath(testUserData.organisationId, result.uid),
        );
        expect(userDoc.data).toEqual(
            expect.objectContaining({
                name: "Test User",
                email: "test@example.com",
            }),
        );
    });

    it("handles failure in creating a user in Firebase Auth", async () => {
        // Mock createUser to throw an error
        vi.spyOn(mockAuth, "createUser").mockRejectedValue(new Error("Auth creation failed"));

        // Expect function to throw an error
        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("Auth creation failed");

        // Verify that no data was written to Firestore
        expect(mockFirestore.data.size).toBe(0);
    });

    it("cleans up by deleting the user from Auth if there's an exception after user creation", async () => {
        vi.spyOn(mockFirestore, "runTransaction").mockRejectedValue(
            new Error("Some post-creation error"),
        );

        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("Some post-creation error");

        // Verify user cleanup in Auth
        expect(() => mockAuth.getUserByEmail(testUserData.email)).toThrow();
    });

    it("throws an 'invalid-argument' error if the password is invalid", async () => {
        const invalidPasswordData = { ...testUserData, password: "123" };

        const authError = new Error("Password should be at least 6 characters");
        (authError as any).code = "auth/invalid-password";
        vi.spyOn(mockAuth, "createUser").mockRejectedValue(authError);

        await expect(
            createUser({ data: invalidPasswordData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow(
            "The provided password is invalid. It must be at least 6 characters long and contain a mix of characters.",
        );

        try {
            await createUser({ data: invalidPasswordData } as CallableRequest<CreateUserPayload>);
        } catch (error: any) {
            expect(error).toBeInstanceOf(HttpsError);
            expect(error.code).toBe("invalid-argument");
            expect(error.message).toBe(
                "The provided password is invalid. It must be at least 6 characters long and contain a mix of characters.",
            );
        }
    });

    it("throws an 'invalid-argument' error if the email is invalid", async () => {
        const invalidEmailData = { ...testUserData, email: "invalid-email" };

        const authError = new Error("The email address is badly formatted.");
        (authError as any).code = "auth/invalid-email";
        vi.spyOn(mockAuth, "createUser").mockRejectedValue(authError);

        await expect(
            createUser({ data: invalidEmailData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("The provided email is invalid.");

        try {
            await createUser({ data: invalidEmailData } as CallableRequest<CreateUserPayload>);
        } catch (error: any) {
            expect(error).toBeInstanceOf(HttpsError);
            expect(error.code).toBe("invalid-argument");
            expect(error.message).toBe("The provided email is invalid.");
        }
    });

    it("throws an 'internal' error for unexpected errors", async () => {
        const unexpectedError = new Error("Unexpected server error.");
        vi.spyOn(mockAuth, "createUser").mockRejectedValue(unexpectedError);

        await expect(
            createUser({ data: testUserData } as CallableRequest<CreateUserPayload>),
        ).rejects.toThrow("Unexpected server error.");

        try {
            await createUser({ data: testUserData } as CallableRequest<CreateUserPayload>);
        } catch (error: any) {
            expect(error).toBeInstanceOf(HttpsError);
            expect(error.code).toBe("internal");
            expect(error.message).toBe("Unexpected server error.");
        }
    });
});
