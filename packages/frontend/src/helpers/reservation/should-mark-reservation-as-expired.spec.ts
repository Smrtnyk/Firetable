import { shouldMarkReservationAsExpired } from "./should-mark-reservation-as-expired";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("shouldMarkReservationAsExpired", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns true when current time is at least 30 minutes after eventDateTime", () => {
        const reservationTime = "23:00";
        const eventDate = new Date("2023-10-14");
        // 1 hour and 31 minutes later
        const currentDate = new Date("2023-10-15T00:31:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(reservationTime, eventDate);

        expect(result).toBe(true);
    });

    it("returns false when current time is less than 30 minutes after eventDateTime", () => {
        const reservationTime = "23:30";
        const eventDate = new Date("2023-10-14");
        // 20 minutes later
        const currentDate = new Date("2023-10-14T23:50:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(reservationTime, eventDate);

        expect(result).toBe(false);
    });

    it('handles times after midnight correctly (hour starts with "0")', () => {
        const reservationTime = "00:15";
        const eventDate = new Date("2023-10-14");
        // 31 minutes later
        const currentDate = new Date("2023-10-15T00:46:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(reservationTime, eventDate);

        expect(result).toBe(true);
    });

    it("returns false when current time is less than 30 minutes after eventDateTime for time after midnight", () => {
        const reservationTime = "00:15";
        const eventDate = new Date("2023-10-14");
        // 25 minutes later
        const currentDate = new Date("2023-10-15T00:40:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(reservationTime, eventDate);

        expect(result).toBe(false);
    });

    it("returns true when current time is exactly 30 minutes after eventDateTime", () => {
        const reservationTime = "12:00";
        const eventDate = new Date("2023-10-14");
        // Exactly 30 minutes later
        const currentDate = new Date("2023-10-14T12:30:00");
        vi.setSystemTime(currentDate);

        const result = shouldMarkReservationAsExpired(reservationTime, eventDate);

        expect(result).toBe(true);
    });
});
