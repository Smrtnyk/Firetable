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
) {
    const data = reservations.reduce(reservationsReducer, {});

    const reservationData = Object.values(data);

    return { reservationData };
}
