import type { EditUserPayload, User } from "../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { updateUserFn } from "./update-user.js";
import { Role } from "../../types/types.js";
import * as Init from "../init.js";
import { MockAuth } from "../../test-helpers/MockAuth.js";
import { MockFieldValue, MockFirestore } from "../../test-helpers/MockFirestore.js";
import { getPropertyPath, getUserPath } from "../paths.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Firestore from "firebase-admin/firestore";

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
            const userDoc = mockFirestore.getDataAtPath(getUserPath(organisationId, uid));

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

        it("should handle errors during Firestore transaction", async () => {
            const request = {
                data: {
                    updatedUser: { name: "New Name", relatedProperties: ["property1"] },
                    userId: "user123",
                    organisationId: "org1",
                },
            } as CallableRequest<EditUserPayload>;

            vi.spyOn(MockAuth.prototype, "getUser").mockResolvedValue({} as any);

            // Mock Firestore transaction to throw an error
            vi.spyOn(mockFirestore, "runTransaction").mockRejectedValue(
                new Error("Transaction failed"),
            );

            await expect(updateUserFn(request)).rejects.toThrow("Transaction failed");
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

    describe("Property associations", () => {
        it("should add new property associations", async () => {
            const organisationId = "org1";
            const propertiesToAdd = ["property2", "property3"];

            const uid = await createUser({
                email: "example@mail.at",
                organisationId,
                role: Role.STAFF,
                password: "password",
            });

            // Setup initial mock properties without the user associated
            for (const propertyId of propertiesToAdd) {
                const propertyPath = getPropertyPath(organisationId, propertyId);
                const propertyDocRef = mockFirestore.doc(propertyPath);
                await propertyDocRef.set({
                    relatedUsers: [], // initially empty
                });
            }

            // Setup test data with new properties to add
            const request = {
                data: {
                    updatedUser: { relatedProperties: propertiesToAdd },
                    userId: uid,
                    organisationId,
                },
            } as CallableRequest<EditUserPayload>;

            // Call the function to add property associations
            await updateUserFn(request);

            // Verify new associations in Firestore
            for (const propertyId of propertiesToAdd) {
                const propertyDoc = mockFirestore.getDataAtPath(
                    getPropertyPath(organisationId, propertyId),
                );
                expect(propertyDoc.relatedUsers).toContain(uid);
            }
        });

        it("should remove existing property associations", async () => {
            const organisationId = "org1";
            const propertiesToRemove = ["property1"];

            const uid = await createUser({
                email: "example@mail.at",
                organisationId,
                role: Role.STAFF,
                password: "password",
            });

            // Setup initial mock properties with the user associated
            for (const propertyId of propertiesToRemove) {
                const propertyPath = getPropertyPath(organisationId, propertyId);
                const propertyDocRef = mockFirestore.doc(propertyPath);
                await propertyDocRef.set({
                    relatedUsers: [uid],
                });
            }

            // Setup test data with properties to remove
            const request = {
                data: {
                    updatedUser: { relatedProperties: [] } as any,
                    userId: uid,
                    organisationId,
                },
            } as CallableRequest<EditUserPayload>;

            // Call the function to remove property associations
            await updateUserFn(request);

            // Verify removal of associations in Firestore
            for (const propertyId of propertiesToRemove) {
                const propertyDoc = mockFirestore.getDataAtPath(
                    getPropertyPath(organisationId, propertyId),
                );
                expect(propertyDoc.relatedUsers).not.toContain(uid);
            }
        });
    });
});
