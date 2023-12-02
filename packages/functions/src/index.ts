import * as functions from "firebase-functions";
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
import { onPropertyDeletedCleanEvents } from "./trigger/on-property-deleted-clean-events.js";
import { auth } from "./init.js";
import { logger } from "firebase-functions";

import { onRequest } from "firebase-functions/v2/https";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "europe-west3" });

const MIN_PASSWORD_LENGTH = 6;

// Everything that has to do with events
export const createEvent = functions.region("europe-west3").https.onCall(createEventFn);

// Everything that has to do with auth
export const changePassword = functions
    .region("europe-west3")
    .https.onCall(async (data: { newPassword: string }, context) => {
        if (!context.auth) {
            logger.error("Unauthenticated user tried to change password.");
            throw new functions.https.HttpsError(
                "unauthenticated",
                "The function must be called while authenticated.",
            );
        }

        const uid: string = context.auth.uid;
        const newPassword: string = data.newPassword;

        if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
            logger.error("Invalid password provided by user:", uid);
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Password must be at least 6 characters long!",
            );
        }

        try {
            await auth.updateUser(uid, { password: newPassword });
            logger.log("Password changed successfully for user:", uid);
            return { success: true };
        } catch (error) {
            logger.error("Failed to update the password for user:", uid, error);
            throw new functions.https.HttpsError("internal", "Failed to update the user password.");
        }
    });
export const fetchUsersByRole = functions.region("europe-west3").https.onCall(fetchUsersByRoleFn);
export const createUser = functions.region("europe-west3").https.onCall(createUserFn);
export const updateUser = functions.region("europe-west3").https.onCall(updateUserFn);
export const deleteUser = functions.region("europe-west3").https.onCall(deleteUserFn);
export const onUserDeleted = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}/${Collection.USERS}/{userId}`,
    (event) => {
        return onUserDeletedFn(event.params);
    },
);

// Properties
export const createProperty = functions.region("europe-west3").https.onCall(createPropertyFn);
export const onPropertyDelete = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}/${Collection.PROPERTIES}/{propertyId}`,
    (event) => onPropertyDeletedFn(event.params),
);
export const onPropertyDeleteCleanupEvents = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}/${Collection.PROPERTIES}/{propertyId}`,
    (event) => onPropertyDeletedCleanEvents(event.params),
);

// Generic stuff
export const deleteCollection = functions.region("europe-west3").https.onCall(deleteDocument);

// Crons
export const clearOldEvents = functions
    .region("europe-west3")
    .pubsub.schedule("every day 00:00")
    .onRun(clearOldEventsFn);

// HealthCheck
export const healthCheck = onRequest({ cors: true }, (request, response) => {
    response.status(200).send("Service is up and running");
});
