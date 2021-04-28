import type { Options } from "highcharts";

export function generateTablesOverviewChartOptions(
    chartContainer: HTMLElement,
    data: [number, number, number, number, number]
): Options {
    return {
        chart: {
            renderTo: chartContainer,
            polar: true,
            type: "line",
            height: "85%",
        },

        title: {
            text: "Tables overview",
        },

        pane: {
            size: "91%",
        },

        legend: {
            enabled: false,
        },

        xAxis: {
            categories: ["total", "Reserved", "Pending", "Confirmed", "Free"],
            tickmarkPlacement: "on",
            lineWidth: 0,
        },

        yAxis: {
            gridLineInterpolation: "polygon",
            lineWidth: 0,
            min: 0,
        },

        tooltip: {
            shared: true,
            pointFormat:
                "<span style='color:{series.color}'><b>{point.y}</b><span/>",
        },
        // @ts-expect-error I think its confused about the data type that should go here given the amount of charts available
        series: [{ data }],

        credits: { enabled: false },
    };
}
