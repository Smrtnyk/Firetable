import { db } from "../init.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

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
export async function deleteDocument({ col, id }: { col: string; id: string }): Promise<void> {
    const documentRef = db.collection(col).doc(id);

    // Recursive function to delete a document and its subcollections
    async function deleteRecursively(ref: typeof documentRef): Promise<void> {
        // Get subcollections of the document
        const collections = await ref.listCollections();
        for (const collection of collections) {
            const docs = await collection.listDocuments();

            // Recursive call
            const promises = docs.map((doc) => deleteRecursively(doc));
            await Promise.all(promises);
        }
        // Delete the document itself
        await ref.delete();
    }

    try {
        await deleteRecursively(documentRef);
    } catch (error) {
        logger.error(`Error deleting document with ID ${id} in collection ${col}:`, error);
        throw new HttpsError("internal", `Failed to delete document with ID ${id}.`);
    }
}
