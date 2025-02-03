import { ONE_MINUTE } from "src/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { shouldMarkReservationAsExpired } from "./should-mark-reservation-as-expired";

const DEFAULT_LATE_CRITERIA = 30 * ONE_MINUTE;

describe("shouldMarkReservationAsExpired", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const viennaTimezone = "Europe/Vienna";

    it("returns true when current time is at least 30 minutes after eventDateTime in property timezone", () => {
        const reservationTime = "23:00";
        // 23:00 Vienna time
        const eventDate = new Date("2023-10-14T21:00:00Z");
        // 00:31 next day Vienna time
        const currentDate = new Date("2023-10-14T22:31:00Z");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(
            reservationTime,
            eventDate,
            viennaTimezone,
            DEFAULT_LATE_CRITERIA,
        );

        expect(result).toBe(true);
    });

    it("handles different timezones correctly", () => {
        const testCases = [
            {
                // 16:31 Vienna time
                currentTime: new Date("2023-10-14T14:31:00Z"),
                description: "Vienna - 16:31 is 31 minutes after 16:00",
                expected: true,
                reservationTime: "16:00",
                timezone: "Europe/Vienna",
            },
            {
                // 16:31 NY time
                currentTime: new Date("2023-10-14T20:31:00Z"),
                description: "NY - 16:31 is 31 minutes after 16:00",
                expected: true,
                reservationTime: "16:00",
                timezone: "America/New_York",
            },
        ];

        for (const { currentTime, description, expected, reservationTime, timezone } of testCases) {
            console.log(`\nTesting ${description}`);
            vi.setSystemTime(currentTime);

            const result = shouldMarkReservationAsExpired(
                reservationTime,
                // Using current time as event date for simplicity
                currentTime,
                timezone,
                DEFAULT_LATE_CRITERIA,
            );
            expect(result, `Failed for ${timezone}: ${description}`).toBe(expected);
        }
    });

    it("returns false when current time is less than 30 minutes after eventDateTime", () => {
        const reservationTime = "23:30";
        // Event starts at 22:00 UTC (midnight Vienna time)
        const eventDate = new Date("2023-10-14T22:00:00.000Z");
        // Set current time to 23:50 Vienna time (21:50 UTC)
        const currentDate = new Date("2023-10-14T21:50:00.000Z");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(
            reservationTime,
            eventDate,
            viennaTimezone,
            DEFAULT_LATE_CRITERIA,
        );

        expect(result).toBe(false);
    });

    it("handles midnight crossing correctly", () => {
        // Event starts at 22:00 Vienna time
        const eventDate = new Date("2023-10-14T20:00:00Z");
        // Reservation at 00:30 Vienna time (next day)
        const reservationTime = "00:30";
        // Current time is 01:01 Vienna time (31 minutes after reservation)
        const currentTime = new Date("2023-10-14T23:01:00Z");

        vi.setSystemTime(currentTime);

        const result = shouldMarkReservationAsExpired(
            reservationTime,
            eventDate,
            viennaTimezone,
            DEFAULT_LATE_CRITERIA,
        );

        expect(result).toBe(true);
    });

    it('handles times after midnight correctly (hour starts with "0")', () => {
        const reservationTime = "00:15";
        const eventDate = new Date("2023-10-14");
        // 31 minutes later
        const currentDate = new Date("2023-10-15T00:46:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(
            reservationTime,
            eventDate,
            viennaTimezone,
            DEFAULT_LATE_CRITERIA,
        );

        expect(result).toBe(true);
    });

    it("returns false when current time is less than 30 minutes after eventDateTime for time after midnight", () => {
        const reservationTime = "00:15";
        // Create event date for Oct 14 in Vienna timezone This will be Oct 15 00:00 in Vienna
        const eventDate = new Date("2023-10-14T22:00:00.000Z");
        // Set current time to 25 minutes after reservation (00:15 + 25min = 00:40) This will be Oct 15 00:40 in Vienna
        const currentDate = new Date("2023-10-14T22:40:00.000Z");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(
            reservationTime,
            eventDate,
            viennaTimezone,
            DEFAULT_LATE_CRITERIA,
        );

        expect(result).toBe(false);
    });

    it("returns true when current time is exactly 30 minutes after eventDateTime", () => {
        const reservationTime = "12:00";
        const eventDate = new Date("2023-10-14");
        // Exactly 30 minutes later
        const currentDate = new Date("2023-10-14T12:30:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(
            reservationTime,
            eventDate,
            viennaTimezone,
            DEFAULT_LATE_CRITERIA,
        );

        expect(result).toBe(true);
    });
});
