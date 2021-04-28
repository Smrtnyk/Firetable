import { defineComponent, onMounted, PropType, ref } from "vue";

import { chart } from "highcharts";

import { TableElement } from "src/types";
import { generateTablesByWaiterChartOptions } from "src/helpers/chart-generators/reservations-by-waiter";

export default defineComponent({
    name: "EventReservationsByWaiterChart",
    props: {
        eventData: {
            type: Array as PropType<TableElement[]>,
            required: true,
        },
    },
    setup(props) {
        const lineChart = ref<HTMLElement | undefined>(void 0);
        const reservations = props.eventData.filter(
            (table) => !!table.reservation
        );

        function init() {
            if (!lineChart.value) return;

            chart(
                generateTablesByWaiterChartOptions(
                    lineChart.value,
                    reservations
                )
            );
        }

        onMounted(init);

        return () => <div ref={lineChart} class="EventChart" />;
    },
});
