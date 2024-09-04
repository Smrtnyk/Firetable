import { db } from "../init.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export const MAX_DEPTH = 10;
// Firestore batch limit is 500 operations
const BATCH_SIZE = 500;

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

    async function deleteRecursively(ref: typeof documentRef, depth = 0): Promise<void> {
        if (depth > MAX_DEPTH) {
            logger.warn(`Reached max depth limit at ${ref.path}`);
            return;
        }

        logger.info(`Deleting document at ${ref.path} with depth ${depth}`);

        const collections = await ref.listCollections();
        for (const collection of collections) {
            let batch = db.batch();
            let operationCount = 0;

            const docs = await collection.listDocuments();
            for (const doc of docs) {
                batch.delete(doc);
                operationCount += 1;

                if (operationCount >= BATCH_SIZE) {
                    await batch.commit();
                    batch = db.batch();
                    operationCount = 0;
                }

                // Recursive call with increased depth
                await deleteRecursively(doc, depth + 1);
            }

            if (operationCount > 0) {
                await batch.commit();
            }
        }

        // Delete the document itself
        await ref.delete();
    }

    try {
        await deleteRecursively(documentRef);
    } catch (error: any) {
        logger.error(`Error deleting document with ID ${id} in collection ${col}:`, error);
        throw new HttpsError(
            "internal",
            `Failed to delete document with ID ${id}. Error: ${error.message}`,
        );
    }
}
