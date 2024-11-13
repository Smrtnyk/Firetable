import {
    createUTCTimestamp,
    dateFromTimestamp,
    formatEventDate,
    hourFromTimestamp,
} from "./date-utils";
import { test, describe, expect } from "vitest";

const DEFAULT_LOCALE = "en-GB";
const DEFAULT_TIMEZONE = "UTC";

describe("Date Formatting Functions", () => {
    const testTimestamp = new Date("2024-01-15T12:30:45Z").getTime();

    describe("createUTCTimestamp", () => {
        test("converts Vienna time to correct UTC timestamp", () => {
            const dateStr = "15.01.2024";
            const timeStr = "22:00";
            const timezone = "Europe/Vienna";

            const timestamp = createUTCTimestamp(dateStr, timeStr, timezone);

            // Convert back to check if we get the same time in Vienna
            const formattedTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, timezone);
            const formattedDate = dateFromTimestamp(timestamp, DEFAULT_LOCALE, timezone);

            expect(formattedTime).toBe("22:00");
            expect(formattedDate).toBe("15/01/2024");

            // Check UTC time (Vienna is UTC+1 in winter)
            const utcTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, "UTC");
            expect(utcTime).toBe("21:00");
        });

        test("handles daylight saving time correctly", () => {
            // Summer time
            const dateStr = "15.07.2024";
            const timeStr = "22:00";
            const timezone = "Europe/Vienna";

            const timestamp = createUTCTimestamp(dateStr, timeStr, timezone);

            // Check local time is preserved
            const formattedTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, timezone);
            expect(formattedTime).toBe("22:00");

            // Check UTC time (Vienna is UTC+2 in summer)
            const utcTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, "UTC");
            expect(utcTime).toBe("20:00");
        });

        test("handles different timezones correctly", () => {
            const dateStr = "15.01.2024";
            const timeStr = "22:00";
            const timezones = {
                // Next day in UTC
                "America/New_York": "03:00",
                "Asia/Tokyo": "13:00",
                "Australia/Sydney": "11:00",
            };

            for (const [timezone, expectedUTCTime] of Object.entries(timezones)) {
                const timestamp = createUTCTimestamp(dateStr, timeStr, timezone);

                // Check if local time is preserved
                const localTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, timezone);
                expect(localTime).toBe("22:00");

                // Check UTC conversion
                const utcTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, "UTC");
                expect(utcTime).toBe(expectedUTCTime);
            }
        });

        test("handles date change across timezone boundaries", () => {
            const dateStr = "31.12.2024";
            const timeStr = "22:00";
            const timezone = "America/New_York";

            const timestamp = createUTCTimestamp(dateStr, timeStr, timezone);

            // Check local date/time is preserved
            const nyDate = dateFromTimestamp(timestamp, DEFAULT_LOCALE, timezone);
            const nyTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, timezone);
            expect(nyDate).toBe("31/12/2024");
            expect(nyTime).toBe("22:00");

            // Check UTC date (should be next year)
            const utcDate = dateFromTimestamp(timestamp, DEFAULT_LOCALE, "UTC");
            const utcTime = hourFromTimestamp(timestamp, DEFAULT_LOCALE, "UTC");
            expect(utcDate).toBe("01/01/2025");
            expect(utcTime).toBe("03:00");
        });

        test("handles late night (23:00) creation and next day edit correctly", () => {
            const timezone = "Europe/Vienna";

            // Create event at 23:00
            const originalTimestamp = createUTCTimestamp("16.11.2024", "23:00", timezone);

            // Verify original time in Vienna
            const originalViennaTime = hourFromTimestamp(
                originalTimestamp,
                DEFAULT_LOCALE,
                timezone,
            );
            const originalViennaDate = dateFromTimestamp(
                originalTimestamp,
                DEFAULT_LOCALE,
                timezone,
            );
            expect(originalViennaTime).toBe("23:00");
            expect(originalViennaDate).toBe("16/11/2024");

            // Check UTC conversion (Vienna is UTC+1 in winter)
            const originalUtcTime = hourFromTimestamp(originalTimestamp, DEFAULT_LOCALE, "UTC");
            const originalUtcDate = dateFromTimestamp(originalTimestamp, DEFAULT_LOCALE, "UTC");
            expect(originalUtcTime).toBe("22:00");
            expect(originalUtcDate).toBe("16/11/2024");

            // Edit event to next day 11:00
            const editedTimestamp = createUTCTimestamp("17.11.2024", "11:00", timezone);

            // Verify edited time in Vienna
            const editedViennaTime = hourFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone);
            const editedViennaDate = dateFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone);
            expect(editedViennaTime).toBe("11:00");
            expect(editedViennaDate).toBe("17/11/2024");

            // Check UTC conversion
            const editedUtcTime = hourFromTimestamp(editedTimestamp, DEFAULT_LOCALE, "UTC");
            const editedUtcDate = dateFromTimestamp(editedTimestamp, DEFAULT_LOCALE, "UTC");
            expect(editedUtcTime).toBe("10:00");
            expect(editedUtcDate).toBe("17/11/2024");
        });

        test("handles late night (23:00) creation and same day edit correctly", () => {
            const timezone = "Europe/Vienna";

            // Create event at 23:00
            const originalTimestamp = createUTCTimestamp("16.11.2024", "23:00", timezone);

            // Edit event to same day 22:00
            const editedTimestamp = createUTCTimestamp("16.11.2024", "22:00", timezone);

            // Verify both times in Vienna
            expect(hourFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe("23:00");
            expect(dateFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe(
                "16/11/2024",
            );
            expect(hourFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone)).toBe("22:00");
            expect(dateFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone)).toBe("16/11/2024");
        });

        test("handles late night (23:00) during DST transition", () => {
            const timezone = "Europe/Vienna";

            // Test during DST transition (Last Sunday of October 2024 - October 27)
            const originalTimestamp = createUTCTimestamp("26.10.2024", "23:00", timezone);
            const nextDayTimestamp = createUTCTimestamp("27.10.2024", "23:00", timezone);

            // Verify times in Vienna
            expect(hourFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe("23:00");
            expect(dateFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe(
                "26/10/2024",
            );
            expect(hourFromTimestamp(nextDayTimestamp, DEFAULT_LOCALE, timezone)).toBe("23:00");
            expect(dateFromTimestamp(nextDayTimestamp, DEFAULT_LOCALE, timezone)).toBe(
                "27/10/2024",
            );

            // Check UTC conversions
            // Before DST change (UTC+2)
            expect(hourFromTimestamp(originalTimestamp, DEFAULT_LOCALE, "UTC")).toBe("21:00");
            // After DST change (UTC+1)
            expect(hourFromTimestamp(nextDayTimestamp, DEFAULT_LOCALE, "UTC")).toBe("22:00");
        });

        test("handles late night edit across months", () => {
            const timezone = "Europe/Vienna";

            // Create event at last day of month at 23:00
            const originalTimestamp = createUTCTimestamp("31.10.2024", "23:00", timezone);

            // Edit to next month
            const editedTimestamp = createUTCTimestamp("01.11.2024", "11:00", timezone);

            // Verify original time
            expect(hourFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe("23:00");
            expect(dateFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe(
                "31/10/2024",
            );

            // Verify edited time
            expect(hourFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone)).toBe("11:00");
            expect(dateFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone)).toBe("01/11/2024");
        });

        test("handles late night edit across years", () => {
            const timezone = "Europe/Vienna";

            // Create event at last day of year at 23:00
            const originalTimestamp = createUTCTimestamp("31.12.2024", "23:00", timezone);

            // Edit to next year
            const editedTimestamp = createUTCTimestamp("01.01.2025", "11:00", timezone);

            // Verify original time
            expect(hourFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe("23:00");
            expect(dateFromTimestamp(originalTimestamp, DEFAULT_LOCALE, timezone)).toBe(
                "31/12/2024",
            );
            // Verify edited time
            expect(hourFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone)).toBe("11:00");
            expect(dateFromTimestamp(editedTimestamp, DEFAULT_LOCALE, timezone)).toBe("01/01/2025");
        });
    });

    describe("locale handling", () => {
        const testCases = [
            {
                locale: "de-DE",
                expectedDate: "15.01.2024",
                expectedDateTime: "15.01.2024, 12:30:45",
            },
            {
                locale: "en-GB",
                expectedDate: "15/01/2024",
                expectedDateTime: "15/01/2024, 12:30:45",
            },
            {
                locale: "en-US",
                expectedDate: "01/15/2024",
                expectedDateTime: "01/15/2024, 12:30:45",
            },
        ];

        testCases.forEach(({ locale, expectedDate, expectedDateTime }) => {
            test(`formats dates correctly for ${locale}`, () => {
                expect(dateFromTimestamp(testTimestamp, locale, DEFAULT_TIMEZONE)).toBe(
                    expectedDate,
                );
                expect(formatEventDate(testTimestamp, locale, DEFAULT_TIMEZONE)).toBe(
                    expectedDateTime,
                );
            });
        });
    });

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
