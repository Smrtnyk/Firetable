import * as functions from "firebase-functions";
// import * as vapidKeys from "./vapid-keys.json";
// import { setVapidDetails } from "web-push";
import { handleReservation } from "./handle-reservation/index.js";
import { handleEventImageWhenEventDeleted as handleEventImageWhenEventDeletedFn } from "./handle-event-image-when-event-deleted/index.js";
import { createEvent as createEventFn } from "./create-event/index.js";
import { createUser as createUserFn } from "./create-user/index.js";
import { deleteUser as deleteUserFn } from "./delete-user/index.js";
import { clearOldEvents as clearOldEventsFn } from "./clear-old-events/index.js";
import { Collection } from "../types/types.js";
import { createPropertyFn } from "./property/create-property.js";
import { deleteDocument } from "./delete-document/index.js";

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

// Properties
export const createProperty = functions
    .region("europe-west3")
    .https
    .onCall(createPropertyFn);

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
