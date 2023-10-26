import { date } from "quasar";

const { formatDate } = date;

function formatFromTimestamp(timestamp: number, format: string) {
    if (!timestamp) return "";
    return formatDate(timestamp, format);
}

export function formatEventDate(timestamp: number) {
    return formatFromTimestamp(timestamp, "DD-MM-YYYY HH:mm");
}

export function dateFromTimestamp(timestamp: number) {
    return formatFromTimestamp(timestamp, "DD-MM-YYYY");
}

export function hourFromTimestamp(timestamp: number) {
    return formatFromTimestamp(timestamp, "HH:mm");
}
