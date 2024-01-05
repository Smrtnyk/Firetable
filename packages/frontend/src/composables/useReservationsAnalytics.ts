import type { EventDoc, PropertyDoc, ReservationDoc } from "@firetable/types";
import type { Ref } from "vue";
import type { AugmentedReservation, ReservationBucket } from "src/stores/analytics-store";
import { isPlannedReservation } from "@firetable/types";

import { fetchAnalyticsData } from "@firetable/backend";
import { onUnmounted, watch, computed, ref } from "vue";
import { Loading } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { format } from "date-fns";
import { useAnalyticsStore } from "src/stores/analytics-store";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_SELECTED_DAY = "ALL";
const SELECTED_MONTH_FORMAT = "yyyy-MM";

export function useReservationsAnalytics(
    properties: Ref<PropertyDoc[]>,
    organisationId: string,
    selectedTab: Ref<string>,
) {
    const analyticsStore = useAnalyticsStore();
    const reservations = ref<ReservationBucket[]>([]);
    const selectedMonth = ref(format(new Date(), SELECTED_MONTH_FORMAT));
    const selectedDay = ref(DEFAULT_SELECTED_DAY);

    const reservationsByActiveProperty = computed<AugmentedReservation[]>(() => {
        return reservations.value
            .filter((bucket) => bucket.propertyId === selectedTab.value)
            .flatMap((bucket) => bucket.reservations);
    });

    const reservationsByDay = computed(() => {
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

    function bucketize(
        events: EventDoc[],
        fetchedReservations: ReservationDoc[],
    ): ReservationBucket[] {
        const buckets: Record<string, ReservationBucket> = {};

        events.forEach((event) => {
            fetchedReservations.forEach((reservation) => {
                if (!isPlannedReservation(reservation)) {
                    return;
                }

                const reservationData = {
                    ...reservation,
                    id: reservation.id,
                    date: event.date,
                } as AugmentedReservation;

                // TODO: include cancelled reservations in analytics
                if (reservationData.cancelled) {
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
                        reservations: [],
                    };
                }

                buckets[event.propertyId]?.reservations.push(reservationData);
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
            reservations.value = cachedData;
            return;
        }

        // If not in store, fetch data
        reservations.value = [];
        Loading.show();

        try {
            const fetchedData = await fetchAnalyticsData(
                monthKey,
                organisationId,
                properties.value,
            );

            reservations.value = bucketize(fetchedData.events, fetchedData.reservations);
            analyticsStore.cacheData(cacheKey, reservations.value);

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

    return {
        reservations,
        reservationsByActiveProperty,
        reservationsByDay,
        selectedMonth,
        selectedDay,
    };
}
