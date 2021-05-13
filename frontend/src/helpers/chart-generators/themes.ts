import Highcharts from "highcharts";
import { getDarkMode } from "src/config";

export function setChartTheme(HighChartsModule: typeof Highcharts): void {
    if (!getDarkMode()) {
        // @ts-ignore
        HighChartsModule.theme = {};
    } else {
        // @ts-ignore
        HighChartsModule.theme = {
            colors: [
                "#905196",
                "#665191",
                "#b85091",
                "#db5184",
                "#f55a6f",
                "#ff6d55",
                "#ff8836",
                "#ffa600",
            ],
            chart: {
                backgroundColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 1,
                        y2: 1,
                    },
                    stops: [
                        [0, "#2a2a2b"],
                        [1, "#3e3e40"],
                    ],
                },
                style: {},
                plotBorderColor: "#606063",
            },
            title: {
                style: {
                    color: "#E0E0E3",
                    textTransform: "uppercase",
                    fontSize: "20px",
                },
            },
            subtitle: {
                style: {
                    color: "#E0E0E3",
                    textTransform: "uppercase",
                },
            },
            xAxis: {
                gridLineColor: "#707073",
                labels: {
                    style: {
                        color: "#E0E0E3",
                    },
                },
                lineColor: "#707073",
                minorGridLineColor: "#505053",
                tickColor: "#707073",
                title: {
                    style: {
                        color: "#A0A0A3",
                    },
                },
            },
            yAxis: {
                gridLineColor: "#707073",
                labels: {
                    style: {
                        color: "#E0E0E3",
                    },
                },
                lineColor: "#707073",
                minorGridLineColor: "#505053",
                tickColor: "#707073",
                tickWidth: 1,
                title: {
                    style: {
                        color: "#A0A0A3",
                    },
                },
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                style: {
                    color: "#F0F0F0",
                },
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        color: "#F0F0F3",
                        style: {
                            fontSize: "13px",
                        },
                    },
                    marker: {
                        lineColor: "#333",
                    },
                },
                boxplot: {
                    fillColor: "#505053",
                },
                candlestick: {
                    upLineColor: "white",
                },
                errorbar: {
                    color: "white",
                },
            },
            legend: {
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                itemStyle: {
                    color: "#E0E0E3",
                },
                itemHoverStyle: {
                    color: "#FFF",
                },
                itemHiddenStyle: {
                    color: "#606063",
                },
                title: {
                    style: {
                        color: "#C0C0C0",
                    },
                },
            },
            credits: {
                style: {
                    color: "#666",
                },
            },
            // @ts-ignore
            labels: {
                style: {
                    color: "#707073",
                },
            },

            drilldown: {
                activeAxisLabelStyle: {
                    color: "#F0F0F3",
                },
                activeDataLabelStyle: {
                    color: "#F0F0F3",
                },
            },

            navigation: {
                buttonOptions: {
                    symbolStroke: "#DDDDDD",
                    theme: {
                        fill: "#505053",
                    },
                },
            },

            // scroll charts
            rangeSelector: {
                buttonTheme: {
                    fill: "#505053",
                    stroke: "#000000",
                    style: {
                        color: "#CCC",
                    },
                    states: {
                        hover: {
                            fill: "#707073",
                            stroke: "#000000",
                            style: {
                                color: "white",
                            },
                        },
                        select: {
                            fill: "#000003",
                            stroke: "#000000",
                            style: {
                                color: "white",
                            },
                        },
                    },
                },
                inputBoxBorderColor: "#505053",
                inputStyle: {
                    backgroundColor: "#333",
                    color: "silver",
                },
                labelStyle: {
                    color: "silver",
                },
            },

            navigator: {
                handles: {
                    backgroundColor: "#666",
                    borderColor: "#AAA",
                },
                outlineColor: "#CCC",
                maskFill: "rgba(255,255,255,0.1)",
                series: {
                    color: "#7798BF",
                    lineColor: "#A6C7ED",
                },
                xAxis: {
                    gridLineColor: "#505053",
                },
            },

            scrollbar: {
                barBackgroundColor: "#808083",
                barBorderColor: "#808083",
                buttonArrowColor: "#CCC",
                buttonBackgroundColor: "#606063",
                buttonBorderColor: "#606063",
                rifleColor: "#FFF",
                trackBackgroundColor: "#404043",
                trackBorderColor: "#404043",
            },
        };
    }

    // @ts-ignore
    HighChartsModule.setOptions(HighChartsModule.theme);
}
