import { MockFirestore } from "./MockFirestore.js";
import { describe, it, expect } from "vitest";

describe("MockFirestore", () => {
    it("should set and get document data correctly", () => {
        const db = new MockFirestore();
        const docRef = db.collection("testCollection").doc("testDoc");
        docRef.set({ key: "value" });
        const data = docRef.get();
        expect(data).toEqual({ key: "value" });
    });

    it("should handle transactions correctly", async () => {
        const db = new MockFirestore();
        const docRef = db.collection("testCollection").doc("testDoc");

        await db.runTransaction(async (transaction) => {
            transaction.set(docRef, { key: "value" });
            const tempData = transaction.get(docRef);
            expect(tempData).toEqual({ key: "value" }); // Data should be visible within the transaction
        });

        const data = docRef.get();
        expect(data).toEqual({ key: "value" }); // Data should be visible after the transaction commits
    });
});
