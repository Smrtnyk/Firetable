import { createEvent as createEventFn } from "./callable/create-event/index.js";
import { createUser as createUserFn } from "./callable/create-user/index.js";
import { deleteUser as deleteUserFn } from "./callable/delete-user/index.js";
import { clearOldEvents as clearOldEventsFn } from "./cron/clear-old-events/index.js";
import { createPropertyFn } from "./callable/create-property/create-property.js";
import { deleteDocument } from "./delete-document/index.js";
import { updateUserFn } from "./callable/update-user.js";
import { fetchUsersByRoleFn } from "./callable/fetch-users-by-role.js";
import { onUserDeletedFn } from "./trigger/on-user-deleted.js";
import { onPropertyDeletedFn } from "./trigger/on-property-deleted.js";

import { changePasswordFn } from "./callable/change-password.js";
import { onOrganisationDeletedFn } from "./trigger/on-organisation-deleted.js";
import { setGuestDataFn } from "./callable/guest/set-guest-data.js";
import { deleteGuestVisitFn } from "./callable/guest/delete-guest-visit.js";
import { Collection } from "../types/types.js";

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "europe-west3" });

// Everything that has to do with events
export const createEvent = onCall(createEventFn);

// Everything that has to do with auth
export const changePassword = onCall(changePasswordFn);
export const fetchUsersByRole = onCall(fetchUsersByRoleFn);
export const createUser = onCall(createUserFn);
export const updateUser = onCall(updateUserFn);
export const deleteUser = onCall(deleteUserFn);
export const onUserDeleted = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}/${Collection.USERS}/{userId}`,
    (event) => {
        return onUserDeletedFn(event.params);
    },
);

// Organisations
export const onOrganisationDeleted = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}`,
    (event) => {
        return onOrganisationDeletedFn(event.params);
    },
);

// Properties
export const createProperty = onCall(createPropertyFn);
export const onPropertyDelete = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}/${Collection.PROPERTIES}/{propertyId}`,
    (event) => onPropertyDeletedFn(event.params),
);
// Reservations
export const setGuestData = onCall(setGuestDataFn);
export const deleteGuestVisit = onCall(deleteGuestVisitFn);

// Generic stuff
export const deleteCollection = onCall<{ col: string; id: string }>((request) =>
    deleteDocument(request.data),
);

// Crons
export const clearOldEvents = onSchedule("every day 00:00", clearOldEventsFn);
