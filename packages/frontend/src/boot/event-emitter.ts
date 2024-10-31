import type { EventDoc, Reservation, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { BaseTable } from "@firetable/floor-creator";
import { EventEmitter } from "@posva/event-emitter";

type TransferEventData = {
    fromTable: BaseTable;
    toTable: BaseTable;
    eventOwner: EventOwner;
    fromFloor?: string;
    toFloor?: string;
    targetReservation: ReservationDoc | undefined;
};

type Events = {
    "reservation:created": {
        reservation: Reservation;
        eventOwner: EventOwner;
        event: EventDoc;
    };
    "reservation:updated": {
        reservation: ReservationDoc;
        eventOwner: EventOwner;
        event: EventDoc;
    };
    "reservation:deleted": {
        reservation: ReservationDoc;
        eventOwner: EventOwner;
        event: EventDoc;
    };
    "reservation:deleted:soft": {
        reservation: ReservationDoc;
        eventOwner: EventOwner;
        event: EventDoc;
    };
    "reservation:copied": {
        sourceReservation: Reservation;
        targetTable: BaseTable;
        eventOwner: EventOwner;
    };
    "reservation:transferred": TransferEventData;
    "reservation:arrived": {
        reservation: ReservationDoc;
        eventOwner: EventOwner;
        event: EventDoc;
    };
    "reservation:cancelled": {
        reservation: ReservationDoc;
        eventOwner: EventOwner;
        event: EventDoc;
    };
};

export const eventEmitter = new EventEmitter<Events>();
