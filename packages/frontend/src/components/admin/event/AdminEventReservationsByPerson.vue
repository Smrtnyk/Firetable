<template>
    <div>
        <canvas
            v-if="props.reservations.length > 0"
            ref="chartRef"
            class="chart-container"
        ></canvas>
        <FTCenteredText v-else>No reservations to show</FTCenteredText>
    </div>
</template>

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
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
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

const chartRef = ref<HTMLCanvasElement | null>(null);
const props = defineProps<Props>();
let chartInstance: Chart | undefined;

function calculateChartHeight(reservations: ReservationDoc[]): number {
    const minBarHeight = isMobile.value ? 7 : 12;
    // Calculate the total height based on the number of bars
    const totalHeight = reservations.length * minBarHeight;

    const minHeight = 300;
    return Math.max(totalHeight, minHeight);
}

function updateChartHeight(reservations: ReservationDoc[]): void {
    if (chartRef.value) {
        const newHeight = calculateChartHeight(reservations);
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

function generateStackedChartData(reservations: ReservationDoc[]): {
    labels: string[];
    datasets: any[];
} {
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

function generateTablesByWaiterChartOptions(
    chartContainer: HTMLCanvasElement,
    reservations: ReservationDoc[],
): void {
    const { labels, datasets } = generateStackedChartData(reservations);
    updateChartHeight(reservations);
    destroyChartIfExists();

    try {
        chartInstance = new Chart(chartContainer, {
            type: "bar",
            data: {
                labels,
                datasets,
            },
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

onMounted(() => {
    if (!chartRef.value) {
        return;
    }
    generateTablesByWaiterChartOptions(chartRef.value, props.reservations);
});

watch(
    () => props.reservations,
    (newReservations) => {
        destroyChartIfExists();
        if (chartRef.value) {
            generateTablesByWaiterChartOptions(chartRef.value, newReservations);
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    destroyChartIfExists();
});
</script>

<style>
.chart-container {
    min-height: 50vh;
}
</style>
