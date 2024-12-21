import type { EditUserPayload, User } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";
import { updateUserFn } from "./update-user.js";
import * as Init from "../../init.js";
import { MockAuth } from "../../../test-helpers/MockAuth.js";
import { getUserPath } from "../../paths.js";
import { db } from "../../init.js";
import { Role } from "@shared-types/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentReference } from "firebase-admin/firestore";

let mockAuth: MockAuth;

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
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
    });

    describe("Successful updates", () => {
        it("should successfully update user details and property associations", async () => {
            const organisationId = "org1";
            const email = "original@example.com";
            const role = Role.STAFF;
            const updatedUser = {
                name: "Updated Name",
                email: "updated@example.com",
                relatedProperties: ["property1", "property2"],
                username: "updateduser",
                role,
            };

            const uid = await createUser({
                email,
                password: "password",
                organisationId,
                role,
            });

            // Setting up existing user in Mock Firestore
            await db
                .collection(`organisations/${organisationId}/users`)
                .doc(uid)
                .set({
                    name: "Original Name",
                    email,
                    relatedProperties: ["property1"],
                });

            const result = await updateUserFn({
                data: { updatedUser, userId: uid, organisationId },
            } as CallableRequest<EditUserPayload>);

            expect(result).toEqual({ success: true, message: "User updated successfully." });

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
            name: "Updated Name",
            email: "updated2@example.com",
            relatedProperties: ["property3", "property4"],
            username: "updateduser2",
            role: Role.STAFF,
            // capabilities is intentionally omitted
        };

        const uid = await createUser({
            email,
            password: "password456",
            organisationId,
            role: Role.STAFF,
        });

        // Set up existing user in Mock Firestore with capabilities
        await db
            .collection(`organisations/${organisationId}/users`)
            .doc(uid)
            .set({
                name: "Original Name",
                email,
                relatedProperties: ["property3"],
                capabilities: ["cap2"],
            });

        const request = {
            data: { updatedUser, userId: uid, organisationId },
        } as CallableRequest<EditUserPayload>;

        const result = await updateUserFn(request);

        expect(result).toEqual({ success: true, message: "User updated successfully." });

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
                name: "Test User",
                email: "",
            });

            const request = {
                auth: { uid },
                data: {
                    updatedUser: {
                        password: newPassword,
                        relatedProperties: [],
                        name: "Test User",
                        username: "TestUser",
                        email: "test@example.com",
                        role: "Staff",
                        capabilities: {},
                    } as any,
                    userId: uid,
                    organisationId: "org1",
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
            const newRole = Role.PROPERTY_OWNER;

            const { uid } = await mockAuth.createUser({
                email: "test@example.com",
                password: "password",
            });
            // Create user doc
            await db.doc(getUserPath(organisationId, uid)).set({
                name: "Test User",
                email: "",
            });

            await mockAuth.setCustomUserClaims(uid, { role: Role.MANAGER, organisationId });

            const request = {
                data: {
                    updatedUser: {
                        role: newRole,
                        relatedProperties: [],
                        name: "Test User",
                        username: "TestUser",
                        email: "test@example.com",
                        capabilities: {},
                        organisationId,
                        password: "password",
                        id: uid,
                    },
                    userId: uid,
                    organisationId,
                },
                acceptsStreaming: false,
                rawRequest: {} as any,
            } as CallableRequest<EditUserPayload>;

            await updateUserFn(request);

            // Verify custom claim update in MockAuth
            const user = await mockAuth.getUserByEmail("test@example.com");
            expect(user.customClaims).toStrictEqual({ role: newRole, organisationId });
        });
    });
});
