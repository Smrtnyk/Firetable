import { dateFromTimestamp, formatEventDate, hourFromTimestamp } from "./date-utils";
import { test, describe, expect } from "vitest";

describe("Date Formatting Functions", () => {
    const testTimestamp = new Date("2024-01-15T12:30:45Z").getTime();

    describe("formatEventDate", () => {
        test("formats correctly in UTC", () => {
            const formattedDate = formatEventDate(testTimestamp, "UTC");
            expect(formattedDate).toBe("15.01.2024, 12:30:45");
        });

        test("formats correctly in America/New_York time zone", () => {
            const formattedDate = formatEventDate(testTimestamp, "America/New_York");
            // Adjusting for -5 hours
            expect(formattedDate).toBe("15.01.2024, 07:30:45");
        });

        test("formats correctly with null time zone", () => {
            const formattedDate = formatEventDate(testTimestamp, null);
            // The expected result here should match the local time zone of the test environment
            // Since this can vary, we might want to check for non-null or valid string output
            expect(formattedDate).not.toBeNull();
            expect(typeof formattedDate).toBe("string");
        });
    });

    describe("dateFromTimestamp", () => {
        test("formats date correctly in UTC", () => {
            const formattedDate = dateFromTimestamp(testTimestamp, "UTC");
            // Expected format in de-DE locale
            expect(formattedDate).toBe("15.01.2024");
        });

        test("formats date correctly in America/New_York time zone", () => {
            const formattedDate = dateFromTimestamp(testTimestamp, "America/New_York");
            // The date remains the same as the time change doesn't affect the date
            expect(formattedDate).toBe("15.01.2024");
        });

        test("formats date correctly with null time zone", () => {
            const formattedDate = dateFromTimestamp(testTimestamp, null);
            // Check for non-null and valid string output
            expect(formattedDate).not.toBeNull();
            expect(typeof formattedDate).toBe("string");
        });
    });

    describe("hourFromTimestamp", () => {
        test("formats hour correctly in UTC", () => {
            const formattedTime = hourFromTimestamp(testTimestamp, "UTC");
            // Time in UTC
            expect(formattedTime).toBe("12:30");
        });

        test("formats hour correctly in America/New_York time zone", () => {
            const formattedTime = hourFromTimestamp(testTimestamp, "America/New_York");
            // Adjusting for -5 hours
            expect(formattedTime).toBe("07:30");
        });

        test("formats hour correctly with null time zone", () => {
            const formattedTime = hourFromTimestamp(testTimestamp, null);
            // Check for non-null and valid string output
            expect(formattedTime).not.toBeNull();
            expect(typeof formattedTime).toBe("string");
        });

        test("formats boundary time correctly in UTC", () => {
            const boundaryTimestamp = new Date("2024-01-01T00:00:00Z").getTime();
            const formattedTime = hourFromTimestamp(boundaryTimestamp, "UTC");
            // Beginning of the day
            expect(formattedTime).toBe("00:00");
        });
    });
});
