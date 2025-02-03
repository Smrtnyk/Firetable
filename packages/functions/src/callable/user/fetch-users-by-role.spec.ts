import type { UserRecord } from "firebase-admin/auth";
import type { CallableRequest } from "firebase-functions/v2/https";

import { AdminRole, Role } from "@shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FetchUsersByRoleRequestData } from "./fetch-users-by-role.js";

import { MockAuth } from "../../../test-helpers/MockAuth.js";
import * as Init from "../../init.js";
import { db } from "../../init.js";
import { fetchUsersByRoleFn } from "./fetch-users-by-role.js";

describe("fetchUsersByRoleFn", () => {
    let mockAuth: MockAuth;
    let authUsers: Record<string, { email: string; uid: string }> = {};

    beforeEach(async () => {
        mockAuth = new MockAuth();

        async function createTestUser(email: string, lastSignInTime?: string): Promise<UserRecord> {
            const user = await mockAuth.createUser({
                email,
                password: "password123",
            });

            if (lastSignInTime) {
                Object.assign(user.metadata, { lastSignInTime });
            }

            return user;
        }

        // Create all users with their specific lastSignInTimes
        const [authUser1, authUser2, authUser3, authUser4, authUser5, authUser6] =
            await Promise.all([
                createTestUser("user1@test.com", "2023-11-01T12:00:00.000Z"),
                createTestUser("user2@test.com", "2023-11-02T12:00:00.000Z"),
                createTestUser("user3@test.com", "2023-11-03T12:00:00.000Z"),
                createTestUser("user4@test.com", "2023-11-04T12:00:00.000Z"),
                // No lastSignInTime
                createTestUser("user5@test.com"),
                createTestUser("user6@test.com", "2023-11-06T12:00:00.000Z"),
            ]);

        // Store users for easy reference in tests
        authUsers = {
            user1: { email: authUser1.email!, uid: authUser1.uid },
            user2: { email: authUser2.email!, uid: authUser2.uid },
            user3: { email: authUser3.email!, uid: authUser3.uid },
            user4: { email: authUser4.email!, uid: authUser4.uid },
            user5: { email: authUser5.email!, uid: authUser5.uid },
            user6: { email: authUser6.email!, uid: authUser6.uid },
        };

        // Users with relatedProperties
        await db.doc(`organisations/org1/users/${authUser1.uid}`).set({
            name: "user1",
            relatedProperties: ["prop1", "prop2"],
            role: Role.STAFF,
        });
        await db.doc(`organisations/org1/users/${authUser2.uid}`).set({
            name: "user2",
            relatedProperties: ["prop2", "prop3"],
            role: Role.HOSTESS,
        });
        await db.doc(`organisations/org1/users/${authUser3.uid}`).set({
            name: "user3",
            relatedProperties: ["prop3"],
            role: Role.STAFF,
        });
        await db.doc(`organisations/org1/users/${authUser4.uid}`).set({
            name: "user4",
            relatedProperties: ["prop1", "prop4"],
            role: Role.PROPERTY_OWNER,
        });

        // No related properties user
        await db.doc(`organisations/org1/users/${authUser5.uid}`).set({
            name: "user5",
            relatedProperties: [],
            role: Role.STAFF,
        });

        await db.doc(`organisations/org1/users/${authUser6.uid}`).set({
            name: "user6",
            relatedProperties: ["prop2", "prop5"],
            role: Role.MANAGER,
        });

        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
    });

    it("fetches all users for Admin", async () => {
        const mockReq = {
            auth: { token: { role: AdminRole.ADMIN } as any, uid: "adminUser" },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user1",
                relatedProperties: ["prop1", "prop2"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user2",
                relatedProperties: ["prop2", "prop3"],
                role: "Hostess",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user3",
                relatedProperties: ["prop3"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user4",
                relatedProperties: ["prop1", "prop4"],
                role: "Property Owner",
            },
            {
                id: expect.any(String),
                lastSignInTime: null,
                name: "user5",
                relatedProperties: [],
                role: "Staff",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
            },
        ]);
    });

    it("fetches all users for Property Owner", async () => {
        const mockReq = {
            auth: { token: { role: Role.PROPERTY_OWNER } as any, uid: "user4" },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user1",
                relatedProperties: ["prop1", "prop2"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user2",
                relatedProperties: ["prop2", "prop3"],
                role: "Hostess",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user3",
                relatedProperties: ["prop3"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user4",
                relatedProperties: ["prop1", "prop4"],
                role: "Property Owner",
            },
            {
                id: expect.any(String),
                lastSignInTime: null,
                name: "user5",
                relatedProperties: [],
                role: "Staff",
            },
            {
                id: expect.any(String),
                lastSignInTime: expect.anything(),
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
            },
        ]);
    });

    it("fetches users with shared relatedProperties for Staff user", async () => {
        const mockReq: CallableRequest<FetchUsersByRoleRequestData> = {
            auth: { token: { role: Role.STAFF } as any, uid: authUsers.user1!.uid },
            data: { organisationId: "org1" },
            rawRequest: {} as any,
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                relatedProperties: ["prop1", "prop2"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                name: "user2",
                relatedProperties: ["prop2", "prop3"],
                role: "Hostess",
            },
        ]);
    });

    it("fetches users with shared relatedProperties for Hostess user", async () => {
        const mockReq: CallableRequest<FetchUsersByRoleRequestData> = {
            auth: { token: { role: Role.HOSTESS } as any, uid: authUsers.user2!.uid },
            data: { organisationId: "org1" },
            rawRequest: {} as any,
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                relatedProperties: ["prop1", "prop2"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                name: "user2",
                relatedProperties: ["prop2", "prop3"],
                role: "Hostess",
            },
            {
                id: expect.any(String),
                name: "user3",
                relatedProperties: ["prop3"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
            },
        ]);
    });

    it("returns an empty array if the user has no related properties", async () => {
        const mockReq = {
            auth: { token: { role: Role.STAFF } as any, uid: authUsers.user5!.uid },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([]);
    });

    it("fetches users with shared relatedProperties for Manager user", async () => {
        const mockReq = {
            auth: { token: { role: Role.MANAGER } as any, uid: authUsers.user6!.uid },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                relatedProperties: ["prop1", "prop2"],
                role: "Staff",
            },
            {
                id: expect.any(String),
                name: "user2",
                relatedProperties: ["prop2", "prop3"],
                role: "Hostess",
            },
            {
                id: expect.any(String),
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
            },
        ]);
    });

    describe("Last Sign-in Time Functionality", () => {
        it("should include lastSignInTime for Admin users", async () => {
            const adminUser = await mockAuth.createUser({
                email: "admin@test.com",
                password: "password123",
            });

            const mockReq = {
                auth: { token: { role: AdminRole.ADMIN } as any, uid: adminUser.uid },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            const users = await fetchUsersByRoleFn(mockReq);

            const userWithSignIn = users.find(({ id }) => id === authUsers.user1!.uid);
            const userWithoutSignIn = users.find(({ id }) => id === authUsers.user5!.uid);

            expect(userWithSignIn?.lastSignInTime).toBe(Date.parse("2023-11-01T12:00:00.000Z"));
            expect(userWithoutSignIn?.lastSignInTime).toBeNull();
        });

        it("should include lastSignInTime for Property Owner users", async () => {
            const mockReq = {
                auth: { token: { role: Role.PROPERTY_OWNER } as any, uid: authUsers.user4!.uid },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            const users = await fetchUsersByRoleFn(mockReq);

            const staffUser = users.find(({ id }) => id === authUsers.user1!.uid);
            expect(staffUser?.lastSignInTime).toBe(Date.parse("2023-11-01T12:00:00.000Z"));
        });

        it("should not include lastSignInTime for Manager role", async () => {
            const mockReq = {
                auth: { token: { role: Role.MANAGER } as any, uid: authUsers.user6!.uid },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            const users = await fetchUsersByRoleFn(mockReq);

            const getUsers = vi.spyOn(mockAuth, "getUsers");
            expect(getUsers).not.toHaveBeenCalled();

            users.forEach(function (user) {
                expect(user).not.toHaveProperty("lastSignInTime");
            });
        });

        it("should handle auth service errors gracefully", async () => {
            const mockReq = {
                auth: { token: { role: Role.PROPERTY_OWNER } as any, uid: authUsers.user4!.uid },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            vi.spyOn(mockAuth, "getUsers").mockRejectedValueOnce(new Error("Auth service error"));

            const users = await fetchUsersByRoleFn(mockReq);

            // Should still return users but without lastSignInTime
            expect(users.length).toBeGreaterThan(0);
            users.forEach(function (user) {
                expect(user).not.toHaveProperty("lastSignInTime");
            });
        });
    });

    describe("Error Handling", () => {
        it("should throw an error if the user's document does not exist", async () => {
            const mockReq = {
                auth: { token: { role: Role.STAFF } as any, uid: "nonExistentUser" },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "User document for UID nonExistentUser not found.",
            );
        });

        it("should throw unauthenticated error if user is not authenticated", async () => {
            const mockReq = {
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "User must be authenticated.",
            );
        });

        it("should throw an error if user role is not found in custom claims", async () => {
            const mockReq = {
                auth: { token: {}, uid: "user1" },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "User role not found in custom claims.",
            );
        });
    });
});
