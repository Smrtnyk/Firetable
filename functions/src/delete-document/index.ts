import { db } from "../init";

export async function deleteDocument({ col, id }: { col: string, id: string }): Promise<void> {
    const document = db.collection(col).doc(id);
    const collections = await document.listCollections();
    for (const collection of collections) {
        const docs = await collection.listDocuments();
        for (const doc of docs) {
            await doc.delete();
        }
    }
    await document.delete();
}
