import type { CallableRequest } from "firebase-functions/v2/https";
import { getUserPath, getUsersPath } from "../../paths.js";
import * as Init from "../../init.js";
import { ADMIN } from "../../../types/types.js";
import { MockAuth } from "../../../test-helpers/MockAuth.js";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { deleteUser } from "./index.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("deleteUser", () => {
    beforeEach(() => {
        vi.spyOn(Init, "auth", "get").mockReturnValue(new MockAuth());
        vi.spyOn(Init, "db", "get").mockReturnValue(new MockFirestore());
    });

    it("should delete a user from both Auth and Firestore", async () => {
        const testUserId = "user123";
        const testOrgId = "org456";
        const email = "test@example.com";

        // Create a user in Auth
        await Init.auth.createUser({ uid: testUserId, email });
        // Create a user in Firestore
        const usersPath = getUsersPath(testOrgId);
        const userDocRef = Init.db.collection(usersPath).doc(testUserId);
        await userDocRef.set({
            email,
            organisationId: testOrgId,
            name: "Test User",
            role: ADMIN,
            username: "test",
        });

        const req: CallableRequest = {
            auth: { uid: testUserId },
            data: { id: testUserId, organisationId: testOrgId },
        };

        await deleteUser(req);

        expect(Init.auth.getUserByEmail("test@example.com")).toBeNull();
        expect(Init.db.getDataAtPath(getUserPath(testOrgId, testUserId))).toBeUndefined();
    });

    it("should handle non-existent user in Firestore", async () => {
        const testUserId = "user123";
        const testOrgId = "org456";

        // Create a user in Auth but not in Firestore
        await Init.auth.createUser({ uid: testUserId, email: "test@example.com" });

        // Mocking CallableRequest for a user that doesn't exist in Firestore
        const req: CallableRequest = {
            auth: { uid: testUserId },
            data: { id: testUserId, organisationId: testOrgId },
        };

        await deleteUser(req);

        // Assert user is deleted from Auth
        expect(Init.auth.getUserByEmail("test@example.com")).toBeNull();

        // TODO: Assert no error is thrown for non-existent Firestore user
    });
});
