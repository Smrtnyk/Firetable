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
            reservationBuckets.value.find(function (bucket) {
                return bucket.propertyId === selectedTab.value;
            }) ?? {
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
        const dayBucket: Record<string, AugmentedPlannedReservation[]> = {};

        plannedReservationsByActiveProperty.value.forEach(function (reservation) {
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
            Object.entries(dayBucket).filter(function ([, reservationsVal]) {
                return reservationsVal.length > 0;
            }),
        );
    });

    const plannedArrivedVsNoShow = computed<PieChartData>(function () {
        let arrived = 0;
        let pending = 0;

        plannedReservationsByActiveProperty.value.forEach(function (reservation) {
            if (reservation.arrived) {
                arrived++;
                return;
            }

            pending++;
        });

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
        let totalPlannedGuests = 0;
        let totalPlannedReservations = 0;
        let totalWalkInGuests = 0;
        let totalWalkInReservations = 0;

        currentPropertyReservations.value.plannedReservations.forEach(function ({
            numberOfGuests,
        }) {
            totalPlannedGuests += numberOfGuests;
            totalPlannedReservations++;
        });

        currentPropertyReservations.value.walkInReservations.forEach(function ({ numberOfGuests }) {
            totalWalkInGuests += numberOfGuests;
            totalWalkInReservations++;
        });

        const averagePlannedGuests =
            totalPlannedReservations > 0 ? totalPlannedGuests / totalPlannedReservations : 0;
        const averageWalkInGuests =
            totalWalkInReservations > 0 ? totalWalkInGuests / totalWalkInReservations : 0;

        return { averagePlannedGuests, averageWalkInGuests };
    });

    const plannedReservationsByProperty = computed<TimeSeriesData>(() => {
        const propertyTotals: Record<string, number> = {};
        reservationBuckets.value.forEach(function ({ propertyName, plannedReservations: res }) {
            propertyTotals[propertyName] = res.length;
        });

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
        let totalConsumption = 0;
        let arrivedConsumption = 0;
        let arrivedCount = 0;
        let pendingCount = 0;

        plannedReservationsByActiveProperty.value.forEach(function (reservation) {
            const consumption = reservation.consumption;
            totalConsumption += consumption;
            if (reservation.arrived) {
                arrivedConsumption += consumption;
                arrivedCount++;
            } else {
                pendingCount++;
            }
        });

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
        const hourlyTotals: Record<string, number> = {};

        plannedReservationsByActiveProperty.value.forEach(function (reservation) {
            const hour = reservation.time.split(":")[0];
            hourlyTotals[hour] = (hourlyTotals[hour] ?? 0) + 1;
        });

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
        const distribution: Record<string, number> = {};

        plannedReservationsByActiveProperty.value.forEach(function ({ numberOfGuests }) {
            const key = numberOfGuests.toString();
            distribution[key] = (distribution[key] ?? 0) + 1;
        });

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
        const dayOfWeekTotals: Record<string, number> = {};

        plannedReservationsByActiveProperty.value.forEach(function (reservation) {
            const utcDate = new Date(reservation.date);
            const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60_000);
            const dayOfWeek = format(localDate, "EEEE");

            dayOfWeekTotals[dayOfWeek] = (dayOfWeekTotals[dayOfWeek] ?? 0) + 1;
        });

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
            const propertyName = properties.find(function ({ id }) {
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
