const LOCALE = "de-DE";

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
        timeZone: timeZone === null ? void 0 : timeZone,
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
        timeZone: timeZone === null ? void 0 : timeZone,
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
        timeZone: timeZone === null ? void 0 : timeZone,
        hour12: false,
    });
    return formatter.format(date);
}
