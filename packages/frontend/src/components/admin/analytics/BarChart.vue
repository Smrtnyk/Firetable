<template>
    <div class="chart-container">
        <canvas ref="chartCanvas" class="chart-container"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";
import { TimeSeriesData } from "src/components/admin/analytics/types";
import { getDarkMode } from "src/config";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const props = defineProps<{
    chartData: TimeSeriesData;
    chartTitle: string;
}>();

const darkModeColors = {
    textColor: "#FFFFFF",
    gridColor: "#444444",
};

const lightModeColors = {
    textColor: "#000000",
    gridColor: "#CCCCCC",
};

const chartCanvas = ref<HTMLCanvasElement | undefined>();
let chartInstance: Chart | null = null;

function drawChart(chartData: TimeSeriesData): void {
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (chartCanvas.value) {
        const colors = getDarkMode() ? darkModeColors : lightModeColors;
        chartInstance = new Chart(chartCanvas.value, {
            type: "bar",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: colors.textColor,
                        },
                    },
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
                        ticks: {
                            color: colors.textColor,
                        },
                        grid: {
                            color: colors.gridColor,
                        },
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            color: colors.textColor,
                        },
                        grid: {
                            color: colors.gridColor,
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

<style>
.chart-container {
    min-height: 300px;
    max-width: 100%;
}
</style>
