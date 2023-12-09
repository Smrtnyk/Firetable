import { format } from "date-fns";

export function formatEventDate(timestamp: number): string {
    return format(timestamp, "dd-MM-yyyy HH:mm");
}

export function dateFromTimestamp(timestamp: number): string {
    return format(timestamp, "dd-MM-yyyy");
}

export function hourFromTimestamp(timestamp: number): string {
    return format(timestamp, "HH:mm");
}
