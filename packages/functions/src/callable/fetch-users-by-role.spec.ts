import type { FetchUsersByRoleRequestData } from "./fetch-users-by-role.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { fetchUsersByRoleFn } from "./fetch-users-by-role.js";
import * as Init from "../init";
import { ADMIN, Role } from "../../types/types.js";
import { MockFieldPath, MockFirestore } from "../../test-helpers/MockFirestore.js";
import * as Firestore from "firebase-admin/firestore";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("fetchUsersByRoleFn", () => {
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        mockFirestore = new MockFirestore();

        mockFirestore
            .doc("organisations/org1/users/user1")
            .set({ role: Role.STAFF, name: "user1" });
        mockFirestore
            .doc("organisations/org1/users/user2")
            .set({ role: Role.HOSTESS, name: "user2" });
        mockFirestore
            .doc("organisations/org1/users/user3")
            .set({ role: Role.STAFF, name: "user3" });
        mockFirestore
            .doc("organisations/org1/users/user4")
            .set({ role: Role.PROPERTY_OWNER, name: "user4" });

        vi.spyOn(Firestore, "FieldPath", "get").mockReturnValue(MockFieldPath);
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore);
    });

    describe("Admin User", () => {
        it("should fetch all users ", async () => {
            // Mock req object for an Admin user
            const mockReq = {
                auth: { uid: "user1", token: { role: ADMIN } },
                data: { organisationId: "org1" },
            };

            const users = await fetchUsersByRoleFn(mockReq);
            expect(users).toStrictEqual([
                {
                    id: "user1",
                    name: "user1",
                    role: "Staff",
                },
                {
                    id: "user2",
                    name: "user2",
                    role: "Hostess",
                },
                {
                    id: "user3",
                    name: "user3",
                    role: "Staff",
                },
                {
                    id: "user4",
                    name: "user4",
                    role: "Property Owner",
                },
            ]);
        });
    });

    describe("Property Owner User", () => {
        it("should fetch all users", async () => {
            const mockReq = {
                auth: { uid: "user4", token: { role: Role.PROPERTY_OWNER } },
                data: { organisationId: "org1" },
            };

            const users = await fetchUsersByRoleFn(mockReq);
            expect(users).toStrictEqual([
                {
                    id: "user1",
                    name: "user1",
                    role: "Staff",
                },
                {
                    id: "user2",
                    name: "user2",
                    role: "Hostess",
                },
                {
                    id: "user3",
                    name: "user3",
                    role: "Staff",
                },
                {
                    id: "user4",
                    name: "user4",
                    role: "Property Owner",
                },
            ]);
        });
    });

    describe("Staff User", () => {
        it("should fetch users only for related ids", async () => {
            const mockReq: CallableRequest<FetchUsersByRoleRequestData> = {
                auth: { uid: "user1", token: { role: Role.STAFF } },
                data: { organisationId: "org1", userIdsToFetch: ["user1", "user2"] },
            };

            const users = await fetchUsersByRoleFn(mockReq);
            expect(users).toStrictEqual([
                {
                    id: "user1",
                    name: "user1",
                    role: "Staff",
                },
            ]);
        });
    });

    describe("Error Handling", () => {
        it("should throw unauthenticated error if user is not authenticated", async () => {
            const mockReq = {
                data: { organisationId: "org1" },
            };

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "User must be authenticated.",
            );
        });

        it("should throw an error if too many user IDs are provided", async () => {
            const mockReq = {
                auth: { uid: "user1", token: { role: "ADMIN" } },
                data: {
                    organisationId: "org1",
                    userIdsToFetch: Array.from({ length: 101 })
                        .fill(0)
                        .map((_, idx) => `user${idx}`),
                },
            };

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "Too many user IDs provided.",
            );
        });

        it("should throw an error if user role is not found in custom claims", async () => {
            const mockReq = {
                auth: { uid: "user1", token: {} },
                data: { organisationId: "org1" },
            };

            await expect(fetchUsersByRoleFn(mockReq)).rejects.toThrow(
                "User role not found in custom claims.",
            );
        });
    });
});
