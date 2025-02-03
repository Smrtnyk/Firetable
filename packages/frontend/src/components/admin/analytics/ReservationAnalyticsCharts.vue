<script setup lang="ts">
import type { PieChartData, TimeSeriesData } from "src/components/admin/analytics/types";

import BarChart from "./BarChart.vue";
import PieChart from "./PieChart.vue";

interface Props {
    chartData: PieChartData | TimeSeriesData;
    chartTitle: string;
    chartType: "bar" | "pie";
    labels?: string[];
}

const props = defineProps<Props>();
</script>

<template>
    <div v-if="props.chartType === 'bar'">
        <BarChart
            :labels="props.labels"
            :chart-data="props.chartData as TimeSeriesData"
            :chart-title="props.chartTitle"
        />
    </div>
    <div v-else-if="props.chartType === 'pie'">
        <PieChart
            :labels="props.labels"
            :chart-data="props.chartData as PieChartData"
            :chart-title="props.chartTitle"
        />
    </div>
</template>
