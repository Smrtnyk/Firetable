import { Collection } from "@shared-types";

export function getEventPath(organisationId: string, propertyId: string, eventId: string): string {
    return [getEventsPath(organisationId, propertyId), eventId].join("/");
}

export function getEventsPath(organisationId: string, propertyId: string): string {
    return [
        Collection.ORGANISATIONS,
        organisationId,
        Collection.PROPERTIES,
        propertyId,
        Collection.EVENTS,
    ].join("/");
}

// Guest
export function getGuestsPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.GUESTS].join("/");
}
// Properties
export function getPropertiesPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.PROPERTIES].join("/");
}

export function getPropertyPath(organisationId: string, propertyId: string): string {
    return [getPropertiesPath(organisationId), propertyId].join("/");
}

export function getQueuedReservationsPath(
    organisationId: string,
    propertyId: string,
    eventId: string,
): string {
    return [getEventPath(organisationId, propertyId, eventId), Collection.QUEUED_RESERVATIONS].join(
        "/",
    );
}

// Reservation
export function getReservationsPath(
    organisationId: string,
    propertyId: string,
    eventId: string,
): string {
    return [getEventPath(organisationId, propertyId, eventId), Collection.RESERVATIONS].join("/");
}

export function getUserPath(organisationId: string, userId: string): string {
    return [getUsersPath(organisationId), userId].join("/");
}

// Users
export function getUsersPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.USERS].join("/");
}
