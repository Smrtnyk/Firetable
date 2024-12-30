<script setup lang="ts">
import FTTitle from "src/components/FTTitle.vue";
import PieChart from "src/components/admin/analytics/PieChart.vue";
import BarChart from "src/components/admin/analytics/BarChart.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import ReservationAnalyticsCharts from "src/components/admin/analytics/ReservationAnalyticsCharts.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTCard from "src/components/FTCard.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import FTTimeframeSelector from "src/components/FTTimeframeSelector.vue";

import { computed, ref, watch } from "vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { useReservationsAnalytics } from "src/composables/analytics/useReservationsAnalytics.js";
import { useI18n } from "vue-i18n";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { locale } = useI18n();
const props = defineProps<Props>();
const propertiesStore = usePropertiesStore();
const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);
const selected = ref({
    startDate: thirtyDaysAgo.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
});
const property = computed(function () {
    return propertiesStore.getPropertyById(props.propertyId);
});
const {
    DAYS_OF_WEEK,
    guestDistributionLabels,
    peakHoursLabels,
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
    fetchData,
} = useReservationsAnalytics(property, props.organisationId, locale.value);

watch(
    () => selected.value,
    function (newValue) {
        if (newValue.startDate && newValue.endDate) {
            fetchData(newValue);
        }
    },
);

const chartInfos = computed(function () {
    return [
        {
            data: peakReservationHours.value,
            title: "Peak Reservation Hours",
            labels: peakHoursLabels.value,
            type: "bar",
        },
        {
            data: consumptionAnalysisCombined.value,
            title: "Consumption Data",
            type: "bar",
            labels: ["Consumption"] as string[],
        },
        {
            data: guestDistributionAnalysis.value,
            title: "Guest Distribution",
            type: "bar",
            labels: guestDistributionLabels.value,
        },
        {
            data: reservationsByDayOfWeek.value,
            title: "Reservations by Day of Week",
            type: "bar",
            labels: DAYS_OF_WEEK.value,
        },
    ] as const;
});
</script>

<template>
    <div class="PageAdminAnalytics">
        <FTTitle title="Analytics" />

        <FTTimeframeSelector v-model="selected" />

        <div>
            <FTCard class="q-mb-md">
                <BarChart
                    :chart-data="plannedReservationsByProperty"
                    chart-title="Total Planned Reservations"
                />
            </FTCard>
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
                        :labels="chartInfo.labels"
                    />
                </FTCard>
            </div>
        </div>
    </div>
</template>
