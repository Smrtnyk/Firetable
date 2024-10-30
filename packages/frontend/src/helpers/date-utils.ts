import type { FirestoreTimestamp } from "@firetable/types";
import { isNumber } from "es-toolkit/compat";

export const timezones = Intl.supportedValuesOf("timeZone").sort();
export const UTC = "UTC";

/**
 * Gets today's date in specified timezone formatted as DD.MM.YYYY
 *
 * @param timezone - Timezone to use for the date
 * @returns Date string in DD.MM.YYYY format
 */
export function getTodayInTimezone(timezone: string): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const dateParts = formatter.formatToParts(new Date());
    const dateObj = dateParts.reduce<Record<string, string>>((acc, part) => {
        if (["year", "month", "day"].includes(part.type)) {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});

    return `${dateObj.day}.${dateObj.month}.${dateObj.year}`;
}

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

    // First create date in UTC
    const utcDate = Date.UTC(
        Number(yearVal),
        Number(monthVal) - 1,
        Number(dayVal),
        Number(timeStr.split(":")[0]),
        Number(timeStr.split(":")[1]),
    );

    // Create formatters for both UTC and target timezone
    const targetFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const parts = targetFormatter.formatToParts(utcDate);
    const targetObj = parts.reduce<Record<string, string>>((acc, part) => {
        if (["year", "month", "day", "hour", "minute"].includes(part.type)) {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});

    // Calculate the offset needed to make target time match desired time
    const targetHour = Number(targetObj.hour);
    const desiredHour = Number(timeStr.split(":")[0]);
    const hourOffset = desiredHour - targetHour;

    // Adjust UTC time by the offset
    const adjustedUtc = new Date(utcDate);
    adjustedUtc.setUTCHours(adjustedUtc.getUTCHours() + hourOffset);

    return adjustedUtc.getTime();
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
