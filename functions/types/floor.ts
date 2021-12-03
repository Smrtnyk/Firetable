import { User } from "./auth";

export interface RawFloor {
    id: string;
    name: string;
    width: number;
    height: number;
    data: BaseFloorElement[];
}

interface Reservation {
    confirmed: boolean;
    groupedWith: string[];
    guestContact?: string;
    guestName: string;
    numberOfGuests: number;
    reservationNote?: string;
    reservedBy: Omit<User, "status"|"floors"|"password">;
}

export const enum ElementType {
    RECT_TABLE = "tableElement",
    ROUND_TABLE = "roundTableElement"
}

const enum ElementTag {
    RECT = "rect",
    CIRCLE = "circle"
}

export interface BaseFloorElement {
    id: string;
    type: ElementType;
    tag: ElementTag;
    x: number;
    y: number;
    height: number;
    width: number;
}

export interface TableElement extends BaseFloorElement {
    tableId: string;
    floor: string;
    reservation?: Reservation;
}
