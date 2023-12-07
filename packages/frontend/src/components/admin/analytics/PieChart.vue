<template>
    <canvas ref="chartCanvas"></canvas>
</template>

<script setup lang="ts">
import type { PieChartData } from "src/components/admin/analytics/types";
import { ref, onMounted, watch } from "vue";
import { Chart, PieController, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(PieController, ArcElement, Tooltip, Legend);

const props = defineProps<{
    chartData: PieChartData;
    chartTitle: string;
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart<"pie", number[], unknown>;

function drawChart(chartData: PieChartData): void {
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (chartCanvas.value) {
        chartInstance = new Chart(chartCanvas.value, {
            type: "pie",
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: props.chartTitle,
                        font: {
                            size: 14,
                        },
                    },
                },
            },
        });
    }
}

watch(
    () => props.chartData,
    (newData) => {
        drawChart(newData);
    },
    { immediate: true },
);

onMounted(() => {
    drawChart(props.chartData);
});
</script>
