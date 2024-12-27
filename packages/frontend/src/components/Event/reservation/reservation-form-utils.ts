import { isNumber } from "es-toolkit/compat";

/**
 * Determines if a given time (hours and minutes) falls within the event duration.
 * Assumes the event duration is less than or equal to 24 hours.
 *
 * @param eventStartTimestamp - The start time of the event in milliseconds since the epoch.
 * @param eventDurationHours - The duration of the event in hours.
 * @param hours - The hour component of the time to check (0-23).
 * @param minutes - The minute component of the time to check (0-59). Defaults to 0.
 * @returns True if the given time falls within the event duration, false otherwise.
 */
export function isTimeWithinEventDuration(
    eventStartTimestamp: number,
    eventDurationHours: number,
    hours: number,
    minutes: number | null = 0,
): boolean {
    if (
        hours < 0 ||
        hours > 23 ||
        (isNumber(minutes) && minutes < 0) ||
        (isNumber(minutes) && minutes > 59) ||
        eventDurationHours <= 0 ||
        eventDurationHours > 24
    ) {
        return false;
    }

    // If event duration is 24 hours, it covers the entire day
    if (eventDurationHours === 24) {
        return true;
    }

    // Event start time in minutes since midnight
    const eventStartDate = new Date(eventStartTimestamp);
    const eventStartMinutes = eventStartDate.getUTCHours() * 60 + eventStartDate.getUTCMinutes();

    // Event end time in minutes since midnight, modulo 1440 to wrap around midnight
    const eventEndMinutes = (eventStartMinutes + eventDurationHours * 60) % 1440;

    // Time to check in minutes since midnight
    const timeToCheckMinutes = (hours * 60 + (minutes ?? 0)) % 1440;

    // Determine if the event spans across midnight
    const spansMidnight = eventEndMinutes < eventStartMinutes;

    if (spansMidnight) {
        // Event spans midnight
        return timeToCheckMinutes >= eventStartMinutes || timeToCheckMinutes < eventEndMinutes;
    }
    // Event does not span midnight
    return timeToCheckMinutes >= eventStartMinutes && timeToCheckMinutes < eventEndMinutes;
}
