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
import { updateUserFn } from "./callable/update-user.js";
import { fetchUsersByRoleFn } from "./callable/fetch-users-by-role.js";
import { onUserDeletedFn } from "./trigger/on-user-deleted.js";
import { onPropertyDeletedFn } from "./trigger/on-property-deleted.js";

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
    .onDelete(onUserDeletedFn);

// Properties
export const createProperty = functions
    .region("europe-west3")
    .https
    .onCall(createPropertyFn);
export const onPropertyDelete = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.PROPERTIES}/{propertyId}`)
    .onDelete(onPropertyDeletedFn);

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
