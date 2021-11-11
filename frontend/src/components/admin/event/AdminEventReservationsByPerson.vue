<template>
    <div>
        <canvas v-if="reservedTables.length" ref="chartRef"></canvas>
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
import { computed, onMounted, ref } from "vue";
import { TableElement } from "src/types/floor";

interface Props {
    reservations: TableElement[];
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
    SubTitle
);

const backgroundColors = [
    "rgba(255, 99, 132, 0.2)",
    "rgba(255, 159, 64, 0.2)",
    "rgba(255, 205, 86, 0.2)",
    "rgba(75, 192, 192, 0.2)",
    "rgba(54, 162, 235, 0.2)",
    "rgba(153, 102, 255, 0.2)",
    "rgba(201, 203, 207, 0.2)",
];
const borderColors = [
    "rgb(255, 99, 132)",
    "rgb(255, 159, 64)",
    "rgb(255, 205, 86)",
    "rgb(75, 192, 192)",
    "rgb(54, 162, 235)",
    "rgb(153, 102, 255)",
    "rgb(201, 203, 207)",
];

const chartRef = ref<HTMLCanvasElement | null>(null);
const props = defineProps<Props>();

const reservedTables = computed(() => props.reservations.filter((table) => !!table.reservation));

function reservationsReducer(acc: Res, { reservation }: TableElement) {
    if (!reservation) return acc;
    const { reservedBy, confirmed } = reservation;
    const { id, name } = reservedBy;
    if (acc[id]) {
        acc[id].reservations++;
    } else {
        acc[id] = {
            name,
            reservations: 1,
            confirmed: 0,
        };
    }
    if (confirmed) acc[id].confirmed++;
    return acc;
}

function generateTablesByWaiterChartOptions(
    chartContainer: HTMLCanvasElement,
    reservations: TableElement[]
) {
    const data = reservations.reduce(reservationsReducer, {});

    const reservationData = Object.values(data).map((entry, index) => {
        return {
            label: entry.name,
            data: [entry.reservations, entry.confirmed],
            backgroundColor: backgroundColors[index],
            borderColor: borderColors[index],
            borderWidth: 1,
        };
    });

    new Chart(chartContainer, {
        type: "bar",
        data: {
            labels: ["Total reservations", "Confirmed"],
            datasets: reservationData,
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "Reservation status by person",
                },
            },
            responsive: true,
            scales: {
                x: {
                    stacked: false,
                },
                y: {
                    stacked: false,
                },
            },
        },
    });
}
onMounted(() => {
    if (!chartRef.value) return;
    generateTablesByWaiterChartOptions(chartRef.value, props.reservations);
});
</script>
