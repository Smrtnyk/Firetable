import { WriteResult } from "firebase-admin/firestore";
import { db } from "../init.js";

/**
 * Deletes a specified document and all of its subcollections from Firestore.
 *
 * This function is designed to handle the deletion of a Firestore document along with any nested subcollections.
 * Due to the Firestore data model, deleting a document does not automatically delete its subcollections.
 * This function ensures that both the document and all its nested content are deleted.
 *
 * @param params - The parameters for the function.
 * @param params.col - The name of the collection where the document resides.
 * @param params.id - The ID of the document to delete.
 *
 * @throws - Throws an error if any part of the deletion process fails.
 *
 * @returns - A promise that resolves when the document and all its subcollections are deleted.
 *
 * @description
 * The function first fetches all subcollections of the specified document.
 * It then prepares to delete all documents within each subcollection.
 * After all subcollections and their contents are deleted, the main document is deleted.
 * If any deletion fails, the function throws an error with details.
 */
export async function deleteDocument({ col, id }: { col: string, id: string }): Promise<void> {
    const document = db.collection(col).doc(id);

    try {
        // Get all subcollections of the document
        const collections = await document.listCollections();

        // Prepare an array to hold all deletion promises
        const deletePromises: Promise<WriteResult>[] = [];

        // Iterate over each subcollection
        for (const collection of collections) {
            const docs = await collection.listDocuments();

            // Add deletion promises for each document in the subcollection
            deletePromises.push(...docs.map(doc => doc.delete()));
        }

        // Delete all documents concurrently
        await Promise.all(deletePromises);

        // Now, delete the main document
        await document.delete();
    } catch (error) {
        console.error(`Error deleting document with ID ${id} in collection ${col}:`, error);
        throw new Error(`Failed to delete document with ID ${id}.`);
    }
}

