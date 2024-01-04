export function getReservationTimeOptions(
    hr: number,
    min: number | null = 0,
    eventStartTimestamp: number,
): boolean {
    // Calculate the event start and end times based on the eventStartTimestamp in UTC
    const eventStart = new Date(eventStartTimestamp);
    const eventEnd = new Date(eventStartTimestamp + 8 * 3600 * 1000); // Add 8 hours

    // Create a date object for the current day in UTC with the hour and minute from the time picker
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

    // If the current UTC time is before the event start time and the event starts late in the day (e.g., after 16:00 UTC),
    // assume the time picker is selecting a time for the next day
    if (currentTime.getUTCHours() < eventStart.getUTCHours() && eventStart.getUTCHours() > 16) {
        currentTime.setUTCDate(currentTime.getUTCDate() + 1);
    }

    // Convert event start and end times to hours since the start of the day in UTC
    const eventStartHours = eventStart.getUTCHours() + eventStart.getUTCMinutes() / 60;
    const eventEndHours = eventEnd.getUTCHours() + eventEnd.getUTCMinutes() / 60;

    // Convert current time to hours since the start of the day in UTC
    const currentTimeHours = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;

    // We need to handle the case where the end time is on the next day
    if (eventEndHours < eventStartHours) {
        return currentTimeHours >= eventStartHours || currentTimeHours <= eventEndHours;
    }
    return currentTimeHours >= eventStartHours && currentTimeHours <= eventEndHours;
}
