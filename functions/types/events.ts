import { RawFloor } from "./floor";

export interface CreateEventPayload {
    name: string;
    date: string;
    guestListLimit: number;
    img: string;
    entryPrice: number;
    id: string;
    floors: RawFloor[];
}
