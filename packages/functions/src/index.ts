import * as functions from "firebase-functions";
// import * as vapidKeys from "./vapid-keys.json";
// import { setVapidDetails } from "web-push";
import { handleReservation } from "./trigger/handle-reservation/index.js";
import { deleteEventImage } from "./trigger/delete-event-image/index.js";
import { createEvent as createEventFn } from "./callable/create-event/index.js";
import { createUser as createUserFn } from "./callable/create-user/index.js";
import { deleteUser as deleteUserFn } from "./callable/delete-user/index.js";
import { clearOldEvents as clearOldEventsFn } from "./cron/clear-old-events/index.js";
import { Collection } from "../types/types.js";
import { createPropertyFn } from "./callable/create-property/create-property.js";
import { deleteDocument } from "./delete-document/index.js";
import { db } from "./init.js";
import { logger } from "firebase-functions";
import { updateUserFn } from "./callable/update-user.js";
import { fetchUsersByRoleFn } from "./callable/fetch-users-by-role.js";

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
    .onDelete(deleteEventImage);

export const handleWhenEventTablesChange = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.EVENTS}/{eventId}/floors/{mapId}`)
    .onUpdate(handleReservation);

// Everything that has to do with auth
export const fetchUsersByRole = functions
    .region("europe-west3")
    .https
    .onCall(fetchUsersByRoleFn);
export const createUser = functions
    .region("europe-west3")
    .https
    .onCall(createUserFn);
export const updateUser = functions
    .region("europe-west3")
    .https
    .onCall(updateUserFn);
export const deleteUser = functions
    .region("europe-west3")
    .https
    .onCall(deleteUserFn);
export const onUserDeleted = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.USERS}/{userId}`)
    .onDelete(async (snap, context) => {
        const userId = context.params.userId;
        logger.info(`Cleaning up data for deleted user with id: ${userId}`);

        try {
            // Get all userPropertyMap documents associated with the user
            const userPropertyMapsSnapshot = await db.collection(`${Collection.USER_PROPERTY_MAP}`)
                .where("userId", "==", userId)
                .get();

            // Check if there are any documents to delete
            if (userPropertyMapsSnapshot.empty) {
                logger.info(`No userPropertyMap documents found for user ${userId}. Exiting function.`);
                return;
            }

            // If there are many documents, we might need to handle this in chunks
            // But for simplicity, we'll use batch here which can handle up to 500 operations
            const batch = db.batch();
            userPropertyMapsSnapshot.docs.forEach(doc => {
                logger.debug(`Scheduling delete for userPropertyMap document with id: ${doc.id}`);
                batch.delete(doc.ref);
            });

            await batch.commit();
            logger.info(`Successfully deleted userPropertyMap documents for user ${userId}`);

        } catch (error) {
            logger.error(`Error cleaning up data for user ${userId}:`, error);
            throw new functions.https.HttpsError("internal", `Error cleaning up data for user ${userId}`);
        }
    });

// Properties
export const createProperty = functions
    .region("europe-west3")
    .https
    .onCall(createPropertyFn);
export const onPropertyDelete = functions
    .region("europe-west3")
    .firestore
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
