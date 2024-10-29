import type { PropertyDoc } from "@firetable/types";
import type { Ref } from "vue";
import type { AugmentedPlannedReservation, ReservationBucket } from "src/stores/analytics-store.js";
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types.js";
import { computed, onUnmounted, ref, watch } from "vue";
import { useAnalyticsStore } from "src/stores/analytics-store.js";

import { fetchAnalyticsData } from "@firetable/backend";
import { Loading } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers.js";
import { format } from "date-fns";
import { getColors } from "src/helpers/colors.js";
import { matchesProperty } from "es-toolkit/compat";
import { bucketizeReservations } from "src/composables/analytics/bucketize-reservations.js";

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

    const currentPropertyReservations = computed(function () {
        // Find the bucket for the selected property
        return (
            reservationBuckets.value.find(matchesProperty("propertyId", selectedTab.value)) ?? {
                plannedReservations: [],
                walkInReservations: [],
            }
        );
    });

    const plannedReservationsByActiveProperty = computed<AugmentedPlannedReservation[]>(
        function () {
            return currentPropertyReservations.value.plannedReservations;
        },
    );

    const plannedVsWalkInReservations = computed<PieChartData>(function () {
        const planned = currentPropertyReservations.value.plannedReservations.length;
        const walkIn = currentPropertyReservations.value.walkInReservations.length;
        const { backgroundColors } = getColors(2);

        return [
            {
                name: "Planned",
                value: planned,
                itemStyle: { color: backgroundColors[0] },
            },
            {
                name: "Walk-In",
                value: walkIn,
                itemStyle: { color: backgroundColors[1] },
            },
        ];
    });

    const plannedReservationsByDay = computed(function () {
        const dayBucket = plannedReservationsByActiveProperty.value.reduce<
            Record<string, AugmentedPlannedReservation[]>
        >(function (bucket, reservation) {
            const date = new Date(reservation.date);
            const dayIndex = date.getUTCDay();
            const dayName = DAYS_OF_WEEK[dayIndex];

            if (!bucket[dayName]) {
                bucket[dayName] = [];
            }

            bucket[dayName].push(reservation);
            return bucket;
        }, {});

        // Filter out days with no reservations
        return Object.fromEntries(
            Object.entries(dayBucket).filter(function ([, reservationsVal]) {
                return reservationsVal.length > 0;
            }),
        );
    });

    const plannedArrivedVsNoShow = computed<PieChartData>(function () {
        const { arrived, pending } = plannedReservationsByActiveProperty.value.reduce(
            function (acc, reservation) {
                if (reservation.arrived) {
                    acc.arrived += 1;
                } else {
                    acc.pending += 1;
                }
                return acc;
            },
            { arrived: 0, pending: 0 },
        );

        const { backgroundColors } = getColors(2);

        return [
            {
                name: "Arrived",
                value: arrived,
                itemStyle: { color: backgroundColors[0] },
            },
            {
                name: "No-Show",
                value: pending,
                itemStyle: { color: backgroundColors[1] },
            },
        ];
    });

    const avgGuestsPerReservation = computed(function () {
        const { totalPlannedGuests, totalPlannedReservations } =
            currentPropertyReservations.value.plannedReservations.reduce(
                function (acc, { numberOfGuests }) {
                    acc.totalPlannedGuests += numberOfGuests;
                    acc.totalPlannedReservations += 1;
                    return acc;
                },
                { totalPlannedGuests: 0, totalPlannedReservations: 0 },
            );

        const { totalWalkInGuests, totalWalkInReservations } =
            currentPropertyReservations.value.walkInReservations.reduce(
                function (acc, { numberOfGuests }) {
                    acc.totalWalkInGuests += numberOfGuests;
                    acc.totalWalkInReservations += 1;
                    return acc;
                },
                { totalWalkInGuests: 0, totalWalkInReservations: 0 },
            );

        const averagePlannedGuests =
            totalPlannedReservations > 0 ? totalPlannedGuests / totalPlannedReservations : 0;
        const averageWalkInGuests =
            totalWalkInReservations > 0 ? totalWalkInGuests / totalWalkInReservations : 0;

        return { averagePlannedGuests, averageWalkInGuests };
    });

    const plannedReservationsByProperty = computed<TimeSeriesData>(function () {
        const propertyTotals = reservationBuckets.value.reduce<Record<string, number>>(function (
            acc,
            { propertyName, plannedReservations: res },
        ) {
            acc[propertyName] = res.length;
            return acc;
        }, {});

        const { backgroundColors } = getColors(1);

        return [
            {
                name: "Reservations by Property",
                data: Object.values(propertyTotals),
                itemStyle: { color: backgroundColors[0] },
            },
        ];
    });

    const consumptionAnalysisCombined = computed<TimeSeriesData>(function () {
        const { totalConsumption, arrivedConsumption, arrivedCount, pendingCount } =
            plannedReservationsByActiveProperty.value.reduce(
                function (acc, reservation) {
                    const consumption = reservation.consumption;
                    acc.totalConsumption += consumption;

                    if (reservation.arrived) {
                        acc.arrivedConsumption += consumption;
                        acc.arrivedCount += 1;
                    } else {
                        acc.pendingCount += 1;
                    }

                    return acc;
                },
                {
                    totalConsumption: 0,
                    arrivedConsumption: 0,
                    arrivedCount: 0,
                    pendingCount: 0,
                },
            );

        const averageTotal = totalConsumption / (arrivedCount + pendingCount);
        const averageArrived = arrivedCount > 0 ? arrivedConsumption / arrivedCount : 0;
        const averagePending =
            pendingCount > 0 ? (totalConsumption - arrivedConsumption) / pendingCount : 0;

        const { backgroundColors } = getColors(3);

        return [
            {
                name: "Total",
                data: [toTwoDecimals(averageTotal)],
                itemStyle: { color: backgroundColors[0] },
                stack: "consumption",
            },
            {
                name: "Arrived",
                data: [toTwoDecimals(averageArrived)],
                itemStyle: { color: backgroundColors[1] },
                stack: "consumption",
            },
            {
                name: "Pending",
                data: [toTwoDecimals(averagePending)],
                itemStyle: { color: backgroundColors[2] },
                stack: "consumption",
            },
        ];
    });

    const peakHoursLabels = computed(() => {
        const hourlyTotals = Object.keys(
            plannedReservationsByActiveProperty.value.reduce<Record<string, number>>(
                (acc, reservation) => {
                    const hour = reservation.time.split(":")[0];
                    acc[hour] = (acc[hour] ?? 0) + 1;
                    return acc;
                },
                {},
            ),
        ).sort((a, b) => Number.parseInt(a) - Number.parseInt(b));

        // Format hours to be more readable (e.g., "08:00", "14:00")
        return hourlyTotals.map((hour) => `${hour.padStart(2, "0")}:00`);
    });
    const peakReservationHours = computed<TimeSeriesData>(function () {
        const hourlyTotals = plannedReservationsByActiveProperty.value.reduce<
            Record<string, number>
        >(function (acc, reservation) {
            const hour = reservation.time.split(":")[0];
            acc[hour] = (acc[hour] ?? 0) + 1;
            return acc;
        }, {});

        const sortedHours = Object.keys(hourlyTotals).sort(
            (a, b) => Number.parseInt(a) - Number.parseInt(b),
        );
        const { backgroundColors } = getColors(1);

        return [
            {
                name: "Reservations per Hour",
                data: sortedHours.map((hour) => hourlyTotals[hour]),
                itemStyle: { color: backgroundColors[0] },
            },
        ];
    });

    const guestDistributionLabels = computed(() => {
        return Object.keys(
            plannedReservationsByActiveProperty.value.reduce<Record<string, number>>(
                (acc, { numberOfGuests }) => {
                    const key = numberOfGuests.toString();
                    acc[key] = (acc[key] ?? 0) + 1;
                    return acc;
                },
                {},
            ),
        ).sort();
    });

    const propertyLabels = computed(() => {
        return reservationBuckets.value.map((bucket) => bucket.propertyName);
    });
    const guestDistributionAnalysis = computed<TimeSeriesData>(function () {
        const distribution = plannedReservationsByActiveProperty.value.reduce<
            Record<string, number>
        >(function (acc, { numberOfGuests }) {
            const key = numberOfGuests.toString();
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(distribution).sort();
        const { backgroundColors } = getColors(1);

        return [
            {
                name: "Guest Distribution",
                data: labels.map((key) => distribution[key]),
                itemStyle: { color: backgroundColors[0] },
            },
        ];
    });

    const reservationsByDayOfWeek = computed<TimeSeriesData>(function () {
        const dayOfWeekTotals = plannedReservationsByActiveProperty.value.reduce<
            Record<string, number>
        >(function (acc, reservation) {
            const utcDate = new Date(reservation.date);
            const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60_000);
            const dayOfWeek = format(localDate, "EEEE");

            acc[dayOfWeek] = (acc[dayOfWeek] ?? 0) + 1;
            return acc;
        }, {});

        const { backgroundColors } = getColors(1);

        return [
            {
                name: "Reservations by Day",
                data: DAYS_OF_WEEK.map((day) => dayOfWeekTotals[day] ?? 0),
                itemStyle: { color: backgroundColors[0] },
            },
        ];
    });

    const stopWatch = watch(
        [properties, selectedMonth],
        async function () {
            if (properties.value.length === 0) {
                return;
            }
            selectedTab.value = properties.value[0].id;
            await fetchData();
        },
        { immediate: true },
    );

    onUnmounted(function () {
        analyticsStore.clearData();
        stopWatch();
    });

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

            reservationBuckets.value = bucketizeReservations(
                fetchedData.events,
                fetchedData.reservations,
                properties.value,
            );
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
        propertyLabels,
        peakHoursLabels,
        guestDistributionLabels,
        reservationBuckets,
        plannedReservationsByActiveProperty,
        plannedReservationsByDay,
        selectedMonth,
        selectedDay,
        plannedArrivedVsNoShow,
        avgGuestsPerReservation,
        plannedReservationsByProperty,
        consumptionAnalysisCombined,
        peakReservationHours,
        guestDistributionAnalysis,
        reservationsByDayOfWeek,
        plannedVsWalkInReservations,
    };
}

function toTwoDecimals(num: number): number {
    return Number.parseFloat(num.toFixed(2));
}
