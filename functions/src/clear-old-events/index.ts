import { deleteDocument } from "../delete-document";
import { Collection } from "../../types/database";
import { db } from "../init";
import { firestore } from "firebase-admin";

export async function clearOldEvents(): Promise<void> {
    const oldEvents = await getOldEvents();
    if (oldEvents.empty) {
        return;
    }

    for (const event of oldEvents.docs) {
        await deleteDocument({
            col: Collection.EVENTS,
            id: event.id
        });
    }
}

function getOldEvents(): Promise<firestore.QuerySnapshot<firestore.DocumentData>> {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return db.collection(Collection.EVENTS).where("date", "<=", date.getTime()).get();
}
