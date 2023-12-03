<script setup lang="ts">
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types";

import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import PieChart from "src/components/admin/analytics/PieChart.vue";
import BarChart from "src/components/admin/analytics/BarChart.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";

import { eventsCollection, reservationsCollection } from "@firetable/backend";
import { getDocs, query, where } from "firebase/firestore";
import type { EventDoc, PropertyDoc } from "@firetable/types";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { Loading } from "quasar";
import { usePropertiesStore } from "src/stores/usePropertiesStore";
import { format, subMonths } from "date-fns";
import { getColors } from "src/helpers/colors";
import type { AugmentedReservation, ReservationBucket } from "src/stores/analytics-store";
import { useAnalyticsStore } from "src/stores/analytics-store";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const analyticsStore = useAnalyticsStore();
const propertiesStore = usePropertiesStore();
const properties = computed(() => {
    return propertiesStore.properties.filter((property) => {
        return property.organisationId === props.organisationId;
    });
});
const selectedTab = ref<string | undefined>();

const selectedMonth = ref(format(new Date(), "yyyy-MM"));
const monthOptions = computed(() => {
    const options = [];
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        options.push({
            label: format(date, "MMMM yyyy"),
            value: format(date, "yyyy-MM"),
        });
    }
    return options.reverse();
});
const reservations = ref<ReservationBucket[]>([]);
const reservationsByActiveProperty = computed(() => {
    return reservations.value
        .filter((bucket) => bucket.propertyId === selectedTab.value)
        .flatMap((bucket) => bucket.reservations);
});

const confirmedVsUnconfirmed = computed((): PieChartData => {
    let confirmed = 0;
    let unconfirmed = 0;

    reservationsByActiveProperty.value.forEach((reservation) => {
        if (reservation.confirmed) {
            confirmed++;
        } else {
            unconfirmed++;
        }
    });

    return {
        labels: ["Confirmed", "Unconfirmed"],
        datasets: [
            {
                data: [confirmed, unconfirmed],
                backgroundColor: getColors(2).backgroundColors,
            },
        ],
    };
});

type AverageGuestsData = { averageGuests: number };

const avgGuestsPerReservation = computed((): AverageGuestsData => {
    let totalGuests = 0;
    let totalReservations = 0;
    reservationsByActiveProperty.value.forEach(({ numberOfGuests }) => {
        totalGuests += numberOfGuests;
        totalReservations++;
    });

    const avg = totalReservations ? totalGuests / totalReservations : 0;
    return { averageGuests: avg };
});

const reservationsByProperty = computed((): TimeSeriesData => {
    const propertyTotals: Record<string, number> = {};
    reservations.value.forEach(({ propertyName, reservations: res }) => {
        propertyTotals[propertyName] = res.length;
    });

    const labels = Object.keys(propertyTotals);
    const data = labels.map((name) => propertyTotals[name]);

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

const peakReservationHours = computed((): TimeSeriesData => {
    const hourlyTotals: Record<string, number> = {};

    reservationsByActiveProperty.value.forEach((reservation) => {
        const hour = reservation.time.split(":")[0]; // Assuming 'time' is like "14:00"
        hourlyTotals[hour] = (hourlyTotals[hour] || 0) + 1;
    });

    const sortedHours = Object.keys(hourlyTotals).sort(
        (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
    );
    const data = sortedHours.map((hour) => hourlyTotals[hour]);
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

const consumptionAnalysisCombined = computed(() => {
    let totalConsumption = 0;
    let confirmedConsumption = 0;
    let confirmedCount = 0;
    let unconfirmedCount = 0;

    reservationsByActiveProperty.value.forEach((reservation) => {
        totalConsumption += reservation.consumption;
        if (reservation.confirmed) {
            confirmedConsumption += reservation.consumption;
            confirmedCount++;
        } else {
            unconfirmedCount++;
        }
    });

    const averageTotal = totalConsumption / (confirmedCount + unconfirmedCount);
    const averageConfirmed = confirmedCount > 0 ? confirmedConsumption / confirmedCount : 0;
    const averageUnconfirmed =
        unconfirmedCount > 0 ? (totalConsumption - confirmedConsumption) / unconfirmedCount : 0;

    const { backgroundColors } = getColors(3);

    return {
        labels: ["Average Consumption"],
        datasets: [
            {
                label: "Confirmed",
                data: [averageConfirmed],
                backgroundColor: backgroundColors[0],
                stack: "Stack 0",
            },
            {
                label: "Unconfirmed",
                data: [averageUnconfirmed],
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

const guestDistributionAnalysis = computed((): TimeSeriesData => {
    const distribution: Record<string, number> = {};

    reservationsByActiveProperty.value.forEach(({ numberOfGuests }) => {
        const key = numberOfGuests.toString();
        distribution[key] = (distribution[key] || 0) + 1;
    });

    const labels = Object.keys(distribution).sort();
    const data = labels.map((key) => distribution[key]);

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

const reservationsByDayOfWeek = computed((): TimeSeriesData => {
    const dayOfWeekTotals: Record<string, number> = {};
    const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    reservationsByActiveProperty.value.forEach((reservation) => {
        const utcDate = new Date(reservation.date);
        const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
        const dayOfWeek = format(localDate, "EEEE");

        dayOfWeekTotals[dayOfWeek] = (dayOfWeekTotals[dayOfWeek] || 0) + 1;
    });

    const { backgroundColors, borderColors } = getColors(daysOfWeek.length);

    const data = daysOfWeek.map((day) => dayOfWeekTotals[day] || 0);
    return {
        labels: daysOfWeek,
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

onBeforeUnmount(() => {
    analyticsStore.clearData();
});

watch(
    [properties, selectedMonth],
    async () => {
        if (properties.value.length === 0) return;
        selectedTab.value = properties.value[0].id;
        await fetchData();
    },
    { immediate: true },
);

async function fetchData(): Promise<void> {
    const monthKey = selectedMonth.value;
    const cacheKey = monthKey + props.organisationId;

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
        const fetchedData = await getReservationFromEventsByUser(allEvents);
        reservations.value = fetchedData;

        analyticsStore.cacheData(cacheKey, fetchedData);
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
                        organisationId: props.organisationId,
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

async function getReservationFromEventsByUser(events: EventDoc[]): Promise<ReservationBucket[]> {
    const buckets: Record<string, ReservationBucket> = {};

    await Promise.all(
        events.map(async (event) => {
            const eventReservations = await getDocs(
                query(
                    reservationsCollection({
                        organisationId: props.organisationId,
                        propertyId: event.propertyId,
                        id: event.id,
                    }),
                ),
            );

            eventReservations.docs.forEach((doc) => {
                const reservationData = {
                    ...doc.data(),
                    id: doc.id,
                    date: event.date,
                } as AugmentedReservation;
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
</script>

<template>
    <div class="PageAdminAnalytics">
        <FTTitle title="Analytics" />
        <q-select
            v-model="selectedMonth"
            :options="monthOptions"
            label="Select Month"
            emit-value
            map-options
            @input="fetchData"
            rounded
            standout
        />

        <div v-if="reservations.length > 0">
            <BarChart :chart-data="reservationsByProperty" chart-title="Reservations by Property" />
            <q-tabs v-model="selectedTab" align="justify">
                <q-tab
                    v-for="property in properties"
                    :key="property.id"
                    :name="property.id"
                    :label="property.name"
                />
            </q-tabs>

            <q-tab-panels v-model="selectedTab" animated>
                <q-tab-panel
                    v-for="bucket in reservations"
                    :key="bucket.propertyName"
                    :name="bucket.propertyId"
                >
                    <q-chip color="primary">
                        Avg Guests per reservation:
                        {{ avgGuestsPerReservation.averageGuests.toFixed(2) }}
                    </q-chip>

                    <div class="row">
                        <PieChart
                            class="col-sm-12 col-md-6"
                            :chart-data="confirmedVsUnconfirmed"
                            chart-title="Confirmed vs. Unconfirmed"
                        />
                        <AdminEventReservationsByPerson
                            class="col-12"
                            :reservations="reservationsByActiveProperty"
                        />
                        <BarChart
                            class="col-sm-12 col-md-6"
                            :chart-data="peakReservationHours"
                            chart-title="Peak Reservation Hours"
                        />
                        <BarChart
                            class="col-sm-12 col-md-6"
                            :chart-data="consumptionAnalysisCombined"
                            chart-title="Consumption Data"
                        />
                        <BarChart
                            class="col-sm-12 col-md-6"
                            :chart-data="guestDistributionAnalysis"
                            chart-title="Guest Distribution"
                        />
                        <BarChart
                            class="col-sm-12 col-md-6"
                            :chart-data="reservationsByDayOfWeek"
                            chart-title="Reservations by Day of Week"
                        />
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </div>
        <FTCenteredText v-else> No Data For this month </FTCenteredText>
    </div>
</template>
