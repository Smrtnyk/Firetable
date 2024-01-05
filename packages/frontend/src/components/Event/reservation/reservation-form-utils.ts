export function getReservationTimeOptions(
    eventStartTimestamp: number,
    eventDuration: number,
    hr: number,
    min: number | null = 0,
): boolean {
    const eventStart = new Date(eventStartTimestamp);
    const eventEnd = new Date(eventStartTimestamp + eventDuration * 3600 * 1000);

    const currentDate = new Date(Date.now());
    const currentTime = new Date(
        Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            hr,
            min ?? 0,
            0,
            0,
        ),
    );

    // Check if the event spans across midnight
    const spansAcrossMidnight =
        eventEnd.getUTCHours() + eventEnd.getUTCMinutes() / 60 <
        eventStart.getUTCHours() + eventStart.getUTCMinutes() / 60;

    // Adjust the current time to the next day if needed
    if (spansAcrossMidnight && currentTime < eventStart) {
        currentTime.setUTCDate(currentTime.getUTCDate() + 1);
    }

    // Convert times to hours since the start of the day in UTC
    const eventStartHours = eventStart.getUTCHours() + eventStart.getUTCMinutes() / 60;
    const eventEndHours = eventEnd.getUTCHours() + eventEnd.getUTCMinutes() / 60;
    const currentTimeHours = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;

    // Determine if the current time is within the event duration
    if (spansAcrossMidnight) {
        return currentTimeHours >= eventStartHours || currentTimeHours <= eventEndHours;
    }
    return currentTimeHours >= eventStartHours && currentTimeHours <= eventEndHours;
}
