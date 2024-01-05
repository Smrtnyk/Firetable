import type {
    EventDoc,
    PlannedReservationDoc,
    PropertyDoc,
    ReservationDoc,
} from "@firetable/types";
import { eventsCollection, reservationsCollection } from "./db.js";
import { isPlannedReservation } from "@firetable/types";
import { getDocs, query, where } from "firebase/firestore";

export type AugmentedReservation = PlannedReservationDoc & { date: number };

export interface ReservationBucket {
    propertyName: string;
    propertyId: string;
    reservations: AugmentedReservation[];
}

export async function fetchAnalyticsData(
    monthKey: string,
    organisationId: string,
    properties: PropertyDoc[],
): Promise<ReservationBucket[]> {
    const allEvents = await getEventsForProperties(properties, monthKey, organisationId);
    return getReservationFromEvents(allEvents, organisationId, properties);
}

async function getReservationFromEvents(
    events: EventDoc[],
    organisationId: string,
    properties: PropertyDoc[],
): Promise<ReservationBucket[]> {
    const buckets: Record<string, ReservationBucket> = {};

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

                if (!isPlannedReservation(data)) {
                    return;
                }

                const reservationData = {
                    ...data,
                    id: doc.id,
                    date: event.date,
                } as AugmentedReservation;

                // TODO: include cancelled reservations in analytics
                if (reservationData.cancelled) {
                    return;
                }

                if (!buckets[event.propertyId]) {
                    const property = properties.find((p) => p.id === event.propertyId);
                    const propertyName = property ? property.name : "Unknown Property";

                    buckets[event.propertyId] = {
                        propertyId: event.propertyId,
                        propertyName: propertyName,
                        reservations: [],
                    };
                }
                buckets[event.propertyId]?.reservations.push(reservationData);
            });
        }),
    );

    return Object.values(buckets);
}

async function getEventsForProperties(
    propertyDocs: PropertyDoc[],
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

    const allEvents = await Promise.all(
        propertyDocs.map((property) => {
            return getDocs(
                query(
                    eventsCollection({
                        organisationId: organisationId,
                        propertyId: property.id,
                        id: "",
                    }),
                    where("date", ">=", startTimestamp),
                    where("date", "<", endTimestamp),
                ),
            );
        }),
    );

    return allEvents
        .flatMap((snapshot) => snapshot.docs)
        .map((doc) => ({ ...doc.data(), id: doc.id }) as EventDoc);
}
