<script setup lang="ts">
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types";
import PieChart from "./PieChart.vue";
import BarChart from "./BarChart.vue";

interface Props {
    chartData: TimeSeriesData | PieChartData;
    chartTitle: string;
    chartType: "bar" | "pie";
}

const props = defineProps<Props>();
</script>

<template>
    <div v-if="props.chartType === 'bar'">
        <BarChart :chart-data="props.chartData" :chart-title="props.chartTitle" />
    </div>
    <div v-else-if="props.chartType === 'pie'">
        <PieChart :chart-data="props.chartData" :chart-title="props.chartTitle" />
    </div>
</template>
