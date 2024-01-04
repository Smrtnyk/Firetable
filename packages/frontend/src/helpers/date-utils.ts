export function formatEventDate(timestamp: number, timeZone: string | null = "UTC"): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("en-US", {
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

export function dateFromTimestamp(timestamp: number, timeZone: string | null = "UTC"): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: timeZone === null ? void 0 : timeZone,
    });
    return formatter.format(date);
}

export function hourFromTimestamp(timestamp: number, timeZone: string | null = "UTC"): string {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timeZone === null ? void 0 : timeZone,
        hour12: false,
    });
    return formatter.format(date);
}
