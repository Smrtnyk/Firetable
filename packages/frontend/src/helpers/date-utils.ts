import type { FirestoreTimestamp } from "@firetable/types";
import { isNumber } from "es-toolkit/compat";

const LOCALE = "de-DE";

export const timezones = Intl.supportedValuesOf("timeZone").sort();

/**
 * Pass null as timeZone to show time in current time zone
 *
 * @param timestamp Timestamp in milliseconds
 * @param timeZone Time zone to use
 */
export function formatEventDate(timestamp: number, timeZone: string | null = "UTC"): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(LOCALE, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timeZone ?? void 0,
        hour12: false,
    });
    return formatter.format(date);
}

/**
 * Pass null as timeZone to show time in current time zone
 *
 * @param timestamp Timestamp in milliseconds
 * @param timeZone Time zone to use
 */
export function dateFromTimestamp(timestamp: number, timeZone: string | null = "UTC"): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(LOCALE, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: timeZone ?? void 0,
    });
    return formatter.format(date);
}

/**
 * Pass null as timeZone to show time in current time zone
 *
 * @param timestamp Timestamp in milliseconds
 * @param timeZone Time zone to use
 */
export function hourFromTimestamp(timestamp: number, timeZone: string | null = "UTC"): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timeZone ?? void 0,
        hour12: false,
    });
    return formatter.format(date);
}

export function getFormatedDateFromTimestamp(timestamp: FirestoreTimestamp | number): string {
    if (isNumber(timestamp)) {
        return formatEventDate(timestamp, null);
    }
    return formatEventDate(timestamp.toMillis(), null);
}

export function getDefaultTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
