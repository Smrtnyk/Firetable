<script setup lang="ts">
import type { PlannedReservationDoc } from "@firetable/types";
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Legend,
    Tooltip,
    SubTitle,
} from "chart.js";
import { computed, onMounted, onUnmounted, ref, watch, useTemplateRef } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { isMobile } from "src/global-reactives/screen-detection";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    reservations: PlannedReservationDoc[];
}

interface ReservationObject {
    name: string;
    reservations: number;
    arrived: number;
}

type Res = Record<string, ReservationObject>;
type ChartData = {
    labels: string[];
    datasets: any[];
};

const enum ViewMode {
    CHART = "chart",
    TABLE = "table",
}

Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Legend,
    Tooltip,
    Title,
    SubTitle,
);

let chartInstance: Chart | undefined;
const tableColumns = [
    { name: "name", required: true, label: "Name", align: "left", field: "name", sortable: true },
    { name: "arrived", label: "Arrived", field: "arrived", sortable: true },
    { name: "pending", label: "Pending", field: "pending", sortable: true },
    { name: "total", label: "Total", field: "total", sortable: true },
] as any;

const props = defineProps<Props>();

const viewMode = ref(ViewMode.CHART);
const chartRef = useTemplateRef<HTMLCanvasElement>("chartRef");
const chartData = computed(function () {
    return generateStackedChartData(props.reservations);
});
const tableData = computed(function () {
    const { labels, datasets } = chartData.value;
    const arrivedData = datasets.find(function (dataset) {
        return dataset.label === "Arrived";
    }).data;
    const pendingData = datasets.find(function (dataset) {
        return dataset.label === "Pending";
    }).data;

    return labels.map(function (label, index) {
        return {
            name: label,
            arrived: arrivedData[index],
            pending: pendingData[index],
            total: arrivedData[index] + pendingData[index],
        };
    });
});

const chartHeight = computed(function () {
    const minBarHeight = isMobile.value ? 27 : 52;
    const numBars = chartData.value.labels.length;
    const totalHeight = numBars * minBarHeight;
    const minHeight = 300;
    return Math.max(totalHeight, minHeight);
});

function updateChartHeight(): void {
    if (chartRef.value) {
        chartRef.value.style.height = `${chartHeight.value}px`;
    }
}

function reservationsReducer(acc: Res, reservation: PlannedReservationDoc): Res {
    if (!reservation) {
        return acc;
    }
    const { reservedBy, arrived } = reservation;
    const { email, name } = reservedBy;
    const hash = name + email;
    if (acc[hash]) {
        acc[hash].reservations += 1;
    } else {
        acc[hash] = {
            name,
            reservations: 1,
            arrived: 0,
        };
    }
    if (arrived) {
        acc[hash].arrived += 1;
    }
    return acc;
}

function generateStackedChartData(reservations: PlannedReservationDoc[]): ChartData {
    const data = reservations.reduce(reservationsReducer, {});
    const labels: string[] = [];
    const arrivedCounts: number[] = [];
    const pendingCounts: number[] = [];

    Object.values(data).forEach(function (entry) {
        labels.push(entry.name);
        arrivedCounts.push(entry.arrived);
        pendingCounts.push(entry.reservations - entry.arrived);
    });

    const pendingDataset = {
        label: "Pending",
        data: pendingCounts,
        backgroundColor: "rgba(0, 123, 255, 0.5)",
        borderColor: "rgba(0, 123, 255, 1)",
        borderWidth: 1,
        type: "bar",
        stack: "bar-stacked",
    };

    const arrivedDataset = {
        label: "Arrived",
        data: arrivedCounts,
        backgroundColor: "rgba(40, 167, 69, 0.5)",
        borderColor: "rgba(40, 167, 69, 1)",
        borderWidth: 1,
        type: "bar",
        stack: "bar-stacked",
    };

    return { labels, datasets: [pendingDataset, arrivedDataset] };
}

function destroyChartIfExists(): void {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = undefined;
    }
}

function updateChartData(): void {
    if (!chartInstance) {
        return;
    }

    chartInstance.data = chartData.value;
    chartInstance.update();
}

function createChart(chartContainer: HTMLCanvasElement): void {
    try {
        chartInstance = new Chart(chartContainer, {
            type: "bar",
            data: chartData.value,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: {
                    legend: {
                        labels: {
                            boxWidth: isMobile.value ? 10 : 30,
                            padding: isMobile.value ? 2 : 10,
                            font: {
                                size: isMobile.value ? 10 : 12,
                            },
                        },
                    },
                    title: {
                        display: true,
                        text: "Reservation status by person",
                        font: {
                            size: 14,
                        },
                    },
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            autoSkip: false,
                            autoSkipPadding: 20,
                            maxRotation: 65,
                            minRotation: 65,
                            font: {
                                size: isMobile.value ? 10 : 14,
                            },
                            padding: isMobile.value ? 0 : 10,
                        },
                    },
                },
            },
        });
    } catch (e) {
        showErrorMessage(e);
    }
}

function initializeChart(chartContainer: HTMLCanvasElement): void {
    updateChartHeight();

    if (chartInstance) {
        updateChartData();
    } else {
        createChart(chartContainer);
    }
}

onMounted(function () {
    if (chartRef.value) {
        initializeChart(chartRef.value);
    }
});

watch(
    () => props.reservations,
    function () {
        if (!chartRef.value) {
            return;
        }

        if (chartInstance) {
            updateChartData();
            return;
        }

        initializeChart(chartRef.value);
    },
    { deep: true },
);

onUnmounted(destroyChartIfExists);
</script>

<template>
    <div>
        <q-btn-toggle
            v-model="viewMode"
            no-caps
            unelevated
            :options="[
                { label: 'Chart', value: ViewMode.CHART },
                { label: 'Table', value: ViewMode.TABLE },
            ]"
            class="q-mb-md"
        ></q-btn-toggle>

        <!-- Chart Container -->
        <div v-show="viewMode === ViewMode.CHART">
            <canvas
                v-if="props.reservations.length > 0"
                ref="chartRef"
                class="chart-container"
            ></canvas>
            <FTCenteredText v-else>No reservations to show</FTCenteredText>
        </div>

        <!-- Data Table -->
        <q-table
            class="table-container"
            v-show="viewMode === ViewMode.TABLE"
            :rows="tableData"
            :columns="tableColumns"
            row-key="name"
            :rows-per-page-options="[0]"
            card-class="ft-card"
            hide-bottom
            flat
            binary-state-sort
            bordered
        ></q-table>
    </div>
</template>

<style>
.chart-container,
.table-container {
    min-height: 25vh;
}
</style>
