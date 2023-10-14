import * as functions from "firebase-functions";
// import * as vapidKeys from "./vapid-keys.json";
// import { setVapidDetails } from "web-push";
import { handleReservation } from "./trigger/handle-reservation/index.js";
import { handleEventImageWhenEventDeleted as handleEventImageWhenEventDeletedFn } from "./trigger/handle-event-image-when-event-deleted/index.js";
import { createEvent as createEventFn } from "./callable/create-event/index.js";
import { createUser as createUserFn } from "./callable/create-user/index.js";
import { deleteUser as deleteUserFn } from "./callable/delete-user/index.js";
import { clearOldEvents as clearOldEventsFn } from "./cron/clear-old-events/index.js";
import { Collection } from "../types/types.js";
import { createPropertyFn } from "./callable/create-property/create-property.js";
import { deleteDocument } from "./delete-document/index.js";
import { db } from "./init.js";

// setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);

// Everything that has to do with events
export const createEvent = functions
    .region("europe-west3")
    .https
    .onCall(createEventFn);

export const handleEventImageWhenEventDeleted = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.EVENTS}/{eventId}`)
    .onDelete(handleEventImageWhenEventDeletedFn);

export const handleWhenEventTablesChange = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.EVENTS}/{eventId}/floors/{mapId}`)
    .onUpdate(handleReservation);

// Everything that has to do with auth
export const createUser = functions
    .region("europe-west3")
    .https
    .onCall(createUserFn);
export const deleteUser = functions
    .region("europe-west3")
    .https
    .onCall(deleteUserFn);
export const onUserDelete = functions.firestore
    .document(`${Collection.USERS}/{userId}`)
    .onDelete(async (snap, context) => {
        const userId = context.params.userId;

        try {
            const snapshot = await db.collection("userPropertyMap")
                .where("userId", "==", userId)
                .get();

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            functions.logger.error("Error deleting userPropertyMap entries:", error);
        }
    });

// Properties
export const createProperty = functions
    .region("europe-west3")
    .https
    .onCall(createPropertyFn);
export const onPropertyDelete = functions.firestore
    .document(`${Collection.PROPERTIES}/{propertyId}`)
    .onDelete(async (snap, context) => {
        const propertyId = context.params.propertyId;

        try {
            const snapshot = await db.collection(Collection.USER_PROPERTY_MAP)
                .where("propertyId", "==", propertyId)
                .get();

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            functions.logger.error("Error deleting userPropertyMap entries:", error);
        }
    });

// Generic stuff
export const deleteCollection = functions
    .region("europe-west3")
    .https
    .onCall(deleteDocument);

// Crons
export const clearOldEvents = functions
    .region("europe-west3")
    .pubsub
    .schedule("every day 00:00")
    .onRun(clearOldEventsFn);
