import type {
    EventDoc,
    PropertyDoc,
    ReservationDoc,
    ReservationDocWithEventId,
} from "@firetable/types";
import { eventsCollection, reservationsCollection } from "./db.js";
import { getDocs, query, where } from "firebase/firestore";

export async function fetchAnalyticsData(
    monthKey: string,
    organisationId: string,
    property: PropertyDoc,
): Promise<{ reservations: ReservationDocWithEventId[]; events: EventDoc[] }> {
    const allEvents = await getEventsForProperty(property, monthKey, organisationId);
    return {
        events: allEvents,
        reservations: await getReservationFromEvents(allEvents, organisationId),
    };
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
                        organisationId,
                        propertyId: event.propertyId,
                        id: event.id,
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

async function getEventsForProperty(
    property: PropertyDoc,
    month: string,
    organisationId: string,
): Promise<EventDoc[]> {
    // Create a Date object based on the provided month string
    const startDate = new Date(month);

    // Create a Date object for the end date (start date + 1 month)
    const endDate = new Date(month);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);

    // Convert start and end dates to UTC timestamps
    const startTimestamp = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
    );
    const endTimestamp = Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
    );

    const allEvents = await getDocs(
        query(
            eventsCollection({
                organisationId,
                propertyId: property.id,
                id: "",
            }),
            where("date", ">=", startTimestamp),
            where("date", "<", endTimestamp),
        ),
    );

    return allEvents.docs.map(function (doc) {
        return { ...doc.data(), id: doc.id } as EventDoc;
    });
}
