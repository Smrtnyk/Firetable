import type { PropertyDoc } from "@firetable/types";
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types.js";
import type { AugmentedPlannedReservation, ReservationBucket } from "src/stores/analytics-store.js";
import type { DateRange } from "src/types";
import type { Ref } from "vue";

import { fetchAnalyticsData } from "@firetable/backend";
import { format } from "date-fns";
import { Loading } from "quasar";
import { getColors } from "src/helpers/colors.js";
import { getLocalizedDaysOfWeek } from "src/helpers/date-utils";
import { showErrorMessage } from "src/helpers/ui-helpers.js";
import { useAnalyticsStore } from "src/stores/analytics-store.js";
import { computed, onUnmounted, ref } from "vue";

import { bucketizeReservations } from "./bucketize-reservations.js";
const DEFAULT_SELECTED_DAY = "ALL";

const ENG_DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useReservationsAnalytics(
    property: Ref<PropertyDoc>,
    organisationId: string,
    locale: string,
) {
    const analyticsStore = useAnalyticsStore();
    const reservationBucket = ref<ReservationBucket>();
    const selectedDay = ref(DEFAULT_SELECTED_DAY);

    const DAYS_OF_WEEK = computed(() => getLocalizedDaysOfWeek(locale));

    const currentPropertyReservations = computed(function () {
        return (
            reservationBucket.value ?? {
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
                itemStyle: { color: backgroundColors[0] },
                name: "Planned",
                value: planned,
            },
            {
                itemStyle: { color: backgroundColors[1] },
                name: "Walk-In",
                value: walkIn,
            },
        ];
    });

    const plannedReservationsByDay = computed(function () {
        const dayBucket = plannedReservationsByActiveProperty.value.reduce<
            Record<string, AugmentedPlannedReservation[]>
        >(function (bucket, reservation) {
            const date = new Date(reservation.date);
            const dayIndex = date.getUTCDay();
            const dayName = DAYS_OF_WEEK.value[dayIndex];

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
                itemStyle: { color: backgroundColors[0] },
                name: "Arrived",
                value: arrived,
            },
            {
                itemStyle: { color: backgroundColors[1] },
                name: "No-Show",
                value: pending,
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
        const { backgroundColors } = getColors(1);

        return [
            {
                data: [reservationBucket.value?.plannedReservations.length ?? 0],
                itemStyle: { color: backgroundColors[0] },
                name: "Reservations",
            },
        ];
    });

    const consumptionAnalysisCombined = computed<TimeSeriesData>(function () {
        const { arrivedConsumption, arrivedCount, pendingCount, totalConsumption } =
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
                    arrivedConsumption: 0,
                    arrivedCount: 0,
                    pendingCount: 0,
                    totalConsumption: 0,
                },
            );

        const averageTotal = totalConsumption / (arrivedCount + pendingCount);
        const averageArrived = arrivedCount > 0 ? arrivedConsumption / arrivedCount : 0;
        const averagePending =
            pendingCount > 0 ? (totalConsumption - arrivedConsumption) / pendingCount : 0;

        const { backgroundColors } = getColors(3);

        return [
            {
                data: [toTwoDecimals(averageTotal)],
                itemStyle: { color: backgroundColors[0] },
                name: "Total",
                stack: "consumption",
            },
            {
                data: [toTwoDecimals(averageArrived)],
                itemStyle: { color: backgroundColors[1] },
                name: "Arrived",
                stack: "consumption",
            },
            {
                data: [toTwoDecimals(averagePending)],
                itemStyle: { color: backgroundColors[2] },
                name: "Pending",
                stack: "consumption",
            },
        ];
    });

    const peakHoursLabels = computed(function () {
        const hourlyTotals = Object.keys(
            plannedReservationsByActiveProperty.value.reduce<Record<string, number>>(function (
                acc,
                reservation,
            ) {
                const hour = reservation.time.split(":")[0];
                acc[hour] = (acc[hour] ?? 0) + 1;
                return acc;
            }, {}),
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
                data: sortedHours.map((hour) => hourlyTotals[hour]),
                itemStyle: { color: backgroundColors[0] },
                name: "Reservations per Hour",
            },
        ];
    });

    const guestDistributionLabels = computed(function () {
        return Object.keys(
            plannedReservationsByActiveProperty.value.reduce<Record<string, number>>(function (
                acc,
                { numberOfGuests },
            ) {
                const key = numberOfGuests.toString();
                acc[key] = (acc[key] ?? 0) + 1;
                return acc;
            }, {}),
        ).sort((a, b) => Number(a) - Number(b));
    });

    const propertyLabels = computed(() => [property.value.name]);
    const guestDistributionAnalysis = computed<TimeSeriesData>(function () {
        const distribution = plannedReservationsByActiveProperty.value.reduce<
            Record<string, number>
        >(function (acc, { numberOfGuests }) {
            const key = numberOfGuests.toString();
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {});

        const labels = sortNumericStrings(Object.keys(distribution));
        const { backgroundColors } = getColors(1);

        return [
            {
                data: labels.map((key) => distribution[key]),
                itemStyle: { color: backgroundColors[0] },
                name: "Guest Distribution",
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
                data: ENG_DAYS_OF_WEEK.map((day) => dayOfWeekTotals[day] ?? 0),
                itemStyle: { color: backgroundColors[0] },
                name: "Reservations by Day",
            },
        ];
    });

    onUnmounted(function () {
        analyticsStore.clearData();
    });

    async function fetchData(dateRange: DateRange): Promise<void> {
        if (!dateRange.startDate || !dateRange.endDate) {
            return;
        }

        const cacheKey = `${dateRange.startDate}_${dateRange.endDate}_${organisationId}`;

        const cachedData = analyticsStore.getDataForRange(cacheKey, property.value.id);
        if (cachedData) {
            reservationBucket.value = cachedData;
            return;
        }

        reservationBucket.value = undefined;
        Loading.show();

        try {
            const fetchedData = await fetchAnalyticsData(
                dateRange.startDate,
                dateRange.endDate,
                organisationId,
                property.value,
            );

            reservationBucket.value = bucketizeReservations(
                fetchedData.events,
                fetchedData.reservations,
            );
            analyticsStore.cacheData(cacheKey, reservationBucket.value, property.value.id);

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
        avgGuestsPerReservation,
        consumptionAnalysisCombined,
        DAYS_OF_WEEK,
        fetchData,
        guestDistributionAnalysis,
        guestDistributionLabels,
        peakHoursLabels,
        peakReservationHours,
        plannedArrivedVsNoShow,
        plannedReservationsByActiveProperty,
        plannedReservationsByDay,
        plannedReservationsByProperty,
        plannedVsWalkInReservations,
        propertyLabels,
        reservationBucket,
        reservationsByDayOfWeek,
        selectedDay,
    };
}

function sortNumericStrings(strings: string[]): string[] {
    return strings.sort((a, b) => Number(a) - Number(b));
}

function toTwoDecimals(num: number): number {
    return Number.parseFloat(num.toFixed(2));
}
