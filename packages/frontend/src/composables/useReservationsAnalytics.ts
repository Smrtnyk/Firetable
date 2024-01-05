import type { PropertyDoc } from "@firetable/types";
import type { Ref } from "vue";
import type { AugmentedReservation, ReservationBucket } from "@firetable/backend";

import { fetchAnalyticsData } from "@firetable/backend";
import { onUnmounted, watch, computed, ref } from "vue";
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

    return {
        reservations,
        reservationsByActiveProperty,
        reservationsByDay,
        selectedMonth,
        selectedDay,
    };
}
