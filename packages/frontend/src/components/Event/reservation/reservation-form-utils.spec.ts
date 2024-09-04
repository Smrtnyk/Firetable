import { getReservationTimeOptions } from "./reservation-form-utils";
import { describe, test, expect } from "vitest";

describe("getReservationTimeOptions", () => {
    test("returns true during event hours", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        // Assume the event is from 12:00 to 20:00 UTC
        expect(getReservationTimeOptions(eventStartTimestamp, 10, 15, 30)).toBeTruthy();
    });

    test("returns false before event hours", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        expect(getReservationTimeOptions(eventStartTimestamp, 10, 10, 0)).toBeFalsy();
    });

    test("handles event starting late in the day", () => {
        const eventStartTimestamp = new Date("2024-01-01T18:00:00Z").getTime();
        expect(getReservationTimeOptions(eventStartTimestamp, 8, 17, 0)).toBeFalsy();
    });

    test("handles event ending on the next day", () => {
        const eventStartTimestamp = new Date("2024-01-01T23:00:00Z").getTime();
        expect(getReservationTimeOptions(eventStartTimestamp, 8, 2, 0)).toBeTruthy();
    });

    test("returns true at the exact event start time", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        // Event from 12:00 to 20:00 UTC
        expect(getReservationTimeOptions(eventStartTimestamp, 8, 12, 0)).toBeTruthy();
    });

    test("returns false right after event ends", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        // Event from 12:00 to 20:00 UTC, checking at 20:01
        expect(getReservationTimeOptions(eventStartTimestamp, 8, 20, 1)).toBeFalsy();
    });

    test("handles invalid time inputs", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        // Negative hour
        expect(getReservationTimeOptions(eventStartTimestamp, 10, -1, 0)).toBeFalsy();
        // Hour greater than 23
        expect(getReservationTimeOptions(eventStartTimestamp, 10, 24, 0)).toBeFalsy();
    });
});
