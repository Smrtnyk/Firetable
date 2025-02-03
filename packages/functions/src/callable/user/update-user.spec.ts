import type { EditUserPayload, User } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";

import { Role } from "@shared-types/index.js";
import { DocumentReference } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockAuth } from "../../../test-helpers/MockAuth.js";
import * as Init from "../../init.js";
import { db } from "../../init.js";
import { getUserPath } from "../../paths.js";
import { updateUserFn } from "./update-user.js";

let mockAuth: MockAuth;

async function createUser({
    email,
    organisationId,
    password,
    role,
}: Pick<User, "email" | "organisationId" | "role"> & { password: string }): Promise<string> {
    const { uid } = await mockAuth.createUser({
        email,
        password,
    });

    await mockAuth.setCustomUserClaims(uid, { organisationId, role });
    return uid;
}

describe("updateUserFn", () => {
    beforeEach(() => {
        vi.restoreAllMocks();

        mockAuth = new MockAuth();
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
    });

    describe("Successful updates", () => {
        it("should successfully update user details and property associations", async () => {
            const organisationId = "org1";
            const email = "original@example.com";
            const role = Role.STAFF;
            const updatedUser = {
                email: "updated@example.com",
                name: "Updated Name",
                relatedProperties: ["property1", "property2"],
                role,
                username: "updateduser",
            };

            const uid = await createUser({
                email,
                organisationId,
                password: "password",
                role,
            });

            // Setting up existing user in Mock Firestore
            await db
                .collection(`organisations/${organisationId}/users`)
                .doc(uid)
                .set({
                    email,
                    name: "Original Name",
                    relatedProperties: ["property1"],
                });

            const result = await updateUserFn({
                data: { organisationId, updatedUser, userId: uid },
            } as CallableRequest<EditUserPayload>);

            expect(result).toEqual({ message: "User updated successfully.", success: true });

            // Verify user details updated in Firestore
            const userDocRef = await db.doc(getUserPath(organisationId, uid)).get();
            const userDoc = userDocRef.data();
            expect(userDoc?.name).toBe(updatedUser.name);
            expect(userDoc?.email).toBe(updatedUser.email);
            expect(userDoc?.relatedProperties).toEqual(updatedUser.relatedProperties);
        });
    });

    it("does not throw an error if capabilities is undefined", async () => {
        const organisationId = "org1";
        const email = "user2@example.com";
        const updatedUser = {
            email: "updated2@example.com",
            name: "Updated Name",
            relatedProperties: ["property3", "property4"],
            role: Role.STAFF,
            username: "updateduser2",
            // capabilities is intentionally omitted
        };

        const uid = await createUser({
            email,
            organisationId,
            password: "password456",
            role: Role.STAFF,
        });

        // Set up existing user in Mock Firestore with capabilities
        await db
            .collection(`organisations/${organisationId}/users`)
            .doc(uid)
            .set({
                capabilities: ["cap2"],
                email,
                name: "Original Name",
                relatedProperties: ["property3"],
            });

        const request = {
            data: { organisationId, updatedUser, userId: uid },
        } as CallableRequest<EditUserPayload>;

        const result = await updateUserFn(request);

        expect(result).toEqual({ message: "User updated successfully.", success: true });

        // Verify user details updated in Firestore
        const userDocRef = await db.doc(getUserPath(organisationId, uid)).get();
        const userDoc = userDocRef.data();

        expect(userDoc?.name).toBe(updatedUser.name);
        expect(userDoc?.email).toBe(updatedUser.email);
        expect(userDoc?.relatedProperties).toEqual(updatedUser.relatedProperties);
        expect(userDoc?.capabilities).toEqual(["cap2"]);
    });

    describe("Handling errors", () => {
        it("should throw an error if user ID is not provided", async () => {
            const request = {
                data: { organisationId: "org1", updatedUser: { name: "New Name" }, userId: "" },
            } as CallableRequest<EditUserPayload>;

            await expect(updateUserFn(request)).rejects.toThrow("User ID must be provided.");
        });

        it("should throw an error if user data to update is not provided", async () => {
            const request = {
                data: { organisationId: "org1", userId: "user123" },
            } as CallableRequest<EditUserPayload>;

            await expect(updateUserFn(request)).rejects.toThrow(
                "User data to update must be provided.",
            );
        });

        it("should handle errors during update", async () => {
            const request = {
                data: {
                    organisationId: "org1",
                    updatedUser: { name: "New Name", relatedProperties: ["property1"] },
                    userId: "user123",
                },
            } as CallableRequest<EditUserPayload>;

            vi.spyOn(MockAuth.prototype, "getUser").mockResolvedValue({} as any);

            // Mock Firestore transaction to throw an error
            vi.spyOn(DocumentReference.prototype, "update").mockRejectedValue(new Error("Failed"));

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
            await db.doc(getUserPath("org1", uid)).set({
                email: "",
                name: "Test User",
            });

            const request = {
                auth: { uid },
                data: {
                    organisationId: "org1",
                    updatedUser: {
                        capabilities: {},
                        email: "test@example.com",
                        name: "Test User",
                        password: newPassword,
                        relatedProperties: [],
                        role: "Staff",
                        username: "TestUser",
                    } as any,
                    userId: uid,
                },
                rawRequest: {} as any,
            } as CallableRequest<EditUserPayload>;

            await updateUserFn(request);

            // Verify password update in MockAuth
            const user = await mockAuth.getUserByEmail("test@example.com");

            // @ts-expect-error -- we hijacked this method to return the password
            expect(user?.password).toBe(newPassword);
        });

        it("should handle errors during password update", async () => {
            const userId = "user123";

            // Mock updateUser method in MockAuth to throw an error
            vi.spyOn(mockAuth, "updateUser").mockRejectedValue(new Error("Auth update failed"));

            const request = {
                auth: { uid: userId },
                data: {
                    organisationId: "org1",
                    updatedUser: { password: "newPassword", relatedProperties: [] } as any,
                    userId,
                },
            } as CallableRequest<EditUserPayload>;

            await expect(updateUserFn(request)).rejects.toThrow("Auth update failed");
        });
    });

    describe("Role updates", () => {
        it("should update custom claim when role is updated", async () => {
            const organisationId = "org1";
            const newRole = Role.PROPERTY_OWNER;

            const { uid } = await mockAuth.createUser({
                email: "test@example.com",
                password: "password",
            });
            // Create user doc
            await db.doc(getUserPath(organisationId, uid)).set({
                email: "",
                name: "Test User",
            });

            await mockAuth.setCustomUserClaims(uid, { organisationId, role: Role.MANAGER });

            const request = {
                acceptsStreaming: false,
                data: {
                    organisationId,
                    updatedUser: {
                        capabilities: {},
                        email: "test@example.com",
                        id: uid,
                        name: "Test User",
                        organisationId,
                        password: "password",
                        relatedProperties: [],
                        role: newRole,
                        username: "TestUser",
                    },
                    userId: uid,
                },
                rawRequest: {} as any,
            } as CallableRequest<EditUserPayload>;

            await updateUserFn(request);

            // Verify custom claim update in MockAuth
            const user = await mockAuth.getUserByEmail("test@example.com");
            expect(user.customClaims).toStrictEqual({ organisationId, role: newRole });
        });
    });
});
