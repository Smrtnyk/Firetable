<script setup lang="ts">
import type { ECPieOption, PieChartData } from "src/components/admin/analytics/types";

import { PieChart } from "echarts/charts";
import { LegendComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useAppTheme } from "src/composables/useAppTheme";
import { computed } from "vue";
import VChart from "vue-echarts";
import { useI18n } from "vue-i18n";

// Register ECharts components
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent]);

const props = defineProps<{
    chartData: PieChartData;
    chartTitle: string;
}>();
const { isDark } = useAppTheme();
const { t } = useI18n();
const backgroundColor = computed(() => (isDark.value ? "#1A1A1A" : "#FFFFFF"));
const textColor = computed(() => (isDark.value ? "#cccccc" : "#1A1A1A"));

const chartOption = computed<ECPieOption>(() => ({
    backgroundColor: backgroundColor.value,
    legend: {
        backgroundColor: backgroundColor.value,
        bottom: 0,
        orient: "horizontal",
        textStyle: {
            color: textColor.value,
            fontSize: 14,
        },
    },
    series: [
        {
            avoidLabelOverlap: true,
            data: props.chartData,
            emphasis: {
                label: {
                    fontSize: 16,
                    fontWeight: "bold",
                    show: true,
                },
            },
            label: {
                color: textColor.value,
                fontSize: 14,
                fontWeight: "bold",
                formatter: "{d}%",
                show: true,
            },
            labelLine: {
                show: true,
            },
            radius: ["40%", "70%"],
            type: "pie",
        },
    ],
    title: {
        left: "center",
        text: props.chartTitle,
        textStyle: {
            color: textColor.value,
            fontSize: 14,
            fontWeight: "bold",
        },
    },
    tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#e1e5e8",
        borderWidth: 1,
        formatter(params: any) {
            const { name, percent, value } = params;
            return `${name}<br/>${t("PieChart.tooltipValue")}: ${value}<br/>${t("PieChart.tooltipPercentage")}: ${percent}%`;
        },
        textStyle: {
            color: "#1A1A1A",
            fontSize: 14,
        },
        trigger: "item",
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
