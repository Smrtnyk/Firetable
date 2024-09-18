import { isTimeWithinEventDuration } from "./reservation-form-utils";
import { describe, it, expect } from "vitest";

describe("isTimeWithinEventDuration", () => {
    it("returns true during event hours", () => {
        // 12:00 UTC
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 12, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 15, 30)).toBeTruthy();
    });

    it("returns false before event hours", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 12, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 10, 0)).toBeFalsy();
    });

    it("handles event starting late in the day", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 18, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 17, 0)).toBeFalsy();
    });

    it("handles event ending on the next day", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 23, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 2, 0)).toBeTruthy();
    });

    it("returns true at the exact event start time", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 12, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 12, 0)).toBeTruthy();
    });

    it("returns false right after event ends", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 12, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 20, 1)).toBeFalsy();
    });

    it("handles invalid time inputs", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 12, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, -1, 0)).toBeFalsy();
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 24, 0)).toBeFalsy();
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 23, 60)).toBeFalsy();
        expect(isTimeWithinEventDuration(eventStartTimestamp, -5, 12, 0)).toBeFalsy();
        expect(isTimeWithinEventDuration(eventStartTimestamp, 25, 12, 0)).toBeFalsy();
    });

    it("handles event starting at midnight", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 0, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 2, 0)).toBeTruthy();
    });

    it("handles event ending at midnight", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 16, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 23, 59)).toBeTruthy();
        expect(isTimeWithinEventDuration(eventStartTimestamp, 8, 0, 0)).toBeFalsy();
    });

    it("event duration of 24 hours", () => {
        const eventStartTimestamp = Date.UTC(2024, 0, 1, 0, 0, 0);
        expect(isTimeWithinEventDuration(eventStartTimestamp, 24, 12, 0)).toBeTruthy();
        expect(isTimeWithinEventDuration(eventStartTimestamp, 24, 23, 59)).toBeTruthy();
    });
});
