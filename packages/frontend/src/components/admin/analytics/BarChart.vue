<script setup lang="ts">
import type { TimeSeriesData, ECBarOption } from "src/components/admin/analytics/types";
import { computed } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart } from "echarts/charts";
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DatasetComponent,
} from "echarts/components";
import { isDark } from "src/global-reactives/is-dark";

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

const backgroundColor = computed(() => (isDark.value ? "#1A1A1A" : "#FFFFFF"));
const textColor = computed(() => (isDark.value ? "#cccccc" : "#1A1A1A"));
// @ts-expect-error -- FIXME: figure this type issue out
const chartOption = computed<ECBarOption>(() => ({
    backgroundColor: backgroundColor.value,
    title: {
        text: props.chartTitle,
        textStyle: {
            color: textColor.value,
            fontSize: 14,
            fontWeight: "bold",
        },
        left: "center",
        top: "10",
    },
    tooltip: {
        trigger: "axis",
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
    },
    legend: {
        orient: "horizontal",
        bottom: "0",
        textStyle: {
            color: textColor.value,
            fontSize: 14,
        },
    },
    grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "15%",
        containLabel: true,
    },
    xAxis: {
        type: "category",
        data: props.labels,
        axisLine: {
            lineStyle: {
                color: textColor.value,
            },
        },
        axisLabel: {
            color: textColor.value,
            fontSize: 12,
        },
    },
    yAxis: {
        type: "value",
        axisLine: {
            lineStyle: {
                color: textColor.value,
            },
        },
        axisLabel: {
            color: textColor.value,
            fontSize: 12,
        },
        splitLine: {
            lineStyle: {
                color: isDark.value ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            },
        },
    },
    series: props.chartData.map((series) => ({
        name: series.name,
        type: "bar",
        stack: props.stacked ? "total" : undefined,
        emphasis: {
            focus: "series",
        },
        data: series.data,
        itemStyle: series.itemStyle,
        label: {
            show: true,
            position: "inside",
            color: "#fff",
            fontSize: 12,
        },
    })),
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
