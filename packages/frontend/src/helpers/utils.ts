import { date } from "quasar";

const { formatDate } = date;

export function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function formatFromTimestamp(timestamp: number, format: string) {
    if (!timestamp) {
        return "";
    }
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

export function whiteSpaceToUnderscore(string: string) {
    return string.replace(/ /g, "_");
}
