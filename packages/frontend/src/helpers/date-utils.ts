import type { FirestoreTimestamp } from "@firetable/types";
import { isNumber } from "es-toolkit/compat";

export const timezones = Intl.supportedValuesOf("timeZone").sort();
export const UTC = "UTC";

/**
 * Pass null as timeZone to show time in current time zone
 *
 * @param timestamp Timestamp in milliseconds
 * @param locale
 * @param timeZone Time zone to use
 */
export function formatEventDate(timestamp: number, locale: string, timeZone: string): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(locale, {
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
 * @param locale
 * @param timeZone Time zone to use
 */
export function dateFromTimestamp(timestamp: number, locale: string, timeZone: string): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(locale, {
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
 * @param locale
 * @param timeZone Time zone to use
 */
export function hourFromTimestamp(timestamp: number, locale: string, timeZone: string): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timeZone ?? void 0,
        hour12: false,
    });
    return formatter.format(date);
}

export function getFormatedDateFromTimestamp(
    timestamp: FirestoreTimestamp | number,
    locale: string,
    timezone: string,
): string {
    if (isNumber(timestamp)) {
        return formatEventDate(timestamp, locale, timezone);
    }
    return formatEventDate(timestamp.toMillis(), locale, timezone);
}

export function getDefaultTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
