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
            labels: ["Consumption"] as string[],
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
            <FTCard class="q-mb-md">
                <BarChart
                    :chart-data="plannedReservationsByProperty"
                    :chart-title="t('PageAdminAnalytics.charts.totalPlannedReservationsTitle')"
                />
            </FTCard>
            <div class="row q-col-gutter-sm q-col-gutter-md-md">
                <div class="col-12">
                    <q-chip color="primary">
                        {{ t("PageAdminAnalytics.chipLabels.avgGuestsPlanned") }}
                        {{ avgGuestsPerReservation.averagePlannedGuests.toFixed(2) }}
                    </q-chip>

                    <q-chip color="primary">
                        {{ t("PageAdminAnalytics.chipLabels.avgGuestsWalkIn") }}
                        {{ avgGuestsPerReservation.averageWalkInGuests.toFixed(2) }}
                    </q-chip>
                </div>

                <FTCard class="col-sm-12 col-md-6">
                    <PieChart
                        :chart-data="plannedArrivedVsNoShow"
                        :chart-title="t('PageAdminAnalytics.charts.arrivedVsNoShowTitle')"
                    />
                </FTCard>

                <FTCard class="col-sm-12 col-md-6">
                    <PieChart
                        :chart-data="plannedVsWalkInReservations"
                        :chart-title="t('PageAdminAnalytics.charts.plannedVsWalkInTitle')"
                    />
                </FTCard>

                <div class="col-12 q-my-md">
                    <FTTabs v-model="selectedDay">
                        <q-tab
                            v-for="day in [...Object.keys(plannedReservationsByDay), 'ALL']"
                            :key="day"
                            :name="day"
                            :label="day === 'ALL' ? t('PageAdminAnalytics.tabs.all') : day"
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
