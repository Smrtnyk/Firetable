import type { FirestoreDataConverter } from "firebase-admin/firestore";
import {
    FirestoreError,
    MockFieldPath,
    MockFieldValue,
    MockFirestore,
    MockWriteResult,
} from "./MockFirestore.js";
import { Timestamp } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setTimeout } from "node:timers/promises";

describe("MockFirestore", () => {
    let db: MockFirestore;

    beforeEach(() => {
        vi.restoreAllMocks();
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
            // doc2 was deleted in the batch
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
        it("should fail the transaction after maximum retries due to conflicts", async () => {
            const docRef = db.doc("testCollection/doc1");
            await docRef.set({ counter: 1 });

            // Start a transaction
            await expect(
                db.runTransaction(async (transaction) => {
                    const snapshot = await transaction.get(docRef);

                    // Modify the document outside the transaction
                    await docRef.update({ counter: 2 });

                    // Attempt to update the document within the transaction
                    transaction.update(docRef, { counter: snapshot.data().counter + 1 });
                }),
            ).rejects.toHaveProperty("code", "aborted");
        });

        it("should retry transaction when a conflict occurs", async () => {
            const docRef = db.doc("testCollection/doc1");
            await docRef.set({ counter: 1 });

            let attempt = 0;
            await db.runTransaction(async (transaction) => {
                attempt += 1;
                const snapshot = await transaction.get(docRef);

                // Simulate external update on the first attempt
                if (attempt === 1) {
                    await docRef.update({ counter: 2 });
                }

                transaction.update(docRef, { counter: snapshot.data().counter + 1 });
            });

            const finalSnapshot = await docRef.get();
            expect(finalSnapshot.data().counter).toBe(3);
            // Transaction retried once
            expect(attempt).toBe(2);
        });

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
        it("should correctly set 'empty' and 'size' properties based on the docs array", async () => {
            const collectionRef = db.collection("testCollection");

            // Test when the collection has no documents
            let querySnapshot = await collectionRef.get();
            expect(querySnapshot.empty).toBe(true);
            expect(querySnapshot.size).toBe(0);
            expect(querySnapshot.docs).toHaveLength(0);

            // Add a document to the collection
            await collectionRef.doc("doc1").set({ key: "value1" });

            // Test after adding one document
            querySnapshot = await collectionRef.get();
            expect(querySnapshot.empty).toBe(false);
            expect(querySnapshot.size).toBe(1);
            expect(querySnapshot.docs).toHaveLength(1);

            // Add another document
            await collectionRef.doc("doc2").set({ key: "value2" });

            // Test after adding a second document
            querySnapshot = await collectionRef.get();
            expect(querySnapshot.empty).toBe(false);
            expect(querySnapshot.size).toBe(2);
            expect(querySnapshot.docs).toHaveLength(2);
        });

        it("should correctly reflect 'empty' and 'size' after applying query filters", async () => {
            const collectionRef = db.collection("testCollection");

            // Add documents with different statuses
            await collectionRef.doc("doc1").set({ status: "active" });
            await collectionRef.doc("doc2").set({ status: "inactive" });
            await collectionRef.doc("doc3").set({ status: "pending" });

            // Query documents with status 'archived' (no documents should match)
            let querySnapshot = await collectionRef.where("status", "==", "archived").get();
            expect(querySnapshot.empty).toBe(true);
            expect(querySnapshot.size).toBe(0);
            expect(querySnapshot.docs).toHaveLength(0);

            // Query documents with status 'active' (one document should match)
            querySnapshot = await collectionRef.where("status", "==", "active").get();
            expect(querySnapshot.empty).toBe(false);
            expect(querySnapshot.size).toBe(1);
            expect(querySnapshot.docs).toHaveLength(1);
        });

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

        describe("offset method", () => {
            it("should skip the specified number of documents", async () => {
                const collectionRef = db.collection("testCollection");
                for (let i = 1; i <= 5; i++) {
                    await collectionRef.doc(`doc${i}`).set({ number: i });
                }

                const querySnapshot = await collectionRef.orderBy("number").offset(2).get();
                const numbers = querySnapshot.docs.map((doc) => doc.data().number);

                expect(numbers).toEqual([3, 4, 5]);
            });

            it("should throw an error for negative offset", () => {
                expect(() => {
                    db.collection("testCollection").offset(-1);
                }).toThrowError(
                    new FirestoreError("invalid-argument", "Offset must not be negative"),
                );
            });
        });

        describe("limitToLast method", () => {
            it("should return the last N documents according to the ordering", async () => {
                const collectionRef = db.collection("testCollection");
                for (let i = 1; i <= 5; i++) {
                    await collectionRef.doc(`doc${i}`).set({ number: i });
                }

                const querySnapshot = await collectionRef.orderBy("number").limitToLast(2).get();
                const numbers = querySnapshot.docs.map((doc) => doc.data().number);

                expect(numbers).toEqual([4, 5]);
            });

            it("should throw an error for non-positive limit", () => {
                expect(() => {
                    db.collection("testCollection").limitToLast(0);
                }).toThrowError(new FirestoreError("invalid-argument", "Limit must be positive"));
            });
        });

        describe("Multiple orderBy fields", () => {
            it("should order documents based on multiple fields", async () => {
                const collectionRef = db.collection("testCollection");

                await collectionRef.add({ category: "A", score: 2 });
                await collectionRef.add({ category: "A", score: 1 });
                await collectionRef.add({ category: "B", score: 3 });
                await collectionRef.add({ category: "B", score: 2 });

                const querySnapshot = await collectionRef
                    .orderBy("category", "asc")
                    .orderBy("score", "desc")
                    .get();

                const results = querySnapshot.docs.map((doc) => doc.data());

                expect(results).toEqual([
                    { category: "A", score: 2 },
                    { category: "A", score: 1 },
                    { category: "B", score: 3 },
                    { category: "B", score: 2 },
                ]);
            });
        });

        describe("stream method", () => {
            it("should stream query results", async () => {
                const collectionRef = db.collection("testCollection");
                await collectionRef.add({ key: "value1" });
                await collectionRef.add({ key: "value2" });

                const query = collectionRef;
                const results: any[] = [];
                for await (const doc of query.stream()) {
                    results.push(doc.data());
                }

                expect(results).toHaveLength(2);
                expect(results).toContainEqual({ key: "value1" });
                expect(results).toContainEqual({ key: "value2" });
            });
        });

        describe("count method", () => {
            it("should return the count of documents", async () => {
                const collectionRef = db.collection("testCollection");
                await collectionRef.add({ key: "value1" });
                await collectionRef.add({ key: "value2" });

                const countResult = await collectionRef.count();

                expect(countResult.count).toBe(2);
            });
        });

        describe("aggregate method", () => {
            it("should perform aggregations on query results", async () => {
                const collectionRef = db.collection("orders");
                await collectionRef.add({ amount: 100 });
                await collectionRef.add({ amount: 200 });
                await collectionRef.add({ amount: 150 });

                const aggregationResult = await collectionRef.aggregate([
                    { key: "totalOrders", type: "count" },
                    { key: "totalAmount", type: "sum", field: "amount" },
                    { key: "averageAmount", type: "avg", field: "amount" },
                ]);

                expect(aggregationResult.totalOrders).toBe(3);
                expect(aggregationResult.totalAmount).toBe(450);
                expect(aggregationResult.averageAmount).toBeCloseTo(150);
            });
        });

        describe("explain method", () => {
            it("should return query execution details", async () => {
                const query = db
                    .collection("testCollection")
                    .where("status", "==", "active")
                    .orderBy("createdAt");
                const explanation = await query.explain();

                expect(explanation).toHaveProperty("queryPlan");
                expect(explanation.queryPlan).toHaveProperty("path", "testCollection");
                expect(explanation.queryPlan).toHaveProperty("constraints");
                expect(explanation.queryPlan).toHaveProperty("orderBy");
            });
        });

        describe("select method", () => {
            it("should return documents with only selected fields", async () => {
                const collectionRef = db.collection("testCollection");
                await collectionRef.add({ name: "Alice", email: "alice@example.com", age: 30 });

                const query = collectionRef.select("name", "email");
                const querySnapshot = await query.get();
                const data = querySnapshot.docs[0].data();

                expect(data).toEqual({ name: "Alice", email: "alice@example.com" });
                expect(data).not.toHaveProperty("age");
            });
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
            await setTimeout(1);

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
            await setTimeout(1);

            // Initially, the document does not exist
            let snapshot = onNext.mock.calls[0][0];
            expect(snapshot.exists).toBe(false);

            // Set data
            await docRef.set({ key: "value" });
            await setTimeout(1);

            // Should have been called again
            expect(onNext).toHaveBeenCalledTimes(2);
            snapshot = onNext.mock.calls[1][0];
            expect(snapshot.exists).toBe(true);
            expect(snapshot.data()).toEqual({ key: "value" });

            // Update data
            await docRef.update({ key: "newValue" });
            await setTimeout(1);

            expect(onNext).toHaveBeenCalledTimes(3);
            snapshot = onNext.mock.calls[2][0];
            expect(snapshot.data()).toEqual({ key: "newValue" });

            // Delete document
            await docRef.delete();
            await setTimeout(1);

            expect(onNext).toHaveBeenCalledTimes(4);
            snapshot = onNext.mock.calls[3][0];
            expect(snapshot.exists).toBe(false);

            unsubscribe();
        });
    });

    describe("Document Timestamps", () => {
        it("should set createTime and updateTime correctly on document creation", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            const beforeCreate = Timestamp.now();
            await docRef.set({ key: "value" });
            const afterCreate = Timestamp.now();

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(true);
            expect(snapshot.createTime).toBeDefined();
            expect(snapshot.updateTime).toBeDefined();
            expect(snapshot.createTime).toEqual(snapshot.updateTime);
            expect(snapshot.createTime?.toMillis()).toBeGreaterThanOrEqual(beforeCreate.toMillis());
            expect(snapshot.createTime?.toMillis()).toBeLessThanOrEqual(afterCreate.toMillis());
        });

        it("should update updateTime on document update", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            await docRef.set({ key: "value" });
            const snapshotBeforeUpdate = await docRef.get();

            // Wait a little to ensure the timestamp is different
            await setTimeout(10);

            await docRef.update({ key: "newValue" });
            const snapshotAfterUpdate = await docRef.get();

            expect(snapshotAfterUpdate.createTime).toEqual(snapshotBeforeUpdate.createTime);
            expect(snapshotAfterUpdate.updateTime).not.toEqual(snapshotBeforeUpdate.updateTime);
            expect(snapshotAfterUpdate.updateTime?.toMillis()).toBeGreaterThan(
                snapshotBeforeUpdate.updateTime?.toMillis() ?? 0,
            );
        });

        it("should set createTime and updateTime correctly in QueryDocumentSnapshots", async () => {
            const collectionRef = db.collection("testCollection");
            await collectionRef.add({ key: "value" });

            const querySnapshot = await collectionRef.get();
            const docSnapshot = querySnapshot.docs[0];

            expect(docSnapshot.createTime).toBeDefined();
            expect(docSnapshot.updateTime).toBeDefined();
            expect(docSnapshot.createTime).toEqual(docSnapshot.updateTime);
        });
    });

    describe("Query onSnapshot", () => {
        it("should receive the initial snapshot immediately", async () => {
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ key: "value1" });

            const onNext = vi.fn();
            const unsubscribe = collectionRef.onSnapshot(onNext);

            // Wait for any asynchronous operations
            await setTimeout(1);

            expect(onNext).toHaveBeenCalled();
            const snapshot = onNext.mock.calls[0][0];
            expect(snapshot.docs).toHaveLength(1);
            expect(snapshot.docs[0].data()).toEqual({ key: "value1" });

            unsubscribe();
        });

        it("should receive updates when documents are added", async () => {
            const collectionRef = db.collection("testCollection");

            const onNext = vi.fn();
            const unsubscribe = collectionRef.onSnapshot(onNext);

            // Wait for any asynchronous operations
            await setTimeout(1);

            // Initially, the collection is empty
            let snapshot = onNext.mock.calls[0][0];
            expect(snapshot.docs).toHaveLength(0);

            // Add a document
            await collectionRef.doc("doc1").set({ key: "value1" });
            await setTimeout(1);

            // Should have been called again
            expect(onNext).toHaveBeenCalledTimes(2);
            snapshot = onNext.mock.calls[1][0];
            expect(snapshot.docs).toHaveLength(1);
            expect(snapshot.docs[0].data()).toEqual({ key: "value1" });

            // Check docChanges
            const changes = snapshot.docChanges();
            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe("added");
            expect(changes[0].doc.data()).toEqual({ key: "value1" });

            unsubscribe();
        });

        it("should receive updates when documents are modified", async () => {
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ key: "value1" });

            const onNext = vi.fn();
            const unsubscribe = collectionRef.onSnapshot(onNext);

            // Wait for any asynchronous operations
            await setTimeout(1);

            // Modify the document
            await collectionRef.doc("doc1").update({ key: "newValue" });
            await setTimeout(1);

            expect(onNext).toHaveBeenCalledTimes(2);
            const snapshot = onNext.mock.calls[1][0];
            expect(snapshot.docs).toHaveLength(1);
            expect(snapshot.docs[0].data()).toEqual({ key: "newValue" });

            // Check docChanges
            const changes = snapshot.docChanges();
            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe("modified");
            expect(changes[0].doc.data()).toEqual({ key: "newValue" });

            unsubscribe();
        });

        it("should receive updates when documents are removed", async () => {
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ key: "value1" });

            const onNext = vi.fn();
            const unsubscribe = collectionRef.onSnapshot(onNext);

            // Wait for any asynchronous operations
            await setTimeout(1);

            // Delete the document
            await collectionRef.doc("doc1").delete();
            await setTimeout(1);

            expect(onNext).toHaveBeenCalledTimes(2);
            const snapshot = onNext.mock.calls[1][0];
            expect(snapshot.docs).toHaveLength(0);

            // Check docChanges
            const changes = snapshot.docChanges();
            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe("removed");
            expect(changes[0].doc.id).toBe("doc1");

            unsubscribe();
        });
    });

    describe("isEqual method", () => {
        it("should correctly compare document snapshots using isEqual", async () => {
            const docRef = db.doc("testCollection/doc1");
            await docRef.set({ key: "value" });
            await setTimeout(1);
            const snapshot1 = await docRef.get();
            const snapshot2 = await docRef.get();

            expect(snapshot1.isEqual(snapshot2)).toBe(true);

            await docRef.update({ key: "newValue" });
            await setTimeout(1);

            const snapshot3 = await docRef.get();

            expect(snapshot1.isEqual(snapshot3)).toBe(false);
        });

        it("should correctly compare query snapshots using isEqual", async () => {
            const collectionRef = db.collection("testCollection");
            await collectionRef.doc("doc1").set({ key: "value1" });

            const snapshot1 = await collectionRef.get();
            const snapshot2 = await collectionRef.get();

            expect(snapshot1.isEqual(snapshot2)).toBe(true);

            await collectionRef.doc("doc2").set({ key: "value2" });
            const snapshot3 = await collectionRef.get();

            expect(snapshot1.isEqual(snapshot3)).toBe(false);
        });

        it("should correctly compare document references using isEqual", () => {
            const docRef1 = db.doc("testCollection/doc1");
            const docRef2 = db.doc("testCollection/doc1");
            const docRef3 = db.doc("testCollection/doc2");

            expect(docRef1.isEqual(docRef2)).toBe(true);
            expect(docRef1.isEqual(docRef3)).toBe(false);
        });

        it("should correctly compare field values using isEqual", () => {
            const increment1 = MockFieldValue.increment(1);
            const increment2 = MockFieldValue.increment(1);
            const increment3 = MockFieldValue.increment(2);

            expect(increment1.isEqual(increment2)).toBe(true);
            expect(increment1.isEqual(increment3)).toBe(false);

            const arrayUnion1 = MockFieldValue.arrayUnion("a", "b");
            const arrayUnion2 = MockFieldValue.arrayUnion("a", "b");
            const arrayUnion3 = MockFieldValue.arrayUnion("b", "a");

            expect(arrayUnion1.isEqual(arrayUnion2)).toBe(true);
            // Order matters in elements
            expect(arrayUnion1.isEqual(arrayUnion3)).toBe(false);
        });

        describe("MockQuery.isEqual method", () => {
            it("should return true for queries with the same path and constraints", () => {
                const query1 = db
                    .collection("testCollection")
                    .where("status", "==", "active")
                    .limit(10);
                const query2 = db
                    .collection("testCollection")
                    .where("status", "==", "active")
                    .limit(10);

                expect(query1.isEqual(query2)).toBe(true);
            });

            it("should return false for queries with different paths", () => {
                const query1 = db.collection("testCollection1").where("status", "==", "active");
                const query2 = db.collection("testCollection2").where("status", "==", "active");

                expect(query1.isEqual(query2)).toBe(false);
            });

            it("should return false for queries with different constraints", () => {
                const query1 = db
                    .collection("testCollection")
                    .where("status", "==", "active")
                    .limit(10);
                const query2 = db
                    .collection("testCollection")
                    .where("status", "==", "active")
                    .limit(5);

                expect(query1.isEqual(query2)).toBe(false);
            });

            it("should return true for queries with constraints in different order", () => {
                const query1 = db
                    .collection("testCollection")
                    .where("status", "==", "active")
                    .orderBy("createdAt", "desc");
                const query2 = db
                    .collection("testCollection")
                    .orderBy("createdAt", "desc")
                    .where("status", "==", "active");

                expect(query1.isEqual(query2)).toBe(true);
            });

            it("should return false when comparing to a non-query object", () => {
                const query = db.collection("testCollection").where("status", "==", "active");
                const nonQuery = { some: "object" };

                expect(query.isEqual(nonQuery)).toBe(false);
            });
        });
    });

    describe("recursiveDelete method", () => {
        it("should delete all documents in a collection", async () => {
            const collectionRef = db.collection("testCollection");

            // Add documents to the collection
            await collectionRef.doc("doc1").set({ key: "value1" });
            await collectionRef.doc("doc2").set({ key: "value2" });

            // Ensure documents exist
            let docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(2);

            // Call recursiveDelete
            await db.recursiveDelete(collectionRef);

            // Verify that documents are deleted
            docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(0);
        });

        it("should delete all documents and subcollections recursively", async () => {
            const collectionRef = db.collection("testCollection");

            // Add documents with subcollections
            const docRef1 = collectionRef.doc("doc1");
            await docRef1.set({ key: "value1" });
            const subCollectionRef1 = docRef1.collection("subCollection1");
            await subCollectionRef1.doc("subDoc1").set({ subKey: "subValue1" });

            const docRef2 = collectionRef.doc("doc2");
            await docRef2.set({ key: "value2" });
            const subCollectionRef2 = docRef2.collection("subCollection2");
            await subCollectionRef2.doc("subDoc2").set({ subKey: "subValue2" });

            // Ensure documents and subcollections exist
            let docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(2);

            let subDocs1 = await subCollectionRef1.listDocuments();
            expect(subDocs1).toHaveLength(1);

            let subDocs2 = await subCollectionRef2.listDocuments();
            expect(subDocs2).toHaveLength(1);

            // Call recursiveDelete
            await db.recursiveDelete(collectionRef);

            // Verify that documents and subcollections are deleted
            docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(0);

            subDocs1 = await subCollectionRef1.listDocuments();
            expect(subDocs1).toHaveLength(0);

            subDocs2 = await subCollectionRef2.listDocuments();
            expect(subDocs2).toHaveLength(0);
        });

        it("should handle deleting an empty collection without errors", async () => {
            const collectionRef = db.collection("emptyCollection");

            // Ensure the collection is empty
            let docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(0);

            // Call recursiveDelete
            await db.recursiveDelete(collectionRef);

            // Verify that no errors occur and collection is still empty
            docs = await collectionRef.listDocuments();
            expect(docs).toHaveLength(0);
        });
    });

    describe("Error Handling", () => {
        it("should simulate network errors", async () => {
            db.enableNetworkErrorSimulation();

            const docRef = db.collection("testCollection").doc("testDoc");
            await expect(docRef.get()).rejects.toThrowError(
                new FirestoreError("unavailable", "Simulated network error"),
            );

            db.disableNetworkErrorSimulation();
        });

        it("should simulate timeout errors", async () => {
            db.enableTimeoutErrorSimulation();

            const docRef = db.collection("testCollection").doc("testDoc");
            await expect(docRef.get()).rejects.toThrowError(
                new FirestoreError("deadline-exceeded", "Simulated timeout error"),
            );

            db.disableTimeoutErrorSimulation();
        });

        it("should throw 'invalid-argument' error when setting undefined data", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await expect(docRef.set(undefined)).rejects.toThrowError(
                new FirestoreError("invalid-argument", "Data to set cannot be undefined or null"),
            );
        });

        it("should throw 'invalid-argument' error for unsupported query operators", () => {
            expect(() => {
                db.collection("testCollection").where(
                    "status",
                    "unsupported-operator" as any,
                    "value",
                );
            }).toThrowError(
                new FirestoreError(
                    "invalid-argument",
                    "Unsupported operator: unsupported-operator",
                ),
            );
        });

        it("should throw 'invalid-argument' error for invalid collection path", () => {
            expect(() => {
                db.collection("invalidCollectionPath/testDoc");
            }).toThrowError(
                new FirestoreError(
                    "invalid-argument",
                    "Invalid collection path. Must refer to a collection, not a document.",
                ),
            );
        });

        it("should throw 'invalid-argument' error for invalid document path", () => {
            expect(() => {
                db.doc("testCollection");
            }).toThrowError(
                new FirestoreError(
                    "invalid-argument",
                    "Document path must point to a document, not a collection.",
                ),
            );
        });

        it("should throw 'not-found' error when updating a non-existent document", async () => {
            const docRef = db.doc("testCollection/nonExistentDoc");
            await expect(docRef.update({ key: "value" })).rejects.toThrowError(
                new FirestoreError(
                    "not-found",
                    `No document to update: Document at path '${docRef.path}' does not exist.`,
                ),
            );
        });
    });

    describe("Field Masks in Set Operations", () => {
        it("should merge specified fields using mergeFields option", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");
            await docRef.set({ field1: "value1", field2: "value2", field3: "value3" });

            await docRef.set(
                { field2: "newValue2", field3: "newValue3" },
                { mergeFields: ["field2"] },
            );

            const snapshot = await docRef.get();
            expect(snapshot.data()).toEqual({
                field1: "value1",
                field2: "newValue2",
                // field3 remains unchanged
                field3: "value3",
            });
        });

        it("should set only specified fields when using mergeFields on a new document", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            await docRef.set({ field1: "value1", field2: "value2" }, { mergeFields: ["field1"] });

            const snapshot = await docRef.get();
            expect(snapshot.data()).toEqual({
                field1: "value1",
                // field2 is not set
            });
        });

        it("should throw an error when both merge and mergeFields are specified", async () => {
            const docRef = db.collection("testCollection").doc("testDoc");

            await expect(
                docRef.set(
                    { field1: "value1", field2: "value2" },
                    { merge: true, mergeFields: ["field1"] },
                ),
            ).rejects.toThrowError(
                new FirestoreError(
                    "invalid-argument",
                    "Cannot specify both 'merge' and 'mergeFields' options.",
                ),
            );
        });
    });

    describe("withConverter method", () => {
        interface User {
            name: string;
            age: number;
        }

        const userConverter: FirestoreDataConverter<User> = {
            toFirestore(user: User): FirebaseFirestore.DocumentData {
                return { name: user.name, age: user.age };
            },
            fromFirestore(data: FirebaseFirestore.DocumentData): User {
                return { name: data.name, age: data.age };
            },
        };

        it("should use the converter with set and get on DocumentReference", async () => {
            const docRef = db.collection("users").doc("user123").withConverter(userConverter);

            await docRef.set({ name: "Alice", age: 30 });

            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(true);
            const user = snapshot.data();
            expect(user).toEqual({ name: "Alice", age: 30 });
        });

        it("should use the converter with add and get on CollectionReference", async () => {
            const collectionRef = db.collection("users").withConverter(userConverter);

            const docRef = await collectionRef.add({ name: "Bob", age: 25 });
            const snapshot = await docRef.get();
            expect(snapshot.exists).toBe(true);
            const user = snapshot.data();
            expect(user).toEqual({ name: "Bob", age: 25 });
        });

        it("should use the converter with queries", async () => {
            const collectionRef = db.collection("users").withConverter(userConverter);

            await collectionRef.add({ name: "Charlie", age: 35 });
            await collectionRef.add({ name: "Dave", age: 40 });

            const querySnapshot = await collectionRef.where("age", ">", 30).get();
            expect(querySnapshot.docs).toHaveLength(2);

            const users = querySnapshot.docs.map((doc) => doc.data());
            expect(users).toEqual([
                { name: "Charlie", age: 35 },
                { name: "Dave", age: 40 },
            ]);
        });

        it("should chain withConverter calls", async () => {
            const baseCollectionRef = db.collection("users");
            const collectionRefWithConverter = baseCollectionRef.withConverter(userConverter);
            const docRefWithConverter = collectionRefWithConverter.doc("user456");

            await docRefWithConverter.set({ name: "Eve", age: 28 });

            const snapshot = await docRefWithConverter.get();
            expect(snapshot.exists).toBe(true);
            const user = snapshot.data();
            expect(user).toEqual({ name: "Eve", age: 28 });
        });
    });

    describe("MockBulkWriter", () => {
        it("should perform multiple write operations", async () => {
            const bulkWriter = db.bulkWriter();

            const docRef1 = db.collection("testCollection").doc("doc1");
            const docRef2 = db.collection("testCollection").doc("doc2");

            const setPromise = bulkWriter.set(docRef1, { key: "value1" });
            const updatePromise = bulkWriter.update(docRef2, { key: "value2" });
            const deletePromise = bulkWriter.delete(docRef2);

            // Ensure doc2 exists before update and delete
            await docRef2.set({ key: "initialValue" });

            // Close the bulkWriter to execute operations
            await bulkWriter.close();

            // Wait for all promises
            await expect(setPromise).resolves.toBeInstanceOf(MockWriteResult);
            await expect(updatePromise).resolves.toBeInstanceOf(MockWriteResult);
            await expect(deletePromise).resolves.toBeInstanceOf(MockWriteResult);

            // Verify operations
            const snapshot1 = await docRef1.get();
            expect(snapshot1.exists).toBe(true);
            expect(snapshot1.data()).toEqual({ key: "value1" });

            const snapshot2 = await docRef2.get();
            expect(snapshot2.exists).toBe(false);
        });

        it("should handle errors in operations", async () => {
            const bulkWriter = db.bulkWriter();

            const docRef = db.collection("testCollection").doc("nonExistentDoc");

            const updatePromise = bulkWriter.update(docRef, { key: "value" });

            // Close the bulkWriter to execute operations
            await bulkWriter.close();

            // Wait for the promise and expect it to be rejected
            await expect(updatePromise).rejects.toThrowError(
                new FirestoreError(
                    "not-found",
                    `No document to update: Document at path '${docRef.path}' does not exist.`,
                ),
            );
        });

        it("should not allow operations after close", async () => {
            const bulkWriter = db.bulkWriter();
            const docRef = db.collection("testCollection").doc("testDoc");

            bulkWriter.set(docRef, { key: "value" });
            // Close the bulkWriter
            await bulkWriter.close();
            // Attempt to enqueue another operation
            await expect(bulkWriter.set(docRef, { key: "newValue" })).rejects.toThrowError(
                new FirestoreError("failed-precondition", "BulkWriter has been closed."),
            );
        });
    });

    describe("bundle method", () => {
        it("should build a data bundle", async () => {
            const docRef = db.doc("testCollection/doc1");
            await docRef.set({ key: "value1" });

            const bundle = db
                .bundle("testBundle")
                .add(await docRef.get())
                .add(db.collection("testCollection"))
                .build();

            expect(bundle).toBeDefined();
            const parsedBundle = JSON.parse(bundle);
            expect(parsedBundle.name).toBe("testBundle");
            expect(parsedBundle.elements.length).toBe(2);
        });
    });
});
