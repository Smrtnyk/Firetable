import * as functions from "firebase-functions";
// import * as vapidKeys from "./vapid-keys.json";
// import { setVapidDetails } from "web-push";
import { handleReservation } from "./handle-reservation";
import { handleEventImageWhenEventDeleted } from "./handle-event-image-when-event-deleted";
import { createEvent } from "./create-event";
import { createUser } from "./create-user";
import { deleteUser } from "./delete-user";
import { deleteDocument } from "./delete-document";
import { clearOldEvents } from "./clear-old-events";
import { Collection } from "@firetable/types";

// setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);

// Everything that has to do with events
exports.createEvent = functions
    .region("europe-west3")
    .https
    .onCall(createEvent);

exports.handleEventImageWhenEventDeleted = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.EVENTS}/{eventId}`)
    .onDelete(handleEventImageWhenEventDeleted);

exports.handleWhenEventTablesChange = functions
    .region("europe-west3")
    .firestore
    .document(`${Collection.EVENTS}/{eventId}/floors/{mapId}`)
    .onUpdate(handleReservation);

// Everything that has to do with auth
exports.createUser = functions
    .region("europe-west3")
    .https
    .onCall(createUser);
exports.deleteUser = functions
    .region("europe-west3")
    .https
    .onCall(deleteUser);

// Generic stuff
exports.deleteCollection = functions
    .region("europe-west3")
    .https
    .onCall(deleteDocument);

// Crons
exports.clearOldEvents = functions
    .region("europe-west3")
    .pubsub
    .schedule("every day 00:00")
    .onRun(clearOldEvents);
