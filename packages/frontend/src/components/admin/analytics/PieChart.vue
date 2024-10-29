<script setup lang="ts">
import type { PieChartData, ECPieOption } from "src/components/admin/analytics/types";
import { computed } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { isDark } from "src/global-reactives/is-dark";

// Register ECharts components
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent]);

const props = defineProps<{
    chartData: PieChartData;
    chartTitle: string;
}>();

const backgroundColor = computed(() => (isDark.value ? "#1A1A1A" : "#FFFFFF"));
const textColor = computed(() => (isDark.value ? "#cccccc" : "#1A1A1A"));

const chartOption = computed<ECPieOption>(() => ({
    backgroundColor: backgroundColor.value,
    title: {
        text: props.chartTitle,
        textStyle: {
            color: textColor.value,
            fontSize: 14,
            fontWeight: "bold",
        },
        left: "center",
    },
    tooltip: {
        trigger: "item",
        backgroundColor: "#FFFFFF",
        borderColor: "#e1e5e8",
        borderWidth: 1,
        textStyle: {
            color: "#1A1A1A",
            fontSize: 14,
        },
        formatter: (params: any) => {
            const { name, value, percent } = params;
            return `${name}<br/>Value: ${value}<br/>Percentage: ${percent}%`;
        },
    },
    legend: {
        orient: "horizontal",
        bottom: 0,
        textStyle: {
            color: textColor.value,
            fontSize: 14,
        },
        backgroundColor: backgroundColor.value,
    },
    series: [
        {
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: true,
            label: {
                show: true,
                formatter: "{d}%",
                fontSize: 14,
                fontWeight: "bold",
                color: textColor.value,
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 16,
                    fontWeight: "bold",
                },
            },
            labelLine: {
                show: true,
            },
            data: props.chartData,
        },
    ],
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
