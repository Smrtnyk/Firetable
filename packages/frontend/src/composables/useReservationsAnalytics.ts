import type { EventDoc, PropertyDoc, ReservationDoc } from "@firetable/types";
import type { AugmentedReservation, ReservationBucket } from "src/stores/analytics-store";
import type { Ref } from "vue";
import { onUnmounted, watch, computed, ref } from "vue";
import { isPlannedReservation } from "@firetable/types";
import { getDocs, query, where } from "firebase/firestore";
import { eventsCollection, reservationsCollection } from "@firetable/backend";
import { Loading } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { format } from "date-fns";
import { useAnalyticsStore } from "src/stores/analytics-store";

export function useReservationsAnalytics(
    properties: Ref<PropertyDoc[]>,
    organisationId: string,
    selectedTab: Ref<string>,
) {
    const analyticsStore = useAnalyticsStore();

    const reservations = ref<ReservationBucket[]>([]);
    const selectedMonth = ref(format(new Date(), "yyyy-MM"));
    const selectedDay = ref("ALL");

    const reservationsByActiveProperty = computed<AugmentedReservation[]>(() => {
        return reservations.value
            .filter((bucket) => bucket.propertyId === selectedTab.value)
            .flatMap((bucket) => bucket.reservations);
    });

    const reservationsByDay = computed(() => {
        const daysOfWeek = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const dayBucket: Record<string, AugmentedReservation[]> = {};

        reservationsByActiveProperty.value.forEach((reservation) => {
            const date = new Date(reservation.date);
            const dayIndex = date.getUTCDay();
            const dayName = daysOfWeek[dayIndex];

            if (!dayBucket[dayName]) {
                dayBucket[dayName] = [];
            }
            dayBucket[dayName].push(reservation);
        });

        // Filter out days with no reservations
        return Object.fromEntries(
            Object.entries(dayBucket).filter(([, reservationsVal]) => reservationsVal.length > 0),
        );
    });

    const stopWatch = watch(
        [properties, selectedMonth],
        async () => {
            if (properties.value.length === 0) {
                return;
            }
            selectedTab.value = properties.value[0].id;
            await fetchData();
        },
        { immediate: true },
    );

    onUnmounted(() => {
        analyticsStore.clearData();
        stopWatch();
    });

    async function getReservationFromEvents(events: EventDoc[]): Promise<ReservationBucket[]> {
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
                    if (reservationData.cancelled) return;

                    if (!buckets[event.propertyId]) {
                        const property = properties.value.find((p) => p.id === event.propertyId);
                        const propertyName = property ? property.name : "Unknown Property";

                        buckets[event.propertyId] = {
                            propertyId: event.propertyId,
                            propertyName: propertyName,
                            reservations: [],
                        };
                    }
                    buckets[event.propertyId].reservations.push(reservationData);
                });
            }),
        );

        return Object.values(buckets);
    }

    async function fetchData(): Promise<void> {
        const monthKey = selectedMonth.value;
        const cacheKey = monthKey + organisationId;

        // Check if data for the month is already in the store
        const cachedData = analyticsStore.getDataForMonth(cacheKey);
        if (cachedData) {
            reservations.value = cachedData;
            return;
        }

        // If not in store, fetch data
        reservations.value = [];
        Loading.show();

        try {
            const allEvents = await getEventsForProperties(properties.value, monthKey);
            const fetchedData = await getReservationFromEvents(allEvents);
            reservations.value = fetchedData;

            analyticsStore.cacheData(cacheKey, fetchedData);

            // Set the active tab to the first day with reservations
            const firstDayWithReservations = Object.keys(reservationsByDay.value)[0];
            if (firstDayWithReservations) {
                selectedDay.value = firstDayWithReservations;
            }
        } catch (e) {
            showErrorMessage(e);
        } finally {
            Loading.hide();
        }
    }

    async function getEventsForProperties(
        propertyDocs: PropertyDoc[],
        month: string,
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

    return {
        reservations,
        reservationsByActiveProperty,
        reservationsByDay,
        selectedMonth,
        selectedDay,
    };
}
