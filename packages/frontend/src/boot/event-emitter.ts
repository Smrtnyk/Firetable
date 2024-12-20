import type { EventDoc, Reservation, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { BaseTable } from "@firetable/floor-creator";
import { EventEmitter } from "@posva/event-emitter";

interface BaseEventData {
    eventOwner: EventOwner;
    event: EventDoc;
}

interface BaseReservationEventData extends BaseEventData {
    reservation: ReservationDoc;
}

export interface TransferEventData {
    fromTable: BaseTable;
    toTable: BaseTable;
    eventOwner: EventOwner;
    fromFloor?: string;
    toFloor?: string;
    targetReservation: ReservationDoc | undefined;
}

interface LinkEventData extends BaseEventData {
    sourceReservation: ReservationDoc;
    linkedTableLabel: string;
}

interface UnlinkEventData extends BaseEventData {
    sourceReservation: ReservationDoc;
    unlinkedTableLabels: string[];
}

interface UpdateReservationEventData extends BaseEventData {
    reservation: ReservationDoc;
    oldReservation: ReservationDoc;
}

type Events = {
    "reservation:created": BaseEventData & {
        reservation: Reservation;
    };
    "reservation:updated": UpdateReservationEventData;
    "reservation:deleted": BaseReservationEventData;
    "reservation:deleted:soft": BaseReservationEventData;
    "reservation:copied": {
        sourceReservation: Reservation;
        targetTable: BaseTable;
        eventOwner: EventOwner;
    };
    "reservation:transferred": TransferEventData;
    "reservation:arrived": BaseReservationEventData;
    "reservation:cancelled": BaseReservationEventData;
    "reservation:linked": LinkEventData;
    "reservation:unlinked": UnlinkEventData;
};

export const eventEmitter = new EventEmitter<Events>();
