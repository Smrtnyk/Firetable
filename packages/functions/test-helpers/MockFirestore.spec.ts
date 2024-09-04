import { MockFieldPath, MockFieldValue, MockFirestore } from "./MockFirestore.js";
import { describe, it, expect } from "vitest";

describe("MockFirestore", () => {
    let db: MockFirestore;

    beforeEach(() => {
        db = new MockFirestore();
    });

    describe("Batch Operations", () => {
        it("should commit a batch of write operations", async () => {
            const docRef1 = db.collection("testCollection").doc("doc1");
            const docRef2 = db.collection("testCollection").doc("doc2");

            // Start a batch
            const batch = db.batch();

            // Queue operations
            batch.set(docRef1, { key: "value1" });
            batch.update(docRef2, { key: "newValue" });
            batch.delete(docRef2);

            // Commit batch
            await batch.commit();

            // Verify operations
            const snapshot1 = await docRef1.get();
            expect(snapshot1.exists).toBe(true);
            expect(snapshot1.data?.()).toEqual({ key: "value1" });

            const snapshot2 = await docRef2.get();
            expect(snapshot2.exists).toBe(false);
        });
    });

    describe("List Collections and Documents", () => {
        it("should list all documents in a collection", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ key: "value1" });
            await collectionRef.doc("doc2").set({ key: "value2" });

            // Test
            const docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(2);
            expect(docs.map((doc) => doc.id)).toEqual(["doc1", "doc2"]);
        });

        it("should list all subcollections of a document", async () => {
            // Setup
            const docRef = db.collection("testCollection").doc("doc1");
            await docRef.collection("subCollection1").doc("subDoc1").set({ key: "value1" });
            await docRef.collection("subCollection2").doc("subDoc2").set({ key: "value2" });

            // Test
            const collections = await docRef.listCollections();
            expect(collections).toHaveLength(2);
            expect(collections.map((coll) => coll.path)).toEqual([
                "testCollection/doc1/subCollection1",
                "testCollection/doc1/subCollection2",
            ]);
        });
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
            expect(docRef.id).toBe("testDoc");
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

    describe("Query functionality", () => {
        it("should filter documents using 'where' with '==' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ status: "active" });
            await collectionRef.doc("doc2").set({ status: "inactive" });

            // Test '==' operator
            const querySnapshot = await collectionRef.where("status", "==", "active").get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect only the active document
            expect(documents).toHaveLength(1);
            expect(documents[0].status).toBe("active");
        });

        it("should filter documents using 'where' with 'array-contains' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ tags: ["tag1", "tag2"] });
            await collectionRef.doc("doc2").set({ tags: ["tag2", "tag3"] });

            // Test 'array-contains' operator
            const querySnapshot = await collectionRef.where("tags", "array-contains", "tag1").get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect only the document with "tag1"
            expect(documents).toHaveLength(1);
            expect(documents[0].tags).toContain("tag1");
        });

        it("should filter documents using 'where' with 'in' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ status: "active" });
            await collectionRef.doc("doc2").set({ status: "inactive" });
            await collectionRef.doc("doc3").set({ status: "pending" });

            // Test 'in' operator
            const querySnapshot = await collectionRef
                .where("status", "in", ["active", "pending"])
                .get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents with "active" or "pending" status
            expect(documents).toHaveLength(2);
            expect(documents.some((doc) => doc.status === "active")).toBe(true);
            expect(documents.some((doc) => doc.status === "pending")).toBe(true);
        });

        it("should limit the number of documents returned", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            for (let i = 0; i < 5; i += 1) {
                await collectionRef.doc(`doc${i}`).set({ number: i });
            }

            // Test 'limit'
            const querySnapshot = await collectionRef.limit(3).get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect only 3 documents
            expect(documents).toHaveLength(3);
        });

        it("should handle 'FieldPath.documentId' in 'where' query", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ status: "active" });
            await collectionRef.doc("doc2").set({ status: "inactive" });

            // Test MockFieldPath.documentId()
            const querySnapshot = await collectionRef
                .where(MockFieldPath.documentId(), "in", ["doc1"])
                .get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect only the document with ID "doc1"
            expect(documents).toHaveLength(1);
            expect(documents[0].status).toBe("active");
        });
    });

    describe("Complex queries combining 'where' and 'limit'", () => {
        it("should apply multiple 'where' constraints correctly", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ status: "active", priority: 1 });
            await collectionRef.doc("doc2").set({ status: "active", priority: 2 });
            await collectionRef.doc("doc3").set({ status: "inactive", priority: 1 });

            // Test multiple 'where' constraints
            const querySnapshot = await collectionRef
                .where("status", "==", "active")
                .where("priority", "==", 1)
                .get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect only the document with status "active" and priority 1
            expect(documents).toHaveLength(1);
            expect(documents[0].status).toBe("active");
            expect(documents[0].priority).toBe(1);
        });

        it("should combine 'where' and 'limit' constraints correctly", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            for (let i = 0; i < 5; i += 1) {
                await collectionRef.doc(`doc${i}`).set({ status: "active", number: i });
            }

            // Test 'where' combined with 'limit'
            const querySnapshot = await collectionRef
                .where("status", "==", "active")
                .limit(3)
                .get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect 3 documents with status "active"
            expect(documents).toHaveLength(3);
            expect(documents.every((doc) => doc.status === "active")).toBe(true);
        });
    });
});
