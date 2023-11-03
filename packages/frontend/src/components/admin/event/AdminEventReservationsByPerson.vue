<template>
    <div>
        <canvas v-if="reservedTables.length" ref="chartRef" class="chart-container"></canvas>
        <h5 v-else class="text-subtitle2">No reservations to show</h5>
    </div>
</template>

<script setup lang="ts">
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BaseTable } from "@firetable/floor-creator";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { propIsTruthy } from "@firetable/utils";
import { isMobile } from "src/global-reactives/is-mobile";
import { getColors } from "src/helpers/colors";

interface Props {
    reservations: BaseTable[];
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
let chartInstance: Chart | null = null;
const reservedTables = computed(() => props.reservations.filter(propIsTruthy("reservation")));

function reservationsReducer(acc: Res, { reservation }: BaseTable) {
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

function generateTablesByWaiterChartOptions(
    chartContainer: HTMLCanvasElement,
    reservations: BaseTable[],
) {
    const data = reservations.reduce(reservationsReducer, {});

    const colorData = getColors(Object.keys(data).length);

    const reservationData = Object.values(data).map((entry, index) => {
        return {
            label: entry.name,
            data: [entry.reservations, entry.confirmed],
            backgroundColor: colorData.backgroundColors[index],
            borderColor: colorData.borderColors[index],
            borderWidth: 1,
        };
    });

    try {
        chartInstance = new Chart(chartContainer, {
            type: "bar",
            data: {
                labels: ["Reservations", "Confirmed"],
                datasets: reservationData,
            },
            options: {
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
                responsive: true,
                scales: {
                    x: {
                        stacked: false,
                    },
                    y: {
                        stacked: false,
                        ticks: {
                            maxRotation: 90,
                            // setting the same value for max and min will enforce that specific angle
                            minRotation: 90,
                            font: {
                                size: isMobile.value ? 10 : 14,
                            },
                            padding: isMobile.value ? 2 : 10,
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
    if (!chartRef.value) return;
    generateTablesByWaiterChartOptions(chartRef.value, props.reservations);
});

watch(
    () => props.reservations,
    (newReservations) => {
        if (chartRef.value) {
            generateTablesByWaiterChartOptions(chartRef.value, newReservations);
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
});
</script>

<style>
.chart-container {
    height: 50vh;
    min-height: 300px;
}
</style>
