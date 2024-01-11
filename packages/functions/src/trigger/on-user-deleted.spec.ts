import { onUserDeletedFn } from "./on-user-deleted.js";
import { MockFirestore, MockWriteBatch } from "../../test-helpers/MockFirestore.js";
import * as Init from "../init.js";
import { getPropertiesPath } from "../paths.js";
import { describe, it, beforeEach, expect, vi } from "vitest";

describe("onUserDeletedFn Function", () => {
    let db: MockFirestore;
    const organisationId = "org1";
    const userId = "user1";

    beforeEach(() => {
        db = new MockFirestore();
        vi.spyOn(Init, "db", "get").mockReturnValue(db as any);
    });

    it("should remove user ID from relatedUsers in properties", async () => {
        // Setup: Create properties with relatedUsers containing userId
        const propertiesRef = db.collection(getPropertiesPath(organisationId));
        const property1Ref = propertiesRef.doc("property1");
        await property1Ref.set({ relatedUsers: [userId, "user2"] });
        const property2Ref = propertiesRef.doc("property2");
        await property2Ref.set({ relatedUsers: [userId] });

        // Test: Call onUserDeletedFn function
        await onUserDeletedFn({ userId, organisationId });

        // Assert: Check that userId is removed from relatedUsers
        const property1Snapshot = await property1Ref.get();
        const property2Snapshot = await property2Ref.get();
        expect(property1Snapshot.data()?.relatedUsers).not.toContain(userId);
        expect(property2Snapshot.data()?.relatedUsers).not.toContain(userId);
    });

    it("should not throw an error if no properties are associated with the user", async () => {
        // Setup: Create a property without the user in relatedUsers
        const propertiesRef = db.collection(getPropertiesPath(organisationId));
        const propertyRef = propertiesRef.doc("property1");
        await propertyRef.set({ relatedUsers: ["user2", "user3"] });

        // Test & Assert: Expect no error thrown
        await expect(onUserDeletedFn({ userId, organisationId })).resolves.not.toThrow();
    });

    it("should handle errors correctly", async () => {
        // Setup: Create properties and simulate a database operation failure
        vi.spyOn(MockWriteBatch.prototype, "commit").mockRejectedValue(
            new Error("Simulated database error"),
        );

        // Test & Assert: Expect the function to throw an error
        await expect(onUserDeletedFn({ userId, organisationId })).rejects.toThrow(
            "Error cleaning up data for user user1",
        );
    });
});
