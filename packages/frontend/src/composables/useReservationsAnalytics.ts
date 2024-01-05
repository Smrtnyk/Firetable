import type { EventDoc, PropertyDoc, ReservationDoc } from "@firetable/types";
import type { Ref } from "vue";
import type {
    AugmentedPlannedReservation,
    AugmentedWalkInReservation,
    ReservationBucket,
} from "src/stores/analytics-store";
import { isAWalkInReservation, isPlannedReservation } from "@firetable/types";

import { fetchAnalyticsData } from "@firetable/backend";
import { onUnmounted, watch, computed, ref } from "vue";
import { Loading } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { format } from "date-fns";
import { useAnalyticsStore } from "src/stores/analytics-store";

export const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
const DEFAULT_SELECTED_DAY = "ALL";
const SELECTED_MONTH_FORMAT = "yyyy-MM";

export function useReservationsAnalytics(
    properties: Ref<PropertyDoc[]>,
    organisationId: string,
    selectedTab: Ref<string>,
) {
    const analyticsStore = useAnalyticsStore();
    const reservationBuckets = ref<ReservationBucket[]>([]);
    const selectedMonth = ref(format(new Date(), SELECTED_MONTH_FORMAT));
    const selectedDay = ref(DEFAULT_SELECTED_DAY);

    const plannedReservationsByActiveProperty = computed<AugmentedPlannedReservation[]>(() => {
        return reservationBuckets.value
            .filter((bucket) => bucket.propertyId === selectedTab.value)
            .flatMap((bucket) => bucket.plannedReservations);
    });

    const plannedReservationsByDay = computed(() => {
        const dayBucket: Record<string, AugmentedPlannedReservation[]> = {};

        plannedReservationsByActiveProperty.value.forEach((reservation) => {
            const date = new Date(reservation.date);
            const dayIndex = date.getUTCDay();
            const dayName = DAYS_OF_WEEK[dayIndex];

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

    function bucketize(
        events: EventDoc[],
        fetchedReservations: ReservationDoc[],
    ): ReservationBucket[] {
        const buckets: Record<string, ReservationBucket> = {};

        events.forEach((event) => {
            fetchedReservations.forEach((reservation) => {
                // TODO: include cancelled reservations in analytics
                if (isPlannedReservation(reservation) && reservation.cancelled) {
                    return;
                }

                if (!buckets[event.propertyId]) {
                    const propertyName = properties.value.find(function ({ id }) {
                        return id === event.propertyId;
                    })?.name;

                    if (!propertyName) {
                        return;
                    }

                    buckets[event.propertyId] = {
                        propertyId: event.propertyId,
                        propertyName,
                        plannedReservations: [],
                        walkInReservations: [],
                    };
                }

                const reservationData: AugmentedPlannedReservation | AugmentedWalkInReservation = {
                    ...reservation,
                    id: reservation.id,
                    date: event.date,
                };

                if (isPlannedReservation(reservationData)) {
                    buckets[event.propertyId]?.plannedReservations.push(reservationData);
                }

                if (isAWalkInReservation(reservationData)) {
                    buckets[event.propertyId]?.walkInReservations.push(reservationData);
                }
            });
        });

        return Object.values(buckets);
    }

    async function fetchData(): Promise<void> {
        const monthKey = selectedMonth.value;
        const cacheKey = monthKey + organisationId;

        // Check if data for the month is already in the store
        const cachedData = analyticsStore.getDataForMonth(cacheKey);
        if (cachedData) {
            reservationBuckets.value = cachedData;
            return;
        }

        // If not in store, fetch data
        reservationBuckets.value = [];
        Loading.show();

        try {
            const fetchedData = await fetchAnalyticsData(
                monthKey,
                organisationId,
                properties.value,
            );

            reservationBuckets.value = bucketize(fetchedData.events, fetchedData.reservations);
            analyticsStore.cacheData(cacheKey, reservationBuckets.value);

            // Set the active tab to the first day with reservations
            const firstDayWithReservations = Object.keys(plannedReservationsByDay.value)[0];
            if (firstDayWithReservations) {
                selectedDay.value = firstDayWithReservations;
            }
        } catch (e) {
            showErrorMessage(e);
        } finally {
            Loading.hide();
        }
    }

    return {
        reservationBuckets,
        plannedReservationsByActiveProperty,
        plannedReservationsByDay,
        selectedMonth,
        selectedDay,
    };
}
