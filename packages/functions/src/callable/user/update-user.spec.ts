import type { EditUserPayload, User } from "../../../types/types";
import type { CallableRequest } from "firebase-functions/v2/https";
import { updateUserFn } from "./update-user";
import { Role } from "../../../types/types";
import * as Init from "../../init";
import { MockAuth } from "../../../test-helpers/MockAuth";
import {
    MockDocumentReference,
    MockFieldValue,
    MockFirestore,
} from "../../../test-helpers/MockFirestore";
import { getUserPath } from "../../paths";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Firestore from "firebase-admin/firestore";

vi.mock("firebase-admin/firestore");

let mockAuth: MockAuth;
let mockFirestore: MockFirestore;

async function createUser({
    email,
    password,
    organisationId,
    role,
}: Pick<User, "email" | "organisationId" | "role"> & { password: string }): Promise<string> {
    const { uid } = await mockAuth.createUser({
        email,
        password,
    });

    await mockAuth.setCustomUserClaims(uid, { role, organisationId });
    return uid;
}

describe("updateUserFn", () => {
    beforeEach(() => {
        vi.restoreAllMocks();

        mockAuth = new MockAuth();
        mockFirestore = new MockFirestore();

        vi.spyOn(Firestore, "FieldValue", "get").mockReturnValue(MockFieldValue as any);
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    describe("Successful updates", () => {
        it("should successfully update user details and property associations", async () => {
            const organisationId = "org1";
            const email = "original@example.com";
            const updatedUser = {
                name: "Updated Name",
                email: "updated@example.com",
                relatedProperties: ["property1", "property2"],
            };

            const uid = await createUser({
                email,
                password: "password",
                organisationId,
                role: Role.STAFF,
            });

            // Setting up existing user and properties in Mock Firestore
            await mockFirestore
                .collection(`organisations/${organisationId}/users`)
                .doc(uid)
                .set({
                    name: "Original Name",
                    email,
                    relatedProperties: ["property1"],
                });

            // Simulate the callable request
            const request = {
                data: { updatedUser, userId: uid, organisationId },
            } as CallableRequest<EditUserPayload>;

            const result = await updateUserFn(request);

            expect(result).toEqual({ success: true, message: "User updated successfully." });

            // Verify user details updated in Firestore
            const userDoc = mockFirestore.getDataAtPath(getUserPath(organisationId, uid)).data;

            expect(userDoc.name).toBe(updatedUser.name);
            expect(userDoc.email).toBe(updatedUser.email);
            expect(userDoc.relatedProperties).toEqual(updatedUser.relatedProperties);
        });
    });

    describe("Handling errors", () => {
        it("should throw an error if user ID is not provided", async () => {
            const request = {
                data: { updatedUser: { name: "New Name" }, userId: "", organisationId: "org1" },
            } as CallableRequest<EditUserPayload>;

            await expect(updateUserFn(request)).rejects.toThrow("User ID must be provided.");
        });

        it("should throw an error if user data to update is not provided", async () => {
            const request = {
                data: { userId: "user123", organisationId: "org1" },
            } as CallableRequest<EditUserPayload>;

            await expect(updateUserFn(request)).rejects.toThrow(
                "User data to update must be provided.",
            );
        });

        it("should handle errors during update", async () => {
            const request = {
                data: {
                    updatedUser: { name: "New Name", relatedProperties: ["property1"] },
                    userId: "user123",
                    organisationId: "org1",
                },
            } as CallableRequest<EditUserPayload>;

            vi.spyOn(MockAuth.prototype, "getUser").mockResolvedValue({} as any);

            // Mock Firestore transaction to throw an error
            vi.spyOn(MockDocumentReference.prototype, "update").mockRejectedValue(
                new Error("Failed"),
            );

            await expect(updateUserFn(request)).rejects.toThrow(
                "Failed to update user. Details: Failed",
            );
        });
    });

    describe("Password updates", () => {
        it("should update the password if provided", async () => {
            const newPassword = "newPassword123";

            // Creating user in MockAuth
            const { uid } = await mockAuth.createUser({
                email: "test@example.com",
                password: "oldPassword",
            });

            // Create user doc
            await mockFirestore.doc(getUserPath("org1", uid)).set({
                name: "Test User",
                email: "",
            });

            const request = {
                auth: { uid },
                data: {
                    updatedUser: { password: newPassword, relatedProperties: [] } as any,
                    userId: uid,
                    organisationId: "org1",
                },
                rawRequest: {} as any,
            } as CallableRequest<EditUserPayload>;

            await updateUserFn(request);

            // Verify password update in MockAuth
            const user = await mockAuth.getUserByEmail("test@example.com");

            // @ts-expect-error -- We shouldn't store the password, but it is a mock auth object
            expect(user?.password).toBe(newPassword);
        });

        it("should handle errors during password update", async () => {
            const userId = "user123";

            // Mock updateUser method in MockAuth to throw an error
            vi.spyOn(mockAuth, "updateUser").mockRejectedValue(new Error("Auth update failed"));

            const request = {
                auth: { uid: userId },
                data: {
                    updatedUser: { password: "newPassword", relatedProperties: [] } as any,
                    userId,
                    organisationId: "org1",
                },
            } as CallableRequest<EditUserPayload>;

            await expect(updateUserFn(request)).rejects.toThrow("Auth update failed");
        });
    });

    describe("Role updates", () => {
        it("should update custom claim when role is updated", async () => {
            const organisationId = "org1";
            const newRole = "admin";

            const { uid } = await mockAuth.createUser({
                email: "test@example.com",
                password: "password",
            });
            // Create user doc
            await mockFirestore.doc(getUserPath(organisationId, uid)).set({
                name: "Test User",
                email: "",
            });

            await mockAuth.setCustomUserClaims(uid, { role: "user", organisationId });

            const request = {
                data: {
                    updatedUser: { role: newRole, relatedProperties: [] } as any,
                    userId: uid,
                    organisationId,
                },
            } as CallableRequest<EditUserPayload>;

            await updateUserFn(request);

            // Verify custom claim update in MockAuth
            const user = await mockAuth.getUserByEmail("test@example.com");
            expect(user.customClaims).toStrictEqual({ role: newRole, organisationId });
        });
    });
});
