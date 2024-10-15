import { HALF_HOUR } from "src/constants";
import { addDays } from "date-fns";
import { AppLogger } from "src/logger/FTLogger";

/**
 * Determines whether a reservation should be marked as expired based on the reservation time,
 * event date, and the current time. A reservation is considered expired if the current time
 * is at least 30 minutes after the reservation time on the event date.
 *
 * @param reservationTime - The time of the reservation in "HH:mm" format (24-hour clock).
 * @param eventDate       - The date of the event as a Date object (local time zone).
 * @returns               - Returns `true` if the reservation should be marked as expired; otherwise, `false`.
 *
 * @example
 * // Suppose the eventDate is "2023-10-14" and the reservationTime is "23:30".
 * // If the current time is "2023-10-15T00:01:00", the function will return `false`.
 * // If the current time is "2023-10-15T00:31:00", the function will return `true`.
 *
 * @remarks
 * - The function assumes that reservation times between 00:00 and 11:59 belong to the next day
 *   if they are earlier than the event date's time.
 * - It handles time zones implicitly based on the local system time zone.
 * - Ensure that `eventDate` is correctly instantiated in the local time zone.
 */
export function shouldMarkReservationAsExpired(reservationTime: string, eventDate: Date): boolean {
    // Parse reservation time into hours and minutes
    const [hoursStr, minutesStr] = reservationTime.split(":");
    const hours = Number.parseInt(hoursStr);
    const minutes = Number.parseInt(minutesStr);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        AppLogger.error(
            `Invalid reservationTime format. Expected "HH:mm", but got "${reservationTime}".`,
        );
        return false;
    }

    // Create a Date object for the reservation time on the event date
    let reservationDateTime = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        hours,
        minutes,
        0,
        0,
    );

    // If the reservation time is after midnight (0 AM) but before the event date's time,
    // it belongs to the next day
    if (hours < 12 && reservationDateTime < eventDate) {
        reservationDateTime = addDays(reservationDateTime, 1);
    }

    const currentDateTime = new Date();
    const timeDifference = currentDateTime.getTime() - reservationDateTime.getTime();

    return timeDifference >= HALF_HOUR;
}
