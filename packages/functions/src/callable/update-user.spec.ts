import type { EditUserPayload } from "../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { updateUserFn } from "./update-user.js";
import * as Init from "../init.js";
import { MockAuth } from "../../test-helpers/MockAuth.js";
import { MockFieldValue, MockFirestore } from "../../test-helpers/MockFirestore.js";
import { getPropertyPath, getUserPath } from "../paths.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Firestore from "firebase-admin/firestore";

describe("updateUserFn", () => {
    let mockAuth: MockAuth;
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        mockAuth = new MockAuth();
        mockFirestore = new MockFirestore();

        vi.spyOn(Firestore, "FieldValue", "get").mockReturnValue(MockFieldValue as any);
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    describe("Successful updates", () => {
        it("should successfully update user details and property associations", async () => {
            const userId = "user123";
            const organisationId = "org1";
            const updatedUser = {
                name: "Updated Name",
                email: "updated@example.com",
                relatedProperties: ["property1", "property2"],
            };

            // Setting up existing user and properties in Mock Firestore
            await mockFirestore
                .collection(`organisations/${organisationId}/users`)
                .doc(userId)
                .set({
                    name: "Original Name",
                    email: "original@example.com",
                    relatedProperties: ["property1"],
                });

            // Simulate the callable request
            const request = {
                data: { updatedUser, userId, organisationId },
            } as CallableRequest<EditUserPayload>;

            const result = await updateUserFn(request);

            expect(result).toEqual({ success: true, message: "User updated successfully." });

            // Verify user details updated in Firestore
            const userDoc = mockFirestore.getDataAtPath(getUserPath(organisationId, userId));

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
            const user = mockAuth.getUserByEmail("test@example.com");
            expect(user).toBeDefined();
            // Assuming MockAuth stores the latest password
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

    describe("Property associations", () => {
        it("should add new property associations", async () => {
            const userId = "user123";
            const organisationId = "org1";
            const propertiesToAdd = ["property2", "property3"];

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
                    userId,
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
                expect(propertyDoc.relatedUsers).toContain(userId);
            }
        });

        it("should remove existing property associations", async () => {
            const userId = "user123";
            const organisationId = "org1";
            const propertiesToRemove = ["property1"];

            // Setup initial mock properties with the user associated
            for (const propertyId of propertiesToRemove) {
                const propertyPath = getPropertyPath(organisationId, propertyId);
                const propertyDocRef = mockFirestore.doc(propertyPath);
                await propertyDocRef.set({
                    relatedUsers: [userId],
                });
            }

            // Setup test data with properties to remove
            const request = {
                data: {
                    updatedUser: { relatedProperties: [] } as any,
                    userId,
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
                expect(propertyDoc.relatedUsers).not.toContain(userId);
            }
        });
    });
});
