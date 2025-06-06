import type { BaseTable } from "@firetable/floor-creator";
import type { EventDoc, Reservation, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "src/db";

import { EventEmitter } from "@posva/event-emitter";

export interface TransferEventData {
    eventOwner: EventOwner;
    fromFloor?: string;
    fromTable: BaseTable;
    targetReservation: ReservationDoc | undefined;
    toFloor?: string;
    toTable: BaseTable;
}

interface BaseEventData {
    event: EventDoc;
    eventOwner: EventOwner;
}

interface BaseReservationEventData extends BaseEventData {
    reservation: ReservationDoc;
}

type Events = {
    "reservation:arrived": BaseReservationEventData;
    "reservation:cancelled": BaseReservationEventData;
    "reservation:copied": {
        eventOwner: EventOwner;
        sourceReservation: Reservation;
        targetTable: BaseTable;
    };
    "reservation:created": BaseEventData & {
        reservation: Reservation;
    };
    "reservation:deleted": BaseReservationEventData;
    "reservation:deleted:soft": BaseReservationEventData;
    "reservation:linked": LinkEventData;
    "reservation:transferred": TransferEventData;
    "reservation:unlinked": UnlinkEventData;
    "reservation:updated": UpdateReservationEventData;
};

interface LinkEventData extends BaseEventData {
    linkedTableLabel: string;
    sourceReservation: ReservationDoc;
}

interface UnlinkEventData extends BaseEventData {
    sourceReservation: ReservationDoc;
    unlinkedTableLabels: string[];
}

interface UpdateReservationEventData extends BaseEventData {
    oldReservation: ReservationDoc;
    reservation: ReservationDoc;
}

export const eventEmitter = new EventEmitter<Events>();
