import { Collection } from "../types/types.js";

export function getEventsPath(organisationId: string, propertyId: string): string {
    return [
        Collection.ORGANISATIONS,
        organisationId,
        Collection.PROPERTIES,
        propertyId,
        Collection.EVENTS,
    ].join("/");
}

export function getEventPath(organisationId: string, propertyId: string, eventId: string): string {
    return [getEventsPath(organisationId, propertyId), eventId].join("/");
}
