import type { EventOwner } from "./db.js";
import { Collection, EVENT_LOGS_DOCUMENT } from "@firetable/types";

// PROPERTIES
export function getPropertiesPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.PROPERTIES].join("/");
}

export function getPropertyPath(organisationId: string, propertyId: string): string {
    return [getPropertiesPath(organisationId), propertyId].join("/");
}

// EVENTS
export function getEventsPath({ propertyId, organisationId }: EventOwner): string {
    return [getPropertyPath(organisationId, propertyId), Collection.EVENTS].join("/");
}

export function getEventPath(eventOwner: EventOwner): string {
    return [getEventsPath(eventOwner), eventOwner.id].join("/");
}

export function getEventLogsPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.EVENT_LOGS, EVENT_LOGS_DOCUMENT].join("/");
}
export function getReservationsPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.RESERVATIONS].join("/");
}

export function getEventFloorsPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.FLOORS].join("/");
}

export function getEventGuestListPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.GUEST_LIST].join("/");
}

// GUESTS
export function getGuestsPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.GUESTS].join("/");
}

// FLOORS
export function getFloorsPath(organisationId: string, propertyId: string): string {
    return [getPropertyPath(organisationId, propertyId), Collection.FLOORS].join("/");
}

export function getFloorPath(organisationId: string, propertyId: string, floorId: string): string {
    return [getFloorsPath(organisationId, propertyId), floorId].join("/");
}
