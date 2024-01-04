import { dateFromTimestamp, formatEventDate, hourFromTimestamp } from "./date-utils";
import { test, describe, expect } from "vitest";

describe("Date Formatting Functions", () => {
    const testTimestamp = new Date("2024-01-15T12:30:45Z").getTime(); // Example UTC timestamp

    describe("formatEventDate", () => {
        test("formats correctly in UTC", () => {
            const formattedDate = formatEventDate(testTimestamp, "UTC");
            expect(formattedDate).toBe("15.01.2024, 12:30:45");
        });

        test("formats correctly in America/New_York time zone", () => {
            const formattedDate = formatEventDate(testTimestamp, "America/New_York");
            expect(formattedDate).toBe("15.01.2024, 07:30:45"); // Adjusting for -5 hours
        });

        test("formats correctly with null time zone", () => {
            const formattedDate = formatEventDate(testTimestamp, null);
            // The expected result here should match the local time zone of the test environment
            // Since this can vary, you might want to check for non-null or valid string output
            expect(formattedDate).not.toBeNull();
            expect(typeof formattedDate).toBe("string");
        });
    });

    describe("dateFromTimestamp", () => {
        test("formats date correctly in UTC", () => {
            const formattedDate = dateFromTimestamp(testTimestamp, "UTC");
            expect(formattedDate).toBe("15.01.2024"); // Expected format in de-DE locale
        });

        test("formats date correctly in America/New_York time zone", () => {
            const formattedDate = dateFromTimestamp(testTimestamp, "America/New_York");
            expect(formattedDate).toBe("15.01.2024"); // The date remains the same as the time change doesn't affect the date
        });

        test("formats date correctly with null time zone", () => {
            const formattedDate = dateFromTimestamp(testTimestamp, null);
            // Check for non-null or valid string output
            expect(formattedDate).not.toBeNull();
            expect(typeof formattedDate).toBe("string");
        });
    });

    describe("hourFromTimestamp", () => {
        test("formats hour correctly in UTC", () => {
            const formattedTime = hourFromTimestamp(testTimestamp, "UTC");
            expect(formattedTime).toBe("12:30"); // Time in UTC
        });

        test("formats hour correctly in America/New_York time zone", () => {
            const formattedTime = hourFromTimestamp(testTimestamp, "America/New_York");
            expect(formattedTime).toBe("07:30"); // Adjusting for -5 hours
        });

        test("formats hour correctly with null time zone", () => {
            const formattedTime = hourFromTimestamp(testTimestamp, null);
            // Check for non-null or valid string output
            expect(formattedTime).not.toBeNull();
            expect(typeof formattedTime).toBe("string");
        });
    });
});
