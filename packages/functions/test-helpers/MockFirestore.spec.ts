import { MockFieldValue, MockFirestore } from "./MockFirestore.js";
import { describe, it, expect } from "vitest";

describe("MockFirestore", () => {
    let db: MockFirestore;

    beforeEach(() => {
        db = new MockFirestore();
    });

    describe("collection method", () => {
        it("should return a valid collection reference", () => {
            const collectionRef = db.collection("testCollection");
            expect(collectionRef).toBeDefined();
        });

        it("should handle invalid collection path", () => {
            expect(() => {
                db.collection("invalidCollectionPath/testDoc");
            }).toThrow("Invalid collection path");
        });
    });

    describe("doc method", () => {
        it("should return a valid document reference", () => {
            const docRef = db.doc("testCollection/testDoc");
            expect(docRef).toBeDefined();
            expect(docRef.getId()).toBe("testDoc");
        });

        it("should throw an error for invalid document path", () => {
            expect(() => {
                db.doc("testCollection");
            }).toThrow("Document path must point to a document, not a collection.");
        });
    });

    describe("add method", () => {
        it("should add a document to a collection", async () => {
            const collectionRef = db.collection("testCollection");
            const newDocRef = await collectionRef.add({ key: "value" });

            expect(newDocRef).toBeDefined();
            const snapshot = await newDocRef.get();
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data?.()).toEqual({ key: "value" });
        });
    });

    describe("set method", () => {
        it("should set and get document data correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key: "value" });

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data?.()).toEqual({ key: "value" });
        });
    });

    describe("transaction method", () => {
        it("should handle transactions correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            await db.runTransaction(async (transaction) => {
                transaction.set(docRef, { key: "value" });
                const tempSnapshot = await transaction.get(docRef);
                expect(tempSnapshot.exists).toBe(true);
                expect(tempSnapshot.data?.()).toEqual({ key: "value" });
            });

            const finalSnapshot = await docRef.get();
            expect(finalSnapshot.exists).toBe(true);
            expect(finalSnapshot.data?.()).toEqual({ key: "value" });
        });
    });

    describe("delete method", () => {
        it("should delete a document correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key: "value" });

            await docRef.delete();

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(false);
        });
    });

    describe("update method", () => {
        it("should update a document correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key: "value" });

            await docRef.update({ key: "newValue" });

            const snapshot = await docRef.get();
            expect(snapshot.data?.()).toEqual({ key: "newValue" });
        });

        it("should handle nested fields update using dot notation", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ nested: { key: "value" } });

            await docRef.update({ "nested.key": "newValue" });

            const snapshot = await docRef.get();
            expect(snapshot.data?.()).toEqual({ nested: { key: "newValue" } });
        });

        it("should handle updating non-existent documents", async () => {
            const docRef = db.collection("testCollection").doc("nonExistentDoc");
            await docRef.update({ key: "newValue" });

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data?.()).toEqual({ key: "newValue" });
        });
    });

    describe("non-existent document handling", () => {
        it("should handle non-existent document correctly", async () => {
            const docRef = db.collection("testCollection").doc("nonExistentDoc");

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(false);
        });
    });

    describe("MockFieldValue functionality", () => {
        it("should handle arrayUnion operation correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ arrayField: ["initialValue"] });

            await docRef.update({
                arrayField: MockFieldValue.arrayUnion("newValue"),
            });

            const snapshot = await docRef.get();
            expect(snapshot.data?.()?.arrayField).toContain("initialValue");
            expect(snapshot.data?.()?.arrayField).toContain("newValue");
        });

        it("should handle arrayRemove operation correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ arrayField: ["valueToRemove", "valueToKeep"] });

            await docRef.update({
                arrayField: MockFieldValue.arrayRemove("valueToRemove"),
            });

            const snapshot = await docRef.get();
            expect(snapshot.data?.()?.arrayField).not.toContain("valueToRemove");
            expect(snapshot.data?.()?.arrayField).toContain("valueToKeep");
        });

        it("should not add duplicate values with arrayUnion", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ arrayField: ["value"] });

            await docRef.update({
                arrayField: MockFieldValue.arrayUnion("value"),
            });

            const snapshot = await docRef.get();
            expect(snapshot.data?.()?.arrayField).toEqual(["value"]);
        });

        it("should not fail on arrayRemove when value not present", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ arrayField: ["value"] });

            await docRef.update({
                arrayField: MockFieldValue.arrayRemove("nonExistingValue"),
            });

            const snapshot = await docRef.get();
            expect(snapshot.data?.()?.arrayField).toEqual(["value"]);
        });
    });
});
