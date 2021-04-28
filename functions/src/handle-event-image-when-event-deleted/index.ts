import * as functions from "firebase-functions";
import { storage } from "../init";
import { Collection } from "../../types/database";

export function handleEventImageWhenEventDeleted(snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext): Promise<unknown> {
    const eventID = context.params.eventId;
    const file = storage.file(`${Collection.EVENTS}/${eventID}.jpg`);

    return file?.delete({
        ignoreNotFound: true
    });
}
