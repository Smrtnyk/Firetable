import type { EventDoc, PropertyDoc, ReservationDocWithEventId } from "@firetable/types";
import type { Ref } from "vue";
import type {
    AugmentedPlannedReservation,
    AugmentedWalkInReservation,
    ReservationBucket,
} from "src/stores/analytics-store";
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types";
import { isAWalkInReservation, isPlannedReservation } from "@firetable/types";
import { computed, onUnmounted, ref, watch } from "vue";
import { useAnalyticsStore } from "src/stores/analytics-store";

import { fetchAnalyticsData } from "@firetable/backend";
import { Loading } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { format } from "date-fns";
import { getColors } from "src/helpers/colors";
import { matchesProperty } from "es-toolkit/compat";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

        return {
            labels: ["Planned", "Walk-In"],
            datasets: [
                {
                    data: [planned, walkIn],
                    backgroundColor: getColors(2).backgroundColors,
                },
            ],
        };
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

        return {
            labels: ["Arrived", "No-Show"],
            datasets: [
                {
                    data: [arrived, pending],
                    backgroundColor: getColors(2).backgroundColors,
                },
            ],
        };
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

        const labels = Object.keys(propertyTotals);
        const data = labels.map(function (name) {
            return propertyTotals[name];
        });

        const { backgroundColors, borderColors } = getColors(labels.length);

        return {
            labels,
            datasets: [
                {
                    label: "Reservations by Property",
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                },
            ],
        };
    });

    const consumptionAnalysisCombined = computed(function () {
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

        return {
            labels: ["Average Consumption"],
            datasets: [
                {
                    label: "Arrived",
                    data: [averageArrived],
                    backgroundColor: backgroundColors[0],
                    stack: "Stack 0",
                },
                {
                    label: "Pending",
                    data: [averagePending],
                    backgroundColor: backgroundColors[1],
                    stack: "Stack 0",
                },
                {
                    label: "Total",
                    data: [averageTotal],
                    backgroundColor: backgroundColors[2],
                    stack: "Stack 0",
                },
            ],
        };
    });

    const peakReservationHours = computed<TimeSeriesData>(function () {
        const hourlyTotals = plannedReservationsByActiveProperty.value.reduce<
            Record<string, number>
        >(function (acc, reservation) {
            const hour = reservation.time.split(":")[0];
            acc[hour] = (acc[hour] ?? 0) + 1;
            return acc;
        }, {});

        const sortedHours = Object.keys(hourlyTotals).sort(function (a, b) {
            return Number.parseInt(a) - Number.parseInt(b);
        });
        const data = sortedHours.map(function (hour) {
            return hourlyTotals[hour];
        });
        const hoursCount = sortedHours.length;
        const { backgroundColors, borderColors } = getColors(hoursCount);

        return {
            labels: sortedHours,
            datasets: [
                {
                    label: "Reservations per Hour",
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                },
            ],
        };
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
        const data = labels.map(function (key) {
            return distribution[key];
        });

        const { backgroundColors, borderColors } = getColors(labels.length);

        return {
            labels,
            datasets: [
                {
                    label: "Guest Distribution",
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                },
            ],
        };
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

        const { backgroundColors, borderColors } = getColors(DAYS_OF_WEEK.length);

        const data = DAYS_OF_WEEK.map(function (day) {
            return dayOfWeekTotals[day] ?? 0;
        });
        return {
            labels: DAYS_OF_WEEK,
            datasets: [
                {
                    label: "Reservations by Day of Week",
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                },
            ],
        };
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

            reservationBuckets.value = bucketize(
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

function bucketize(
    events: EventDoc[],
    fetchedReservations: ReservationDocWithEventId[],
    properties: PropertyDoc[],
): ReservationBucket[] {
    const buckets: Record<string, ReservationBucket> = {};

    events.forEach(function (event) {
        // Find or create a bucket for each event's property
        if (!buckets[event.propertyId]) {
            const propertyName = properties.find(matchesProperty("id", event.propertyId))?.name;

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

        // Filter reservations for the current event
        fetchedReservations.forEach(function (reservation) {
            // Ensure the reservation is for the current event
            if (reservation.eventId !== event.id) {
                return;
            }

            // Skip cancelled reservations
            if (isPlannedReservation(reservation) && reservation.cancelled) {
                return;
            }

            const reservationData: AugmentedPlannedReservation | AugmentedWalkInReservation = {
                ...reservation,
                id: reservation.id,
                date: event.date,
            };

            if (isPlannedReservation(reservationData)) {
                buckets[event.propertyId].plannedReservations.push(reservationData);
            }

            if (isAWalkInReservation(reservationData)) {
                buckets[event.propertyId].walkInReservations.push(reservationData);
            }
        });
    });

    return Object.values(buckets);
}
