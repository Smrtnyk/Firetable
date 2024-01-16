<script setup lang="ts">
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import PieChart from "src/components/admin/analytics/PieChart.vue";
import BarChart from "src/components/admin/analytics/BarChart.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import ReservationAnalyticsCharts from "src/components/admin/analytics/ReservationAnalyticsCharts.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTCard from "src/components/FTCard.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";

import { computed, ref } from "vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { format, subMonths } from "date-fns";
import { useReservationsAnalytics } from "src/composables/useReservationsAnalytics";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const propertiesStore = usePropertiesStore();
const properties = computed(() => {
    return propertiesStore.getPropertiesByOrganisationId(props.organisationId);
});
const selectedTab = ref("");
const {
    reservationBuckets,
    selectedMonth,
    selectedDay,
    plannedReservationsByActiveProperty,
    plannedReservationsByDay,
    plannedArrivedVsNoShow,
    avgGuestsPerReservation,
    plannedReservationsByProperty,
    consumptionAnalysisCombined,
    peakReservationHours,
    guestDistributionAnalysis,
    reservationsByDayOfWeek,
    plannedVsWalkInReservations,
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

const chartInfos = computed(
    () =>
        [
            {
                data: peakReservationHours.value,
                title: "Peak Reservation Hours",
                type: "bar",
            },
            {
                data: consumptionAnalysisCombined.value,
                title: "Consumption Data",
                type: "bar",
            },
            {
                data: guestDistributionAnalysis.value,
                title: "Guest Distribution",
                type: "bar",
            },
            {
                data: reservationsByDayOfWeek.value,
                title: "Reservations by Day of Week",
                type: "bar",
            },
        ] as const,
);
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
            class="q-mb-md"
        />

        <div v-if="reservationBuckets.length > 0">
            <FTCard class="q-mb-md">
                <BarChart
                    :chart-data="plannedReservationsByProperty"
                    chart-title="Reservations by Property"
                />
            </FTCard>

            <FTTabs v-model="selectedTab">
                <q-tab
                    v-for="property in properties"
                    :key="property.id"
                    :name="property.id"
                    :label="property.name"
                />
            </FTTabs>

            <FTTabPanels v-model="selectedTab" class="bg-transparent">
                <q-tab-panel
                    v-for="bucket in reservationBuckets"
                    :key="bucket.propertyName"
                    :name="bucket.propertyId"
                    class="q-pa-none"
                >
                    <div class="row q-col-gutter-sm q-col-gutter-md-md">
                        <div class="col-12">
                            <q-chip color="primary">
                                Avg Guests per planned reservation:
                                {{ avgGuestsPerReservation.averagePlannedGuests.toFixed(2) }}
                            </q-chip>

                            <q-chip color="primary">
                                Avg Guests per walk-in reservation:
                                {{ avgGuestsPerReservation.averageWalkInGuests.toFixed(2) }}
                            </q-chip>
                        </div>

                        <FTCard class="col-sm-12 col-md-6">
                            <PieChart
                                :chart-data="plannedArrivedVsNoShow"
                                chart-title="Arrived vs. No-Show"
                            />
                        </FTCard>

                        <FTCard class="col-sm-12 col-md-6">
                            <PieChart
                                :chart-data="plannedVsWalkInReservations"
                                chart-title="Planned vs. Walk-In"
                            />
                        </FTCard>

                        <div class="col-12 q-my-md">
                            <FTTabs v-model="selectedDay">
                                <q-tab
                                    v-for="day in [...Object.keys(plannedReservationsByDay), 'ALL']"
                                    :key="day"
                                    :name="day"
                                    :label="day"
                                />
                            </FTTabs>

                            <FTTabPanels v-model="selectedDay" class="q-mt-md">
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
                            </FTTabPanels>
                        </div>

                        <FTCard
                            class="col-sm-12 col-md-6"
                            v-for="chartInfo in chartInfos"
                            :key="chartInfo.title"
                        >
                            <ReservationAnalyticsCharts
                                :chart-data="chartInfo.data"
                                :chart-title="chartInfo.title"
                                :chart-type="chartInfo.type"
                            />
                        </FTCard>
                    </div>
                </q-tab-panel>
            </FTTabPanels>
        </div>

        <FTCenteredText v-else> No Data For this month </FTCenteredText>
    </div>
</template>
