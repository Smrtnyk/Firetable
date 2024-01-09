import { MockFirestore } from "./MockFirestore.js";
import { describe, it, expect } from "vitest";

describe("MockFirestore", () => {
    it("should set and get document data correctly", async () => {
        const db = new MockFirestore();
        const docRef = db.collection("testCollection").doc("testDoc");
        await docRef.set({ key: "value" });

        const snapshot = await docRef.get();
        expect(snapshot.exists).toBe(true);
        expect(snapshot.data?.()).toEqual({ key: "value" });
    });

    it("should handle transactions correctly", async () => {
        const db = new MockFirestore();
        const docRef = db.collection("testCollection").doc("testDoc");

        await db.runTransaction(async (transaction) => {
            transaction.set(docRef, { key: "value" });
            const tempSnapshot = await transaction.get(docRef);
            expect(tempSnapshot.exists).toBe(true);
            expect(tempSnapshot.data?.()).toEqual({ key: "value" }); // Data should be visible within the transaction
        });

        const finalSnapshot = await docRef.get();
        expect(finalSnapshot.exists).toBe(true);
        expect(finalSnapshot.data?.()).toEqual({ key: "value" }); // Data should be visible after the transaction commits
    });
});
