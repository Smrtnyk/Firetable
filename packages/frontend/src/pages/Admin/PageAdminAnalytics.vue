<script setup lang="ts">
import BarChart from "src/components/admin/analytics/BarChart.vue";
import PieChart from "src/components/admin/analytics/PieChart.vue";
import ReservationAnalyticsCharts from "src/components/admin/analytics/ReservationAnalyticsCharts.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import FTCard from "src/components/FTCard.vue";
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

const { locale, t } = useI18n();
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
            title: t("PageAdminAnalytics.charts.peakReservationHoursTitle"),
            type: "bar",
        },
        {
            data: consumptionAnalysisCombined.value,
            labels: [t("PageAdminAnalytics.charts.consumptionLabel")] as string[],
            title: t("PageAdminAnalytics.charts.consumptionDataTitle"),
            type: "bar",
        },
        {
            data: guestDistributionAnalysis.value,
            labels: guestDistributionLabels.value,
            title: t("PageAdminAnalytics.charts.guestDistributionTitle"),
            type: "bar",
        },
        {
            data: reservationsByDayOfWeek.value,
            labels: DAYS_OF_WEEK.value,
            title: t("PageAdminAnalytics.charts.reservationsByDayOfWeekTitle"),
            type: "bar",
        },
    ] as const;
});
</script>

<template>
    <div class="PageAdminAnalytics">
        <FTTitle :title="t('PageAdminAnalytics.title')" />

        <FTTimeframeSelector v-model="selected" />

        <div>
            <FTCard class="mb-4">
                <BarChart
                    :chart-data="plannedReservationsByProperty"
                    :chart-title="t('PageAdminAnalytics.charts.totalPlannedReservationsTitle')"
                />
            </FTCard>

            <v-row>
                <v-col cols="12">
                    <v-chip color="primary" class="me-2">
                        {{ t("PageAdminAnalytics.chipLabels.avgGuestsPlanned") }}
                        {{ avgGuestsPerReservation.averagePlannedGuests.toFixed(2) }}
                    </v-chip>

                    <v-chip color="primary">
                        {{ t("PageAdminAnalytics.chipLabels.avgGuestsWalkIn") }}
                        {{ avgGuestsPerReservation.averageWalkInGuests.toFixed(2) }}
                    </v-chip>
                </v-col>

                <v-col cols="12" md="6">
                    <FTCard>
                        <PieChart
                            :chart-data="plannedArrivedVsNoShow"
                            :chart-title="t('PageAdminAnalytics.charts.arrivedVsNoShowTitle')"
                        />
                    </FTCard>
                </v-col>

                <v-col cols="12" md="6">
                    <FTCard>
                        <PieChart
                            :chart-data="plannedVsWalkInReservations"
                            :chart-title="t('PageAdminAnalytics.charts.plannedVsWalkInTitle')"
                        />
                    </FTCard>
                </v-col>

                <v-col cols="12" class="my-4">
                    <v-tabs v-model="selectedDay" color="primary">
                        <v-tab
                            v-for="day in [...Object.keys(plannedReservationsByDay), 'ALL']"
                            :key="day"
                            :value="day"
                        >
                            {{ day === "ALL" ? t("PageAdminAnalytics.tabs.all") : day }}
                        </v-tab>
                    </v-tabs>

                    <v-tabs-window v-model="selectedDay" class="mt-4">
                        <v-tabs-window-item
                            v-for="(reservations, day) in {
                                ...plannedReservationsByDay,
                                ALL: plannedReservationsByActiveProperty,
                            }"
                            :key="day"
                            :value="day"
                        >
                            <AdminEventReservationsByPerson :reservations="reservations" />
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-col>

                <v-col cols="12" md="6" v-for="chartInfo in chartInfos" :key="chartInfo.title">
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
