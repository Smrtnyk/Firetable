<script setup lang="ts">
import BarChart from "src/components/admin/analytics/BarChart.vue";
import PieChart from "src/components/admin/analytics/PieChart.vue";
import ReservationAnalyticsCharts from "src/components/admin/analytics/ReservationAnalyticsCharts.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import FTCard from "src/components/FTCard.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTTimeframeSelector from "src/components/FTTimeframeSelector.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useReservationsAnalytics } from "src/composables/analytics/useReservationsAnalytics.js";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref, watch } from "vue";
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
    endDate: today.toISOString().split("T")[0],
    startDate: thirtyDaysAgo.toISOString().split("T")[0],
});
const property = computed(function () {
    return propertiesStore.getPropertyById(props.propertyId);
});
const {
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
    reservationsByDayOfWeek,
    selectedDay,
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
            labels: peakHoursLabels.value,
            title: "Peak Reservation Hours",
            type: "bar",
        },
        {
            data: consumptionAnalysisCombined.value,
            labels: ["Consumption"] as string[],
            title: "Consumption Data",
            type: "bar",
        },
        {
            data: guestDistributionAnalysis.value,
            labels: guestDistributionLabels.value,
            title: "Guest Distribution",
            type: "bar",
        },
        {
            data: reservationsByDayOfWeek.value,
            labels: DAYS_OF_WEEK.value,
            title: "Reservations by Day of Week",
            type: "bar",
        },
    ] as const;
});
</script>

<template>
    <div class="PageAdminAnalytics">
        <FTTitle title="Analytics" />

        <FTTimeframeSelector v-model="selected" />

        <div>
            <FTCard class="mb-4">
                <BarChart
                    :chart-data="plannedReservationsByProperty"
                    chart-title="Total Planned Reservations"
                />
            </FTCard>

            <v-row>
                <v-col cols="12">
                    <v-chip color="primary" class="mr-2">
                        Avg Guests per planned reservation:
                        {{ avgGuestsPerReservation.averagePlannedGuests.toFixed(2) }}
                    </v-chip>

                    <v-chip color="primary">
                        Avg Guests per walk-in reservation:
                        {{ avgGuestsPerReservation.averageWalkInGuests.toFixed(2) }}
                    </v-chip>
                </v-col>

                <v-col cols="12" md="6">
                    <FTCard>
                        <PieChart
                            :chart-data="plannedArrivedVsNoShow"
                            chart-title="Arrived vs. No-Show"
                        />
                    </FTCard>
                </v-col>

                <v-col cols="12" md="6">
                    <FTCard>
                        <PieChart
                            :chart-data="plannedVsWalkInReservations"
                            chart-title="Planned vs. Walk-In"
                        />
                    </FTCard>
                </v-col>

                <v-col cols="12" class="my-4">
                    <FTTabs v-model="selectedDay">
                        <v-tab
                            v-for="day in [...Object.keys(plannedReservationsByDay), 'ALL']"
                            :key="day"
                            :value="day"
                        >
                            {{ day }}
                        </v-tab>
                    </FTTabs>

                    <FTTabPanels v-model="selectedDay" class="mt-4">
                        <v-window-item
                            v-for="(reservations, day) in {
                                ...plannedReservationsByDay,
                                ALL: plannedReservationsByActiveProperty,
                            }"
                            :key="day"
                            :value="day"
                        >
                            <AdminEventReservationsByPerson :reservations="reservations" />
                        </v-window-item>
                    </FTTabPanels>
                </v-col>

                <v-col v-for="chartInfo in chartInfos" :key="chartInfo.title" cols="12" md="6">
                    <FTCard>
                        <ReservationAnalyticsCharts
                            :chart-data="chartInfo.data"
                            :chart-title="chartInfo.title"
                            :chart-type="chartInfo.type"
                            :labels="chartInfo.labels"
                        />
                    </FTCard>
                </v-col>
            </v-row>
        </div>
    </div>
</template>
