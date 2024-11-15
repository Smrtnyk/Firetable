import { AppLogger } from "src/logger/FTLogger";
import { addDays } from "date-fns";

/**
 * Determines whether a reservation should be marked as expired based on the reservation time,
 * event date, and the current time in the property's timezone.
 *
 * @param reservationTime - The time of the reservation in "HH:mm" format (24-hour clock)
 * @param eventDate - The date of the event as a Date object created from UTC timestamp
 *                   (created by createUTCTimestamp)
 * @param propertyTimezone - The timezone of the property where the event takes place
 * @param lateCriteria - The number of minutes after the reservation time when the reservation should be marked as expired (in ms)
 * @returns - Returns `true` if the reservation should be marked as expired; otherwise, `false`
 *
 * @example
 * // Event date was saved using createUTCTimestamp:
 * const eventDate = new Date(event.date); // UTC timestamp from createUTCTimestamp
 * shouldMarkReservationAsExpired("23:00", eventDate, "Europe/Vienna", 30 * 60 * 1000);
 */
export function shouldMarkReservationAsExpired(
    reservationTime: string,
    eventDate: Date,
    propertyTimezone: string,
    lateCriteria: number,
): boolean {
    const [hoursStr, minutesStr] = reservationTime.split(":");
    const reservationHour = Number.parseInt(hoursStr);
    const reservationMinute = Number.parseInt(minutesStr);

    if (Number.isNaN(reservationHour) || Number.isNaN(reservationMinute)) {
        AppLogger.error(
            `Invalid reservationTime format. Expected "HH:mm", but got "${reservationTime}".`,
        );
        return false;
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: propertyTimezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    });

    // Get current time in property timezone
    const now = new Date();
    const currentParts = formatter.formatToParts(now);
    const currentObj = currentParts.reduce<Record<string, number>>((acc, part) => {
        if (["year", "month", "day", "hour", "minute", "second"].includes(part.type)) {
            acc[part.type] = Number(part.value);
        }
        return acc;
    }, {});

    // Get event date in property timezone
    const eventParts = formatter.formatToParts(eventDate);
    const eventObj = eventParts.reduce<Record<string, number>>((acc, part) => {
        if (["year", "month", "day", "hour"].includes(part.type)) {
            acc[part.type] = Number(part.value);
        }
        return acc;
    }, {});

    // Create a base reservation date from event date
    let reservationDate = new Date(
        eventObj.year,
        eventObj.month - 1,
        eventObj.day,
        reservationHour,
        reservationMinute,
        0,
    );

    // If reservation is in early hours (00:00-11:59), it's for the next day
    if (reservationHour < 12) {
        reservationDate = addDays(reservationDate, 1);
    }

    // Current date in property timezone
    const currentDate = new Date(
        currentObj.year,
        currentObj.month - 1,
        currentObj.day,
        currentObj.hour,
        currentObj.minute,
        currentObj.second,
    );

    const timeDifference = currentDate.getTime() - reservationDate.getTime();

    // Uncomment for debugging
    // console.log({
    //     propertyTimezone,
    //     reservationTimeStr: reservationTime,
    //     currentTimeStr: `${currentObj.hour}:${currentObj.minute}`,
    //     eventDate: formatter.format(eventDate),
    //     reservationDate: formatter.format(reservationDate),
    //     currentDate: formatter.format(currentDate),
    //     timeDifference,
    //     isExpired: timeDifference >= HALF_HOUR,
    // });

    return timeDifference >= lateCriteria;
}
