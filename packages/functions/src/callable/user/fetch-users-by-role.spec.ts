import type { FetchUsersByRoleRequestData } from "./fetch-users-by-role";
import type { CallableRequest } from "firebase-functions/v2/https";
import { fetchUsersByRoleFn } from "./fetch-users-by-role";
import * as Init from "../../init";
import { ADMIN, Role } from "../../../types/types";
import { MockFirestore } from "../../../test-helpers/MockFirestore";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase-admin/firestore");

describe("fetchUsersByRoleFn", () => {
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        mockFirestore = new MockFirestore();

        // Users with relatedProperties
        mockFirestore.doc("organisations/org1/users/user1").set({
            role: Role.STAFF,
            name: "user1",
            relatedProperties: ["prop1", "prop2"],
        });
        mockFirestore.doc("organisations/org1/users/user2").set({
            role: Role.HOSTESS,
            name: "user2",
            relatedProperties: ["prop2", "prop3"],
        });
        mockFirestore.doc("organisations/org1/users/user3").set({
            role: Role.STAFF,
            name: "user3",
            relatedProperties: ["prop3"],
        });
        mockFirestore.doc("organisations/org1/users/user4").set({
            role: Role.PROPERTY_OWNER,
            name: "user4",
            relatedProperties: ["prop1", "prop4"],
        });

        // No related properties user
        mockFirestore.doc("organisations/org1/users/user5").set({
            role: Role.STAFF,
            name: "user5",
            relatedProperties: [],
        });

        mockFirestore.doc("organisations/org1/users/user6").set({
            role: Role.MANAGER,
            name: "user6",
            relatedProperties: ["prop2", "prop5"],
        });

        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    it("fetches all users for Admin", async () => {
        const mockReq = {
            auth: { uid: "adminUser", token: { role: ADMIN } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            { id: "user1", name: "user1", role: "Staff", relatedProperties: ["prop1", "prop2"] },
            { id: "user2", name: "user2", role: "Hostess", relatedProperties: ["prop2", "prop3"] },
            { id: "user3", name: "user3", role: "Staff", relatedProperties: ["prop3"] },
            {
                id: "user4",
                name: "user4",
                role: "Property Owner",
                relatedProperties: ["prop1", "prop4"],
            },
            {
                id: "user5",
                name: "user5",
                relatedProperties: [],
                role: "Staff",
            },
            {
                id: "user6",
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
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
            { id: "user1", name: "user1", role: "Staff", relatedProperties: ["prop1", "prop2"] },
            { id: "user2", name: "user2", role: "Hostess", relatedProperties: ["prop2", "prop3"] },
            { id: "user3", name: "user3", role: "Staff", relatedProperties: ["prop3"] },
            {
                id: "user4",
                name: "user4",
                role: "Property Owner",
                relatedProperties: ["prop1", "prop4"],
            },
            {
                id: "user5",
                name: "user5",
                relatedProperties: [],
                role: "Staff",
            },
            {
                id: "user6",
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
            },
        ]);
    });

    it("fetches users with shared relatedProperties for Staff user", async () => {
        const mockReq: CallableRequest<FetchUsersByRoleRequestData> = {
            auth: { uid: "user1", token: { role: Role.STAFF } as any },
            data: { organisationId: "org1" },
            rawRequest: {} as any,
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: "user1",
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
            },
            {
                id: "user2",
                name: "user2",
                relatedProperties: ["prop2", "prop3"],
                role: "Hostess",
            },
        ]);
    });

    it("fetches users with shared relatedProperties for Hostess user", async () => {
        const mockReq: CallableRequest<FetchUsersByRoleRequestData> = {
            auth: { uid: "user2", token: { role: Role.HOSTESS } as any },
            data: { organisationId: "org1" },
            rawRequest: {} as any,
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: "user1",
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
            },
            {
                id: "user2",
                name: "user2",
                role: "Hostess",
                relatedProperties: ["prop2", "prop3"],
            },
            {
                id: "user3",
                name: "user3",
                role: "Staff",
                relatedProperties: ["prop3"],
            },
            {
                id: "user6",
                name: "user6",
                relatedProperties: ["prop2", "prop5"],
                role: "Manager",
            },
        ]);
    });

    it("returns an empty array if the user has no related properties", async () => {
        const mockReq = {
            auth: { uid: "user5", token: { role: Role.STAFF } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([]);
    });

    it("fetches users with shared relatedProperties for Manager user", async () => {
        const mockReq = {
            auth: { uid: "user6", token: { role: Role.MANAGER } as any },
            data: { organisationId: "org1" },
        } as CallableRequest<FetchUsersByRoleRequestData>;

        const users = await fetchUsersByRoleFn(mockReq);
        expect(users).toEqual([
            {
                id: "user1",
                name: "user1",
                role: "Staff",
                relatedProperties: ["prop1", "prop2"],
            },
            {
                id: "user2",
                name: "user2",
                role: "Hostess",
                relatedProperties: ["prop2", "prop3"],
            },
            {
                id: "user6",
                name: "user6",
                role: "Manager",
                relatedProperties: ["prop2", "prop5"],
            },
        ]);
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
