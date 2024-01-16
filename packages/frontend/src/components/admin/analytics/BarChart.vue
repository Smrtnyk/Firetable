<template>
    <div class="chart-container">
        <canvas ref="chartCanvas" class="chart-container"></canvas>
    </div>
</template>

<script setup lang="ts">
import type { TimeSeriesData } from "src/components/admin/analytics/types";
import { ref, onMounted, watch, onUnmounted } from "vue";
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const props = defineProps<{
    chartData: TimeSeriesData;
    chartTitle: string;
}>();

const chartCanvas = ref<HTMLCanvasElement | undefined>();
let chartInstance: Chart | undefined;

function drawChart(chartData: TimeSeriesData): void {
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (chartCanvas.value) {
        chartInstance = new Chart(chartCanvas.value, {
            type: "bar",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: props.chartTitle,
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
);

onMounted(() => {
    drawChart(props.chartData);
});

onUnmounted(() => {
    chartInstance?.destroy();
});
</script>

<style>
.chart-container {
    min-height: 300px !important;
    max-width: 100%;
}
</style>
