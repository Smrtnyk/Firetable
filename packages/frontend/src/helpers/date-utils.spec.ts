import { dateFromTimestamp, formatEventDate, hourFromTimestamp } from "./date-utils";
import { test, describe, expect } from "vitest";

const DEFAULT_LOCALE = "en-GB";
const DEFAULT_TIMEZONE = "UTC";

describe("Date Formatting Functions", () => {
    const testTimestamp = new Date("2024-01-15T12:30:45Z").getTime();

    describe("formatEventDate", () => {
        test("formats correctly in UTC", () => {
            const formattedDate = formatEventDate(testTimestamp, DEFAULT_LOCALE, DEFAULT_TIMEZONE);
            expect(formattedDate).toBe("15/01/2024, 12:30:45");
        });

        test("formats correctly in America/New_York time zone", () => {
            const formattedDate = formatEventDate(
                testTimestamp,
                DEFAULT_LOCALE,
                "America/New_York",
            );
            // Adjusting for -5 hours
            expect(formattedDate).toBe("15/01/2024, 07:30:45");
        });
    });

    describe("dateFromTimestamp", () => {
        test("formats date correctly in UTC", () => {
            const formattedDate = dateFromTimestamp(
                testTimestamp,
                DEFAULT_LOCALE,
                DEFAULT_TIMEZONE,
            );
            // Expected format in de-DE locale
            expect(formattedDate).toBe("15/01/2024");
        });

        test("formats date correctly in America/New_York time zone", () => {
            const formattedDate = dateFromTimestamp(
                testTimestamp,
                DEFAULT_LOCALE,
                "America/New_York",
            );
            // The date remains the same as the time change doesn't affect the date
            expect(formattedDate).toBe("15/01/2024");
        });
    });

    describe("hourFromTimestamp", () => {
        test("formats hour correctly in UTC", () => {
            const formattedTime = hourFromTimestamp(
                testTimestamp,
                DEFAULT_LOCALE,
                DEFAULT_TIMEZONE,
            );
            // Time in UTC
            expect(formattedTime).toBe("12:30");
        });

        test("formats hour correctly in America/New_York time zone", () => {
            const formattedTime = hourFromTimestamp(
                testTimestamp,
                DEFAULT_LOCALE,
                "America/New_York",
            );
            // Adjusting for -5 hours
            expect(formattedTime).toBe("07:30");
        });

        test("formats boundary time correctly in UTC", () => {
            const boundaryTimestamp = new Date("2024-01-01T00:00:00Z").getTime();
            const formattedTime = hourFromTimestamp(
                boundaryTimestamp,
                DEFAULT_LOCALE,
                DEFAULT_TIMEZONE,
            );
            // Beginning of the day
            expect(formattedTime).toBe("00:00");
        });
    });
});
