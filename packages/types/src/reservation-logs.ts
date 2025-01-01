import type { UserIdentifier } from "./base-reservation.js";
import type { AppUser } from "./auth.js";
import type { Timestamp } from "firebase/firestore";

export enum ReservationAction {
    CANCEL = "CANCEL",
    COPY = "COPY",
    CREATE = "CREATE",
    DELETE = "DELETE",
    GUEST_ARRIVED = "GUEST_ARRIVED",
    LINK = "LINK",
    SOFT_DELETE = "SOFT_DELETE",
    TRANSFER = "TRANSFER",
    UNLINK = "UNLINK",
    UPDATE = "UPDATE",
}

export interface EventLog {
    /**
     * message of the log
     */
    message: string;
    /**
     * creator of the log
     *
     */
    creator: UserIdentifier & { role: AppUser["role"] };
    /**
     * Remove Timestamp after some time has passed
     * due to compat support for old logs
     */
    timestamp: Timestamp | number;
}

export interface FieldChange<T = unknown> {
    field: string;
    oldValue: T;
    newValue: T;
}

export interface UserReference {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface BaseLogEntry {
    action: ReservationAction;
    timestamp: number;
    creator: UserReference;
}

export enum TransferType {
    EMPTY_TABLE = "EMPTY_TABLE",
    SWAP = "SWAP",
}

export interface TableReference {
    label: string;
    floorId: string;
    floorName: string;
}

export interface ReservationReference {
    id: string;
    guestName?: string;
}

export interface TransferDetails {
    type: TransferType;
    isCrossFloor: boolean;
    sourceTable: TableReference;
    targetTable: TableReference;
    targetReservation?: ReservationReference;
}

export type NewLogEntry = Omit<ReservationLogEntry, "timestamp">;

export interface ReservationLogEntry extends BaseLogEntry {
    reservationId: string;
    floorId: string;
    tableLabel: string[] | string;
    guestName?: string;
    numberOfGuests?: number;
    transferDetails?: TransferDetails;
    changes?: Array<FieldChange>;
    linkedTableLabel?: string;
    unlinkedTableLabels?: string[];
}

export interface EventLogsDoc {
    logs: EventLog[];
    structuredLogs?: ReservationLogEntry[];
}
