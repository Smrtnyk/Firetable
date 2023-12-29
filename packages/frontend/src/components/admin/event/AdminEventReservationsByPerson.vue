<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
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
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { isMobile } from "src/global-reactives/screen-detection";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    reservations: ReservationDoc[];
}

interface ReservationObject {
    name: string;
    reservations: number;
    confirmed: number;
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
    { name: "confirmed", label: "Arrived", field: "confirmed", sortable: true },
    { name: "pending", label: "Pending", field: "pending", sortable: true },
    { name: "total", label: "Total", field: "total", sortable: true },
];

const props = defineProps<Props>();

const viewMode = ref(ViewMode.CHART);
const chartRef = ref<HTMLCanvasElement | null>(null);
const chartData = computed(() => {
    return generateStackedChartData(props.reservations);
});
const tableData = computed(() => {
    const { labels, datasets } = chartData.value;
    const confirmedData = datasets.find((dataset) => dataset.label === "Confirmed").data;
    const unconfirmedData = datasets.find((dataset) => dataset.label === "Unconfirmed").data;

    return labels.map((label, index) => ({
        name: label,
        confirmed: confirmedData[index],
        pending: unconfirmedData[index],
        total: confirmedData[index] + unconfirmedData[index],
    }));
});

function calculateChartHeight(): number {
    const minBarHeight = isMobile.value ? 7 : 12;
    // Calculate the total height based on the number of bars
    const totalHeight = props.reservations.length * minBarHeight;

    const minHeight = 300;
    return Math.max(totalHeight, minHeight);
}

function updateChartHeight(): void {
    if (chartRef.value) {
        const newHeight = calculateChartHeight();
        chartRef.value.style.height = `${newHeight}px`;
    }
}

function reservationsReducer(acc: Res, reservation: ReservationDoc): Res {
    if (!reservation) return acc;
    const { reservedBy, confirmed } = reservation;
    const { email, name } = reservedBy;
    const hash = name + email;
    if (acc[hash]) {
        acc[hash].reservations++;
    } else {
        acc[hash] = {
            name,
            reservations: 1,
            confirmed: 0,
        };
    }
    if (confirmed) acc[hash].confirmed++;
    return acc;
}

function generateStackedChartData(reservations: ReservationDoc[]): ChartData {
    const data = reservations.reduce(reservationsReducer, {});
    const labels: string[] = [];
    const confirmedCounts: number[] = [];
    const unconfirmedCounts: number[] = [];

    Object.values(data).forEach((entry) => {
        labels.push(entry.name);
        confirmedCounts.push(entry.confirmed);
        unconfirmedCounts.push(entry.reservations - entry.confirmed); // Calculate unconfirmed
    });

    const unconfirmedDataset = {
        label: "Unconfirmed",
        data: unconfirmedCounts,
        backgroundColor: "rgba(0, 123, 255, 0.5)",
        borderColor: "rgba(0, 123, 255, 1)",
        borderWidth: 1,
        type: "bar",
        stack: "bar-stacked",
    };

    const confirmedDataset = {
        label: "Confirmed",
        data: confirmedCounts,
        backgroundColor: "rgba(40, 167, 69, 0.5)",
        borderColor: "rgba(40, 167, 69, 1)",
        borderWidth: 1,
        type: "bar",
        stack: "bar-stacked",
    };

    return { labels, datasets: [unconfirmedDataset, confirmedDataset] };
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

onMounted(() => {
    if (chartRef.value) {
        initializeChart(chartRef.value);
    }
});

watch(
    () => props.reservations,
    () => {
        if (chartRef.value) {
            if (chartInstance) {
                updateChartData();
            } else {
                initializeChart(chartRef.value);
            }
        }
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
            v-show="viewMode === ViewMode.TABLE"
            :rows="tableData"
            :columns="tableColumns"
            row-key="name"
            :rows-per-page-options="[0]"
            card-class="ft-card"
            hide-bottom
        ></q-table>
    </div>
</template>

<style>
.chart-container {
    min-height: 50vh;
}
</style>
