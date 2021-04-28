import { defineComponent, onMounted, PropType, ref } from "vue";

import Highcharts from "highcharts";
import HighChartsMore from "highcharts/highcharts-more";
import { generateTablesOverviewChartOptions } from "src/helpers/chart-generators/tables-overview-chart";
import { setChartTheme } from "src/helpers/chart-generators/themes";

HighChartsMore(Highcharts);
setChartTheme(Highcharts);

const { chart } = Highcharts;

export default defineComponent({
    name: "EventTablesInfoRadarChart",

    props: {
        reservationsStatus: {
            type: Object as PropType<[number, number, number, number, number]>,
            required: true,
        },
    },

    setup(props) {
        const radarChart = ref<HTMLElement | void>(void 0);

        function initChart() {
            if (!radarChart.value) return;

            chart(
                generateTablesOverviewChartOptions(
                    radarChart.value,
                    props.reservationsStatus
                )
            );
        }

        onMounted(initChart);

        return () => <div ref={radarChart} />;
    },
});
