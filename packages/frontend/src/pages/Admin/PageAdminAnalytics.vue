<script setup lang="ts">
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types";

import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import PieChart from "src/components/admin/analytics/PieChart.vue";
import BarChart from "src/components/admin/analytics/BarChart.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import FTTabs from "src/components/FTTabs.vue";

import { computed, ref } from "vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { format, subMonths } from "date-fns";
import { getColors } from "src/helpers/colors";
import { DAYS_OF_WEEK, useReservationsAnalytics } from "src/composables/useReservationsAnalytics";
import { storeToRefs } from "pinia";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const { properties: allProperties } = storeToRefs(usePropertiesStore());
const properties = computed(() => {
    return allProperties.value.filter((property) => {
        return property.organisationId === props.organisationId;
    });
});
const selectedTab = ref("");
const {
    reservationBuckets,
    selectedMonth,
    selectedDay,
    plannedReservationsByActiveProperty,
    plannedReservationsByDay,
} = useReservationsAnalytics(properties, props.organisationId, selectedTab);

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

const plannedArrivedVsNoShow = computed((): PieChartData => {
    let confirmed = 0;
    let unconfirmed = 0;

    plannedReservationsByActiveProperty.value.forEach((reservation) => {
        if (reservation.arrived) {
            confirmed++;
        } else {
            unconfirmed++;
        }
    });

    return {
        labels: ["Arrived", "No-Show"],
        datasets: [
            {
                data: [confirmed, unconfirmed],
                backgroundColor: getColors(2).backgroundColors,
            },
        ],
    };
});

const avgGuestsPerReservation = computed(() => {
    let totalGuests = 0;
    let totalReservations = 0;
    plannedReservationsByActiveProperty.value.forEach(({ numberOfGuests }) => {
        totalGuests += Number(numberOfGuests);
        totalReservations++;
    });

    const avg = totalReservations ? totalGuests / totalReservations : 0;
    return { averageGuests: avg };
});

const plannedReservationsByProperty = computed<TimeSeriesData>(() => {
    const propertyTotals: Record<string, number> = {};
    reservationBuckets.value.forEach(({ propertyName, plannedReservations: res }) => {
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

const peakReservationHours = computed<TimeSeriesData>(() => {
    const hourlyTotals: Record<string, number> = {};

    plannedReservationsByActiveProperty.value.forEach((reservation) => {
        const hour = reservation.time.split(":")[0]; // Assuming 'time' is like "14:00"
        hourlyTotals[hour] = (hourlyTotals[hour] || 0) + 1;
    });

    const sortedHours = Object.keys(hourlyTotals).sort(
        (a, b) => Number.parseInt(a) - Number.parseInt(b),
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

    plannedReservationsByActiveProperty.value.forEach((reservation) => {
        const consumption = Number(reservation.consumption);
        totalConsumption += consumption;
        if (reservation.arrived) {
            confirmedConsumption += consumption;
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

const guestDistributionAnalysis = computed<TimeSeriesData>(() => {
    const distribution: Record<string, number> = {};

    plannedReservationsByActiveProperty.value.forEach(({ numberOfGuests }) => {
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

const reservationsByDayOfWeek = computed<TimeSeriesData>(() => {
    const dayOfWeekTotals: Record<string, number> = {};

    plannedReservationsByActiveProperty.value.forEach((reservation) => {
        const utcDate = new Date(reservation.date);
        const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
        const dayOfWeek = format(localDate, "EEEE");

        dayOfWeekTotals[dayOfWeek] = (dayOfWeekTotals[dayOfWeek] || 0) + 1;
    });

    const { backgroundColors, borderColors } = getColors(DAYS_OF_WEEK.length);

    const data = DAYS_OF_WEEK.map((day) => dayOfWeekTotals[day] || 0);
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
            rounded
            standout
        />

        <div v-if="reservationBuckets.length > 0">
            <BarChart
                :chart-data="plannedReservationsByProperty"
                chart-title="Reservations by Property"
            />
            <FTTabs v-model="selectedTab">
                <q-tab
                    v-for="property in properties"
                    :key="property.id"
                    :name="property.id"
                    :label="property.name"
                />
            </FTTabs>

            <q-tab-panels v-model="selectedTab" animated>
                <q-tab-panel
                    v-for="bucket in reservationBuckets"
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
                            :chart-data="plannedArrivedVsNoShow"
                            chart-title="Arrived vs. No-Show"
                        />
                        <div class="col-12 q-my-md">
                            <FTTabs v-model="selectedDay">
                                <q-tab
                                    v-for="day in [...Object.keys(plannedReservationsByDay), 'ALL']"
                                    :key="day"
                                    :name="day"
                                    :label="day"
                                />
                            </FTTabs>

                            <q-tab-panels v-model="selectedDay" animated class="q-mt-md">
                                <q-tab-panel
                                    class="q-pa-none"
                                    v-for="(reservations, day) in {
                                        ...plannedReservationsByDay,
                                        ALL: plannedReservationsByActiveProperty,
                                    }"
                                    :key="day"
                                    :name="day"
                                >
                                    <AdminEventReservationsByPerson :reservations="reservations" />
                                </q-tab-panel>
                            </q-tab-panels>
                        </div>

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
