export function isEventInProgress(eventDate: number): boolean {
    const currentDateInUTC = Date.now();

    return currentDateInUTC >= eventDate;
}
