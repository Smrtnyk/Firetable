import type { FetchUsersByRoleRequestData } from "./fetch-users-by-role.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { fetchUsersByRoleFn } from "./fetch-users-by-role.js";
import * as Init from "../../init.js";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { MockAuth } from "../../../test-helpers/MockAuth.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role, AdminRole } from "@shared-types";

vi.mock("firebase-admin/firestore");

describe("fetchUsersByRoleFn", () => {
    let mockFirestore: MockFirestore;
    let mockAuth: MockAuth;
    let authUsers: Record<string, { uid: string; email: string }> = {};

    beforeEach(async () => {
        mockFirestore = new MockFirestore();
        mockAuth = new MockAuth();

        const createTestUser = async (email: string, lastSignInTime?: string) => {
            const user = await mockAuth.createUser({
                email,
                password: "password123",
            });

            if (lastSignInTime) {
                Object.assign(user.metadata, { lastSignInTime });
            }

            return user;
        };

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
            user1: { uid: authUser1.uid, email: authUser1.email! },
            user2: { uid: authUser2.uid, email: authUser2.email! },
            user3: { uid: authUser3.uid, email: authUser3.email! },
            user4: { uid: authUser4.uid, email: authUser4.email! },
            user5: { uid: authUser5.uid, email: authUser5.email! },
            user6: { uid: authUser6.uid, email: authUser6.email! },
        };

        // Users with relatedProperties
        mockFirestore.doc(`organisations/org1/users/${authUser1.uid}`).set({
            role: Role.STAFF,
            name: "user1",
            relatedProperties: ["prop1", "prop2"],
        });
        mockFirestore.doc(`organisations/org1/users/${authUser2.uid}`).set({
            role: Role.HOSTESS,
            name: "user2",
            relatedProperties: ["prop2", "prop3"],
        });
        mockFirestore.doc(`organisations/org1/users/${authUser3.uid}`).set({
            role: Role.STAFF,
            name: "user3",
            relatedProperties: ["prop3"],
        });
        mockFirestore.doc(`organisations/org1/users/${authUser4.uid}`).set({
            role: Role.PROPERTY_OWNER,
            name: "user4",
            relatedProperties: ["prop1", "prop4"],
        });

        // No related properties user
        mockFirestore.doc(`organisations/org1/users/${authUser5.uid}`).set({
            role: Role.STAFF,
            name: "user5",
            relatedProperties: [],
        });

        mockFirestore.doc(`organisations/org1/users/${authUser6.uid}`).set({
            role: Role.MANAGER,
            name: "user6",
            relatedProperties: ["prop2", "prop5"],
        });

        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
    });

    it("fetches all users for Admin", async () => {
        const mockReq = {
            auth: { uid: "adminUser", token: { role: AdminRole.ADMIN } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user2",
                role: "Hostess",
                relatedProperties: ["prop2", "prop3"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user3",
                role: "Staff",
                relatedProperties: ["prop3"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user4",
                role: "Property Owner",
                relatedProperties: ["prop1", "prop4"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user5",
                relatedProperties: [],
                role: "Staff",
                lastSignInTime: null,
            },
            {
                id: expect.any(String),
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
                lastSignInTime: expect.anything(),
            },
        ]);
    });

    it("fetches all users for Property Owner", async () => {
        const mockReq = {
            auth: { uid: "user4", token: { role: Role.PROPERTY_OWNER } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user2",
                role: "Hostess",
                relatedProperties: ["prop2", "prop3"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user3",
                role: "Staff",
                relatedProperties: ["prop3"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user4",
                role: "Property Owner",
                relatedProperties: ["prop1", "prop4"],
                lastSignInTime: expect.anything(),
            },
            {
                id: expect.any(String),
                name: "user5",
                relatedProperties: [],
                role: "Staff",
                lastSignInTime: null,
            },
            {
                id: expect.any(String),
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
                lastSignInTime: expect.anything(),
            },
        ]);
    });

    it("fetches users with shared relatedProperties for Staff user", async () => {
        const mockReq: CallableRequest<FetchUsersByRoleRequestData> = {
            auth: { uid: authUsers.user1!.uid, token: { role: Role.STAFF } as any },
            data: { organisationId: "org1" },
            rawRequest: {} as any,
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
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
            auth: { uid: authUsers.user2!.uid, token: { role: Role.HOSTESS } as any },
            data: { organisationId: "org1" },
            rawRequest: {} as any,
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
            },
            {
                id: expect.any(String),
                name: "user2",
                role: "Hostess",
                relatedProperties: ["prop2", "prop3"],
            },
            {
                id: expect.any(String),
                name: "user3",
                role: "Staff",
                relatedProperties: ["prop3"],
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
            auth: { uid: authUsers.user5!.uid, token: { role: Role.STAFF } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([]);
    });

    it("fetches users with shared relatedProperties for Manager user", async () => {
        const mockReq = {
            auth: { uid: authUsers.user6!.uid, token: { role: Role.MANAGER } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: expect.any(String),
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
            },
            {
                id: expect.any(String),
                name: "user2",
                role: "Hostess",
                relatedProperties: ["prop2", "prop3"],
            },
            {
                id: expect.any(String),
                name: "user6",
                role: "Manager",
                relatedProperties: ["prop2", "prop5"],
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
                auth: { uid: adminUser.uid, token: { role: AdminRole.ADMIN } as any },
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
                auth: { uid: authUsers.user4!.uid, token: { role: Role.PROPERTY_OWNER } as any },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            const users = await fetchUsersByRoleFn(mockReq);

            const staffUser = users.find(({ id }) => id === authUsers.user1!.uid);
            expect(staffUser?.lastSignInTime).toBe(Date.parse("2023-11-01T12:00:00.000Z"));
        });

        it("should not include lastSignInTime for Manager role", async () => {
            const mockReq = {
                auth: { uid: authUsers.user6!.uid, token: { role: Role.MANAGER } as any },
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
                auth: { uid: authUsers.user4!.uid, token: { role: Role.PROPERTY_OWNER } as any },
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
                auth: { uid: "nonExistentUser", token: { role: Role.STAFF } as any },
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
                auth: { uid: "user1", token: {} },
                data: { organisationId: "org1" },
            } as CallableRequest<FetchUsersByRoleRequestData>;

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "User role not found in custom claims.",
            );
        });
    });
});
