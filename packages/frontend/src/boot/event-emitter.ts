import type { AppUser, EventDoc, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { BaseTable, Floor } from "@firetable/floor-creator";
import { EventEmitter } from "@posva/event-emitter";

export interface BaseEventData {
    eventOwner: EventOwner;
    event: EventDoc;
    user: AppUser;
}

export interface TransferEventData extends BaseEventData {
    sourceTableLabel: string;
    targetTableLabel: string;
    sourceFloor: { id: string; name: string };
    targetFloor: { id: string; name: string };
    targetReservation: ReservationDoc | undefined;
    sourceReservation: ReservationDoc;
}

type Events = {
    "reservation:created": BaseEventData & {
        sourceReservation: ReservationDoc;
    };
    "reservation:updated": BaseEventData & {
        sourceReservation: ReservationDoc;
        newReservation: ReservationDoc;
    };
    "reservation:deleted": BaseEventData & {
        sourceReservation: ReservationDoc;
    };
    "reservation:deleted:soft": BaseEventData & {
        sourceReservation: ReservationDoc;
    };
    "reservation:copied": BaseEventData & {
        sourceReservation: ReservationDoc;
        targetTable: BaseTable;
        targetFloor: Floor;
    };
    "reservation:transferred": TransferEventData;
    "reservation:arrived": BaseEventData & {
        sourceReservation: ReservationDoc;
    };
    "reservation:cancelled": BaseEventData & {
        sourceReservation: ReservationDoc;
    };
    "reservation:linked": BaseEventData & {
        sourceReservation: ReservationDoc;
        linkedTableLabel: string;
    };
    "reservation:unlinked": BaseEventData & {
        sourceReservation: ReservationDoc;
        unlinkedTableLabels: string[];
    };
};

export const eventEmitter = new EventEmitter<Events>();
