function formatFromTimestamp(timestamp: number, format: string): string {
    if (!timestamp) return "";

    const dateObj = new Date(timestamp);

    let formattedString = format;

    if (format.includes("DD")) {
        const day = String(dateObj.getUTCDate()).padStart(2, "0");
        formattedString = formattedString.replace("DD", day);
    }

    if (format.includes("MM")) {
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
        formattedString = formattedString.replace("MM", month);
    }

    if (format.includes("YYYY")) {
        const year = dateObj.getUTCFullYear().toString();
        formattedString = formattedString.replace("YYYY", year);
    }

    if (format.includes("HH")) {
        const hours = String(dateObj.getUTCHours()).padStart(2, "0");
        formattedString = formattedString.replace("HH", hours);
    }

    if (format.includes("mm")) {
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
        formattedString = formattedString.replace("mm", minutes);
    }

    return formattedString;
}

export function formatEventDate(timestamp: number) {
    return formatFromTimestamp(timestamp, "DD-MM-YYYY HH:mm");
}

export function dateFromTimestamp(timestamp: number) {
    return formatFromTimestamp(timestamp, "DD-MM-YYYY");
}

export function hourFromTimestamp(timestamp: number) {
    return formatFromTimestamp(timestamp, "HH:mm");
}
