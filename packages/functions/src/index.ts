import { Collection } from "@shared-types";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { createEvent as createEventFn } from "./callable/create-event/index.js";
import { deleteGuestVisitFn } from "./callable/guest/delete-guest-visit.js";
import { setGuestDataFn } from "./callable/guest/set-guest-data.js";
import { updateGuestDataFn } from "./callable/guest/update-guest-info.js";
import { createPropertyFn } from "./callable/property/create-property.js";
import { updatePropertyFn } from "./callable/property/update-property.js";
import { moveReservationFromQueueFn } from "./callable/reservation/move-reservation-from-queue.js";
import { moveReservationToQueueFn } from "./callable/reservation/move-reservation-to-queue.js";
import { changePasswordFn } from "./callable/user/change-password.js";
import { createUser as createUserFn } from "./callable/user/create-user.js";
import { deleteUser as deleteUserFn } from "./callable/user/delete-user.js";
import { fetchUsersByRoleFn } from "./callable/user/fetch-users-by-role.js";
import { updateUserFn } from "./callable/user/update-user.js";
import { clearOldEvents as clearOldEventsFn } from "./cron/clear-old-events/index.js";
import { deleteDocument } from "./delete-document/index.js";
import { onOrganisationDeletedFn } from "./trigger/on-organisation-deleted.js";
import { onPropertyDeletedFn } from "./trigger/on-property-deleted.js";

setGlobalOptions({ region: "europe-west3" });

// Everything that has to do with events
export const createEvent = onCall(createEventFn);

// Everything that has to do with auth
export const changePassword = onCall(changePasswordFn);
export const fetchUsersByRole = onCall(fetchUsersByRoleFn);
export const createUser = onCall(createUserFn);
export const updateUser = onCall(updateUserFn);
export const deleteUser = onCall(deleteUserFn);

// Organisations
export const onOrganisationDeleted = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}`,
    (event) => {
        return onOrganisationDeletedFn(event.params);
    },
);

// Properties
export const createProperty = onCall(createPropertyFn);
export const updateProperty = onCall(updatePropertyFn);
export const onPropertyDelete = onDocumentDeleted(
    `${Collection.ORGANISATIONS}/{organisationId}/${Collection.PROPERTIES}/{propertyId}`,
    (event) => onPropertyDeletedFn(event),
);
// Guests
export const setGuestData = onCall(setGuestDataFn);
export const deleteGuestVisit = onCall(deleteGuestVisitFn);
export const updateGuestData = onCall(updateGuestDataFn);
// Reservations
export const moveReservationToQueue = onCall(moveReservationToQueueFn);
export const moveReservationFromQueue = onCall(moveReservationFromQueueFn);

// Generic stuff
export const deleteCollection = onCall<{ col: string; id: string }>((request) =>
    deleteDocument(request.data),
);

// Crons
export const clearOldEvents = onSchedule("every day 00:00", clearOldEventsFn);
