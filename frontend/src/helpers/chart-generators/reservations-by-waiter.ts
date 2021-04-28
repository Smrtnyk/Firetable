import { Options } from "highcharts";
import { TableElement } from "src/types";

interface ReservationObject {
    name: string;
    reservations: number;
    confirmed: number;
}

type Res = Record<string, ReservationObject>;

function reservationsReducer(acc: Res, { reservation }: TableElement) {
    if (!reservation) return acc;

    const { reservedBy, confirmed } = reservation;
    const { id, name } = reservedBy;

    if (acc[id]) {
        acc[id].reservations++;
    } else {
        acc[id] = {
            name,
            reservations: 1,
            confirmed: 0,
        };
    }

    if (confirmed) acc[id].confirmed++;

    return acc;
}

export function generateTablesByWaiterChartOptions(
    chartContainer: HTMLElement,
    reservations: TableElement[]
): Options {
    const data = reservations.reduce(reservationsReducer, {});

    const reservationData = Object.values(data);

    return {
        chart: {
            renderTo: chartContainer,
            type: "bar",
        },

        title: { text: "Breakdown by waiter" },
        tooltip: { valueSuffix: "" },
        xAxis: {
            categories: reservationData.map(({ name }) => name),
            title: { text: null },
        },
        yAxis: {
            min: 0,
            title: {
                text: `Reservations count(${reservations.length})`,
                align: "high",
            },
            labels: { overflow: "justify" },
        },
        series: [
            {
                name: "Confirmed",
                // @ts-ignore
                data: reservationData.map(({ confirmed }) => confirmed),
            },
            {
                name: "Pending",
                // @ts-ignore
                data: reservationData.map(
                    ({ reservations, confirmed }) => reservations - confirmed
                ),
            },
        ],
        plotOptions: {
            bar: { dataLabels: { enabled: true } },
            series: { stacking: "normal" },
        },
        legend: {
            layout: "vertical",
            align: "right",
            verticalAlign: "top",
            x: -40,
            y: 100,
            floating: true,
            borderWidth: 1,
            backgroundColor: "#FFFFFF",
        },
        credits: { enabled: false },
    };
}
