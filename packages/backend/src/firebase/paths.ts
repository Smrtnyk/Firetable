import { Collection } from "@firetable/types";
import type { EventOwner } from "./db.js";

export function getPropertiesPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.PROPERTIES].join("/");
}

export function getPropertyPath(organisationId: string, propertyId: string): string {
    return [getPropertiesPath(organisationId), propertyId].join("/");
}

export function getEventsPath({ propertyId, organisationId }: EventOwner): string {
    return [getPropertyPath(organisationId, propertyId), Collection.EVENTS].join("/");
}

export function getEventPath(eventOwner: EventOwner): string {
    return [getEventsPath(eventOwner), eventOwner.id].join("/");
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

export function getFloorsPath(organisationId: string, propertyId: string): string {
    return [getPropertyPath(organisationId, propertyId), Collection.FLOORS].join("/");
}

export function getFloorPath(organisationId: string, propertyId: string, floorId: string): string {
    return [getFloorsPath(organisationId, propertyId), floorId].join("/");
}
