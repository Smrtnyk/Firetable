import { getReservationTimeOptions } from "./reservation-form-utils";
import { describe, test, expect } from "vitest";

describe("getReservationTimeOptions", () => {
    test("should return true during event hours", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        // Assume the event is from 12:00 to 20:00 UTC
        expect(getReservationTimeOptions(eventStartTimestamp, 15, 30)).toBeTruthy();
    });

    test("should return false before event hours", () => {
        const eventStartTimestamp = new Date("2024-01-01T12:00:00Z").getTime();
        expect(getReservationTimeOptions(eventStartTimestamp, 10, 0)).toBeFalsy();
    });

    test("should handle event starting late in the day", () => {
        const eventStartTimestamp = new Date("2024-01-01T18:00:00Z").getTime();
        expect(getReservationTimeOptions(eventStartTimestamp, 17, 0)).toBeFalsy();
    });

    test("should handle event ending on the next day", () => {
        const eventStartTimestamp = new Date("2024-01-01T23:00:00Z").getTime();
        expect(getReservationTimeOptions(eventStartTimestamp, 2, 0)).toBeTruthy();
    });
});
