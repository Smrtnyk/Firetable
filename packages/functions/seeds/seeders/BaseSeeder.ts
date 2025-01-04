import { db } from "../init.js";

export abstract class BaseSeeder {
    protected async batchWrite(docs: any[], basePath: string): Promise<void> {
        const batches = [];
        // Firestore limit
        const batchSize = 500;

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = docs.slice(i, i + batchSize);

            for (const doc of batchDocs) {
                const ref = db.doc(`${basePath}/${doc.id}`);
                batch.set(ref, doc);
            }

            batches.push(batch.commit());
        }

        await Promise.all(batches);
    }
}
