import { Collection, EVENT_LOGS_DOCUMENT } from "@firetable/types";

import type { EventOwner } from "./db.js";

export function getDrinkCardPath(
    organisationId: string,
    propertyId: string,
    drinkCardId: string,
): string {
    return [getDrinkCardsPath(organisationId, propertyId), drinkCardId].join("/");
}

// DRINK CARDS
export function getDrinkCardsPath(organisationId: string, propertyId: string): string {
    return [getPropertyPath(organisationId, propertyId), Collection.DRINK_CARDS].join("/");
}

export function getEventFloorsPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.FLOORS].join("/");
}

export function getEventGuestListPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.GUEST_LIST].join("/");
}

export function getEventLogsPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.EVENT_LOGS, EVENT_LOGS_DOCUMENT].join("/");
}

export function getEventPath(eventOwner: EventOwner): string {
    return [getEventsPath(eventOwner), eventOwner.id].join("/");
}

// EVENTS
export function getEventsPath({ organisationId, propertyId }: EventOwner): string {
    return [getPropertyPath(organisationId, propertyId), Collection.EVENTS].join("/");
}

export function getFloorPath(organisationId: string, propertyId: string, floorId: string): string {
    return [getFloorsPath(organisationId, propertyId), floorId].join("/");
}
// FLOORS
export function getFloorsPath(organisationId: string, propertyId: string): string {
    return [getPropertyPath(organisationId, propertyId), Collection.FLOORS].join("/");
}

export function getGuestPath(organisationId: string, guestId: string): string {
    return [getGuestsPath(organisationId), guestId].join("/");
}

// GUESTS
export function getGuestsPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.GUESTS].join("/");
}

// INVENTORY
export function getInventoryPath(organisationId: string, propertyId: string): string {
    return [getPropertyPath(organisationId, propertyId), Collection.INVENTORY].join("/");
}

export function getIssueReportsPath(): string {
    return Collection.ISSUE_REPORTS;
}

// PROPERTIES
export function getPropertiesPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.PROPERTIES].join("/");
}

export function getPropertyPath(organisationId: string, propertyId: string): string {
    return [getPropertiesPath(organisationId), propertyId].join("/");
}

export function getReservationsPath(eventOwner: EventOwner): string {
    return [getEventPath(eventOwner), Collection.RESERVATIONS].join("/");
}

export function getUserPath(organisationId: string, userId: string): string {
    return [getUsersPath(organisationId), userId].join("/");
}

// USERS
export function getUsersPath(organisationId: string): string {
    return [Collection.ORGANISATIONS, organisationId, Collection.USERS].join("/");
}
