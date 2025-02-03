import { DocumentReference } from "firebase-admin/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../init.js";
import { deleteDocument, MAX_DEPTH } from "./index.js";

describe("deleteDocument Function", () => {
    const collectionName = "testCollection";
    const documentId = "testDoc";

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should delete a document without subcollections", async () => {
        // Setup: Create a document without subcollections
        const docRef = db.collection(collectionName).doc(documentId);
        await docRef.set({ field: "value" });

        // Test: Call the deleteDocument function
        await deleteDocument({ col: collectionName, id: documentId });

        // Assert: Check that the document is deleted
        const docSnapshot = await docRef.get();
        expect(docSnapshot.exists).toBe(false);
    });

    it("should delete a document and its subcollections", async () => {
        const docRef = db.collection(collectionName).doc(documentId);
        await docRef.set({ field: "value" });

        // Create subcollections and nested documents
        const subCollectionRef = docRef.collection("subCollection");
        const nestedDocRef = subCollectionRef.doc("nestedDoc");
        await nestedDocRef.set({ nestedField: "nestedValue" });

        // Test: Call the deleteDocument function
        await deleteDocument({ col: collectionName, id: documentId });

        // Assert: Check that the document and all subcollections are deleted
        const docSnapshot = await docRef.get();
        const nestedDocSnapshot = await nestedDocRef.get();
        expect(docSnapshot.exists).toBe(false);
        expect(nestedDocSnapshot.exists).toBe(false);
    });

    it("should handle maximum depth limit", async () => {
        // Setup: Create a deeply nested document structure
        let currentRef: any = db.collection(collectionName);
        let deepDocPath = `${collectionName}`;
        for (let i = 0; i <= MAX_DEPTH + 2; i += 1) {
            deepDocPath += `/doc${i}/subCol${i}`;
            currentRef = currentRef.doc(`doc${i}`).collection(`subCol${i}`);
        }

        // Create a document at the deepest level
        await currentRef.doc("deepDoc").set({ field: "deepValue" });

        // Test: Call the deleteDocument function
        await deleteDocument({ col: collectionName, id: "doc0" });

        // Assert: Ensure that the deletion stops at the maximum depth
        // Check if the document beyond MAX_DEPTH still exists
        deepDocPath += `/deepDoc`;
        const deepDocRef = db.doc(deepDocPath);
        const deepDocSnapshot = await deepDocRef.get();
        expect(deepDocSnapshot.exists).toBe(true);
    });

    it("should throw an error on deletion failure", async () => {
        // Setup: Create a document and mock a deletion failure
        const docRef = db.collection(collectionName).doc(documentId);
        await docRef.set({ field: "value" });

        // Mock deletion failure
        vi.spyOn(DocumentReference.prototype, "delete").mockRejectedValue(
            new Error("Mocked deletion failure"),
        );

        // Test & Assert: Expect the deleteDocument function to throw an error
        await expect(deleteDocument({ col: collectionName, id: documentId })).rejects.toThrow(
            "Failed to delete document with ID testDoc. Error: Mocked deletion failure",
        );
    });
});
