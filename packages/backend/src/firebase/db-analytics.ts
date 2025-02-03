import type {
    EventDoc,
    PropertyDoc,
    ReservationDoc,
    ReservationDocWithEventId,
} from "@firetable/types";

import { getDocs, query, where } from "firebase/firestore";

import { eventsCollection, reservationsCollection } from "./db.js";

export async function fetchAnalyticsData(
    startDate: string,
    endDate: string,
    organisationId: string,
    property: PropertyDoc,
): Promise<{ events: EventDoc[]; reservations: ReservationDocWithEventId[] }> {
    const allEvents = await getEventsForProperty(property, startDate, endDate, organisationId);
    return {
        events: allEvents,
        reservations: await getReservationFromEvents(allEvents, organisationId),
    };
}

async function getEventsForProperty(
    property: PropertyDoc,
    startDateStr: string,
    endDateStr: string,
    organisationId: string,
): Promise<EventDoc[]> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const startTimestamp = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
    );
    const endTimestamp = Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate() + 1,
    );

    const allEvents = await getDocs(
        query(
            eventsCollection({
                id: "",
                organisationId,
                propertyId: property.id,
            }),
            where("date", ">=", startTimestamp),
            where("date", "<", endTimestamp),
        ),
    );

    return allEvents.docs.map(function (doc) {
        return { ...doc.data(), id: doc.id } as EventDoc;
    });
}

async function getReservationFromEvents(
    events: EventDoc[],
    organisationId: string,
): Promise<ReservationDocWithEventId[]> {
    const reservations: ReservationDocWithEventId[] = [];
    await Promise.all(
        events.map(async (event) => {
            const eventReservations = await getDocs(
                query(
                    reservationsCollection({
                        id: event.id,
                        organisationId,
                        propertyId: event.propertyId,
                    }),
                ),
            );

            eventReservations.docs.forEach((doc) => {
                const data = doc.data() as ReservationDoc;
                reservations.push({ ...data, eventId: event.id });
            });
        }),
    );

    return reservations;
}
