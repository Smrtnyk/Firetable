import { MockFieldPath, MockFieldValue, MockFirestore } from "./MockFirestore.js";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";

describe("MockFirestore", () => {
    let db: MockFirestore;

    beforeEach(() => {
        db = new MockFirestore();
    });

    describe("Batch Operations", () => {
        it("should fail to commit a batch with an update on a non-existent document", async () => {
            const docRef1 = db.collection("testCollection").doc("doc1");
            const docRef2 = db.collection("testCollection").doc("doc2");

            // Start a batch
            const batch = db.batch();

            // Queue operations
            batch.set(docRef1, { key: "value1" });
            // doc2 doesn't exist
            batch.update(docRef2, { key: "newValue" });
            batch.delete(docRef2);

            // Commit batch and expect it to fail
            await expect(batch.commit()).rejects.toThrowError(
                /No document to update: Document at path 'testCollection\/doc2' does not exist/,
            );

            // Verify that no operations were applied
            const snapshot1 = await docRef1.get();
            // Since batch failed, doc1 should not exist
            expect(snapshot1.exists).toBe(false);

            const snapshot2 = await docRef2.get();
            expect(snapshot2.exists).toBe(false);
        });

        it("should commit a batch of write operations", async () => {
            const docRef1 = db.collection("testCollection").doc("doc1");
            const docRef2 = db.collection("testCollection").doc("doc2");

            // Ensure doc2 exists before the batch
            await docRef2.set({ key: "initialValue" });

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
            expect(snapshot2.exists).toBe(false); // doc2 was deleted in the batch
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

        it("should merge data when merge option is true", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key1: "value1", key2: "value2" });

            await docRef.set({ key2: "newValue2", key3: "value3" }, { merge: true });

            const snapshot = await docRef.get();
            expect(snapshot.data()).toEqual({
                key1: "value1",
                key2: "newValue2",
                key3: "value3",
            });
        });

        it("should overwrite data when merge option is false", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key1: "value1", key2: "value2" });

            await docRef.set({ key2: "newValue2", key3: "value3" });

            const snapshot = await docRef.get();
            expect(snapshot.data()).toEqual({
                key2: "newValue2",
                key3: "value3",
            });
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

        it("should create a new document in a transaction", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            // eslint-disable-next-line require-await -- transaction wants async function
            await db.runTransaction(async (transaction) => {
                transaction.create(docRef, { key: "value" });
            });

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data()).toEqual({ key: "value" });
        });

        it("should fail to create a document that already exists", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key: "value" });

            await expect(
                // eslint-disable-next-line require-await -- transaction wants async function
                db.runTransaction(async (transaction) => {
                    transaction.create(docRef, { key: "newValue" });
                }),
            ).rejects.toThrow("Document already exists");

            const snapshot = await docRef.get();
            expect(snapshot.data()).toEqual({ key: "value" });
        });

        it("should delete a document in a transaction", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key: "value" });
            // eslint-disable-next-line require-await -- transaction wants async function
            await db.runTransaction(async (transaction) => {
                transaction.delete(docRef);
            });

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(false);
        });

        it("should handle MockFieldValue operations in transactions", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ counter: 1 });
            // eslint-disable-next-line require-await -- transaction wants async function
            await db.runTransaction(async (transaction) => {
                transaction.update(docRef, {
                    counter: MockFieldValue.increment(5),
                });
            });

            const snapshot = await docRef.get();
            expect(snapshot.data()?.counter).toBe(6);
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

        it("should throw an error when updating a non-existent document", async () => {
            const docRef = db.collection("testCollection").doc("nonExistentDoc");
            await expect(docRef.update({ key: "newValue" })).rejects.toThrowError(
                /No document to update/,
            );

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(false);
        });

        it("should update nested fields using field paths", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ nested: { field1: "value1", field2: "value2" } });

            const fieldPath = MockFieldPath.fromSegments("nested", "field2");
            await docRef.update({ [fieldPath.toString()]: "newValue2" });

            const snapshot = await docRef.get();
            expect(snapshot.data()).toEqual({
                nested: { field1: "value1", field2: "newValue2" },
            });
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

        it("should handle increment operation correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ counter: 1 });

            await docRef.update({
                counter: MockFieldValue.increment(2),
            });

            const snapshot = await docRef.get();
            expect(snapshot.data()?.counter).toBe(3);
        });

        it("should handle serverTimestamp operation correctly", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ updatedAt: null });

            await docRef.update({
                updatedAt: MockFieldValue.serverTimestamp(),
            });

            const snapshot = await docRef.get();
            expect(snapshot.data()?.updatedAt).toBeInstanceOf(Timestamp);
        });
    });

    describe("MockFieldPath functionality", () => {
        it("should create a field path from segments", () => {
            const fieldPath = MockFieldPath.fromSegments("nested", "field");
            expect(fieldPath.toString()).toBe("nested.field");
        });

        it("should use field path in queries", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ nested: { field: "value" } });

            const fieldPath = MockFieldPath.fromSegments("nested", "field");
            const querySnapshot = await db
                .collection("testCollection")
                .where(fieldPath, "==", "value")
                .get();

            expect(querySnapshot.docs).toHaveLength(1);
            expect(querySnapshot.docs[0].data()).toEqual({ nested: { field: "value" } });
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

        it("should filter documents using 'where' with '<' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ number: 1 });
            await collectionRef.doc("doc2").set({ number: 2 });
            await collectionRef.doc("doc3").set({ number: 3 });

            // Test '<' operator
            const querySnapshot = await collectionRef.where("number", "<", 3).get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents with number less than 3
            expect(documents).toHaveLength(2);
            expect(documents.some((doc) => doc.number === 1)).toBe(true);
            expect(documents.some((doc) => doc.number === 2)).toBe(true);
        });

        it("should filter documents using 'where' with '!=' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ status: "active" });
            await collectionRef.doc("doc2").set({ status: "inactive" });

            // Test '!=' operator
            const querySnapshot = await collectionRef.where("status", "!=", "active").get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents where status is not 'active'
            expect(documents).toHaveLength(1);
            expect(documents[0].status).toBe("inactive");
        });

        it("should filter documents using 'where' with 'array-contains-any' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ tags: ["tag1", "tag2"] });
            await collectionRef.doc("doc2").set({ tags: ["tag2", "tag3"] });
            await collectionRef.doc("doc3").set({ tags: ["tag4"] });

            // Test 'array-contains-any' operator
            const querySnapshot = await collectionRef
                .where("tags", "array-contains-any", ["tag1", "tag4"])
                .get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents that have either 'tag1' or 'tag4'
            expect(documents).toHaveLength(2);
            expect(documents.some((doc) => doc.tags.includes("tag1"))).toBe(true);
            expect(documents.some((doc) => doc.tags.includes("tag4"))).toBe(true);
        });

        it("should filter documents using 'where' with 'not-in' operator", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ status: "active" });
            await collectionRef.doc("doc2").set({ status: "inactive" });
            await collectionRef.doc("doc3").set({ status: "pending" });

            // Test 'not-in' operator
            const querySnapshot = await collectionRef.where("status", "not-in", ["inactive"]).get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents where status is not 'inactive'
            expect(documents).toHaveLength(2);
            expect(documents.some((doc) => doc.status === "active")).toBe(true);
            expect(documents.some((doc) => doc.status === "pending")).toBe(true);
        });

        it("should paginate documents using 'startAt' and 'endAt'", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            for (let i = 1; i <= 5; i++) {
                await collectionRef.doc(`doc${i}`).set({ number: i });
            }

            // Order documents by 'number'
            const query = collectionRef.orderBy("number");

            // Start at number 2, end at number 4
            const querySnapshot = await query.startAt(2).endAt(4).get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents with number 2, 3, 4
            expect(documents).toHaveLength(3);
            expect(documents.map((doc) => doc.number)).toEqual([2, 3, 4]);
        });

        it("should paginate documents using 'startAfter' and 'limitToLast'", async () => {
            // Setup
            const collectionRef = db.collection("testCollection");
            for (let i = 1; i <= 5; i++) {
                await collectionRef.doc(`doc${i}`).set({ number: i });
            }

            // Order documents by 'number'
            const query = collectionRef.orderBy("number");

            // Get last 2 documents after number 2
            const querySnapshot = await query.startAfter(2).limitToLast(2).get();
            const documents = querySnapshot.docs.map((doc) => doc.data());

            // Expect documents with number 4, 5
            expect(documents).toHaveLength(2);
            expect(documents.map((doc) => doc.number)).toEqual([4, 5]);
        });

        it("should query documents with nested fields", async () => {
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ nested: { status: "active" } });
            await collectionRef.doc("doc2").set({ nested: { status: "inactive" } });

            const querySnapshot = await collectionRef.where("nested.status", "==", "active").get();

            const documents = querySnapshot.docs.map((doc) => doc.data());

            expect(documents).toHaveLength(1);
            expect(documents[0]).toEqual({ nested: { status: "active" } });
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

    describe("onSnapshot method", () => {
        it("should call onNext immediately with current data", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ key: "value" });

            const onNext = vi.fn();
            const unsubscribe = docRef.onSnapshot(onNext);

            // Wait for any asynchronous operations
            await new Promise(process.nextTick);

            expect(onNext).toHaveBeenCalled();
            const snapshot = onNext.mock.calls[0][0];
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data()).toEqual({ key: "value" });

            unsubscribe();
        });

        it("should receive updates when data changes", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            const onNext = vi.fn();
            const unsubscribe = docRef.onSnapshot(onNext);

            // Wait for any asynchronous operations
            await new Promise(process.nextTick);

            // Initially, the document does not exist
            let snapshot = onNext.mock.calls[0][0];
            expect(snapshot.exists).toBe(false);

            // Set data
            await docRef.set({ key: "value" });
            await new Promise(process.nextTick);

            // Should have been called again
            expect(onNext).toHaveBeenCalledTimes(2);
            snapshot = onNext.mock.calls[1][0];
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data()).toEqual({ key: "value" });

            // Update data
            await docRef.update({ key: "newValue" });
            await new Promise(process.nextTick);

            expect(onNext).toHaveBeenCalledTimes(3);
            snapshot = onNext.mock.calls[2][0];
            expect(snapshot.data()).toEqual({ key: "newValue" });

            // Delete document
            await docRef.delete();
            await new Promise(process.nextTick);

            expect(onNext).toHaveBeenCalledTimes(4);
            snapshot = onNext.mock.calls[3][0];
            expect(snapshot.exists).toBe(false);

            unsubscribe();
        });
    });
});
