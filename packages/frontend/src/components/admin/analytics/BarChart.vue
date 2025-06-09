<script setup lang="ts">
import type { ECBarOption, TimeSeriesData } from "src/components/admin/analytics/types";

import { BarChart } from "echarts/charts";
import {
    DatasetComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useAppTheme } from "src/composables/useAppTheme";
import { computed } from "vue";
import VChart from "vue-echarts";

// Register ECharts components
use([
    CanvasRenderer,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DatasetComponent,
]);

const props = defineProps<{
    chartData: TimeSeriesData;
    chartTitle: string;
    labels?: string[] | undefined;
    stacked?: boolean;
}>();
const { isDark } = useAppTheme();
const backgroundColor = computed(() => (isDark.value ? "#1A1A1A" : "#FFFFFF"));
const textColor = computed(() => (isDark.value ? "#cccccc" : "#1A1A1A"));
const chartOption = computed<ECBarOption>(() => ({
    backgroundColor: backgroundColor.value,
    grid: {
        bottom: "15%",
        containLabel: true,
        left: "3%",
        right: "4%",
        top: "15%",
    },
    legend: {
        bottom: "0",
        orient: "horizontal",
        textStyle: {
            color: textColor.value,
            fontSize: 14,
        },
    },
    series: props.chartData.map((series) => ({
        data: series.data,
        emphasis: {
            focus: "series",
        },
        itemStyle: series.itemStyle,
        label: {
            color: "#fff",
            fontSize: 12,
            position: "inside",
            show: true,
        },
        name: series.name,
        stack: props.stacked ? "total" : "",
        type: "bar",
    })),
    title: {
        left: "center",
        text: props.chartTitle,
        textStyle: {
            color: textColor.value,
            fontSize: 14,
            fontWeight: "bold",
        },
        top: "10",
    },
    tooltip: {
        axisPointer: {
            type: "shadow",
        },
        backgroundColor: "#FFFFFF",
        borderColor: "#e1e5e8",
        borderWidth: 1,
        textStyle: {
            color: "#1A1A1A",
            fontSize: 14,
        },
        trigger: "axis",
    },
    xAxis: {
        axisLabel: {
            color: textColor.value,
            fontSize: 12,
        },
        axisLine: {
            lineStyle: {
                color: textColor.value,
            },
        },
        data: props.labels,
        type: "category",
    },
    yAxis: {
        axisLabel: {
            color: textColor.value,
            fontSize: 12,
        },
        axisLine: {
            lineStyle: {
                color: textColor.value,
            },
        },
        splitLine: {
            lineStyle: {
                color: isDark.value ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            },
        },
        type: "value",
    },
}));
</script>

<template>
    <div class="chart">
        <v-chart class="chart" :option="chartOption" autoresize />
    </div>
</template>

<style scoped>
.chart {
    width: 100%;
    height: 350px;
}
</style>
