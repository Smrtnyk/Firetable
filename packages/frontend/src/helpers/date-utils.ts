import type { FirestoreTimestamp } from "@firetable/types";

import { isNumber, memoize } from "es-toolkit/compat";

export const timezones = memoize(function () {
    return Intl.supportedValuesOf("timeZone").sort(function (a, b) {
        return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
});

export const UTC = "UTC";

/**
 * Creates a UTC timestamp for today with specified time in given timezone
 *
 * @param time - Time in HH:mm format
 * @param timezone - Timezone to use
 * @returns UTC timestamp in milliseconds
 */
export function createTodayUTCTimestamp(time: string, timezone: string): number {
    const todayFormatted = getTodayInTimezone(timezone);
    return createUTCTimestamp(todayFormatted, time, timezone);
}

/**
 * Converts a date string and time string to UTC timestamp considering the timezone
 *
 * @param dateStr Date in DD.MM.YYYY format
 * @param timeStr Time in HH:mm format
 * @param timezone Timezone to use
 * @returns UTC timestamp in milliseconds
 */
export function createUTCTimestamp(dateStr: string, timeStr: string, timezone: string): number {
    const [dayVal, monthVal, yearVal] = dateStr.split(".");
    const [hours, minutes] = timeStr.split(":");

    // Create the date in UTC first to avoid local timezone interpretation
    const timestamp = Date.UTC(
        Number(yearVal),
        Number(monthVal) - 1,
        Number(dayVal),
        Number(hours),
        Number(minutes),
    );

    // Get the offset between UTC and target timezone at this time
    const utcDate = new Date(timestamp).toLocaleString("en-US", { timeZone: "UTC" });
    const tzDate = new Date(timestamp).toLocaleString("en-US", { timeZone: timezone });

    // Convert strings back to dates to compare
    const utcCompare = new Date(utcDate);
    const tzCompare = new Date(tzDate);

    // Calculate the offset in minutes
    const tzOffset = (tzCompare.getTime() - utcCompare.getTime()) / 1000 / 60;

    // Apply the offset to get the correct UTC timestamp
    return timestamp - tzOffset * 60 * 1000;
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
        day: "2-digit",
        month: "2-digit",
        timeZone: timeZone ?? void 0,
        year: "numeric",
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
export function formatEventDate(timestamp: number, locale: string, timeZone: string): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        month: "2-digit",
        second: "2-digit",
        timeZone: timeZone ?? void 0,
        year: "numeric",
    });
    return formatter.format(date);
}

export function getDefaultTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
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

export function getLocalizedDaysOfWeek(locale: string): string[] {
    const format = new Intl.DateTimeFormat(locale, { weekday: "long" });
    // Create dates for each day of the week (using 2024-01-07 as it was a Sunday)
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, 7 + i);
        return format.format(date);
    });
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
        hour12: false,
        minute: "2-digit",
        timeZone: timeZone ?? void 0,
    });
    return formatter.format(date);
}

/**
 * Gets today's date in specified timezone formatted as DD.MM.YYYY
 *
 * @param timezone - Timezone to use for the date
 * @returns Date string in DD.MM.YYYY format
 */
function getTodayInTimezone(timezone: string): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "2-digit",
        timeZone: timezone,
        year: "numeric",
    });

    const dateParts = formatter.formatToParts(new Date());
    const dateObj = dateParts.reduce<Record<string, string>>((acc, part) => {
        if (["day", "month", "year"].includes(part.type)) {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});

    return `${dateObj.day}.${dateObj.month}.${dateObj.year}`;
}
