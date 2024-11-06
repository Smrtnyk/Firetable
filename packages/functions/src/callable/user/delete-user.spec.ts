import type { CallableRequest } from "firebase-functions/v2/https";
import { deleteUser } from "./delete-user.js";
import { getUserPath, getUsersPath } from "../../paths.js";
import * as Init from "../../init.js";
import { MockAuth } from "../../../test-helpers/MockAuth.js";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { AdminRole } from "@shared-types";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("deleteUser", () => {
    let mockAuth: MockAuth;
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        mockAuth = new MockAuth();
        mockFirestore = new MockFirestore();
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
    });

    it("should delete a user from both Auth and Firestore", async () => {
        const testUserId = "user123";
        const testOrgId = "org456";
        const email = "test@example.com";

        // Create a user in Auth
        const { uid } = await Init.auth.createUser({ email, password: "password" });
        // Create a user in Firestore
        const usersPath = getUsersPath(testOrgId);
        const userDocRef = mockFirestore.collection(usersPath).doc(uid);
        await userDocRef.set({
            email,
            organisationId: testOrgId,
            name: "Test User",
            role: AdminRole.ADMIN,
            username: "test",
        });

        const req: CallableRequest = {
            auth: { uid } as any,
            data: { id: uid, organisationId: testOrgId },
            rawRequest: {} as any,
        };

        await deleteUser(req);

        expect(() => mockAuth.getUserByEmail("test@example.com")).toThrow();
        expect(mockFirestore.getDataAtPath(getUserPath(testOrgId, testUserId))).toBeUndefined();
    });

    it("should handle non-existent user in Firestore", async () => {
        const testOrgId = "org456";

        // Create a user in Auth but not in Firestore
        const { uid } = await mockAuth.createUser({
            email: "test@example.com",
            password: "password",
        });

        // Mocking CallableRequest for a user that doesn't exist in Firestore
        const req: CallableRequest = {
            auth: { uid } as any,
            data: { id: uid, organisationId: testOrgId },
            rawRequest: {} as any,
        };

        await deleteUser(req);

        expect(() => mockAuth.getUserByEmail("test@example.com")).toThrow();
    });
});
