import { WriteResult } from "firebase-admin/firestore";
import { db } from "../init.js";

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

