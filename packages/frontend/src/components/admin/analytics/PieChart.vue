<template>
    <div>
        <canvas ref="chartCanvas"></canvas>
    </div>
</template>

<script setup lang="ts">
import type { PieChartData } from "src/components/admin/analytics/types";
import { useTemplateRef, onMounted, watch, onUnmounted } from "vue";
import { Chart, PieController, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(PieController, ArcElement, Tooltip, Legend);

const props = defineProps<{
    chartData: PieChartData;
    chartTitle: string;
}>();

const chartCanvas = useTemplateRef<HTMLCanvasElement>("chartCanvas");
let chartInstance: Chart<"pie", number[], unknown> | undefined;

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

watch(() => props.chartData, drawChart);

onMounted(function () {
    drawChart(props.chartData);
});

onUnmounted(function () {
    chartInstance?.destroy();
});
</script>
