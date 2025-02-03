import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isEventInProgress } from "./is-event-in-progress";

describe("isEventInProgress", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns true when current time is after eventDate", () => {
        const eventDate = new Date("2023-10-14T12:00:00").getTime();
        // 1 minute later
        const currentDate = new Date("2023-10-14T12:01:00");
        vi.setSystemTime(currentDate);

        const result = isEventInProgress(eventDate);

        expect(result).toBe(true);
    });

    it("returns false when current time is before eventDate", () => {
        const eventDate = new Date("2023-10-14T12:00:00").getTime();
        // 1 minute before
        const currentDate = new Date("2023-10-14T11:59:00");
        vi.setSystemTime(currentDate);

        const result = isEventInProgress(eventDate);

        expect(result).toBe(false);
    });

    it("returns true when current time is exactly at eventDate", () => {
        const eventDate = new Date("2023-10-14T12:00:00").getTime();
        const currentDate = new Date("2023-10-14T12:00:00");
        vi.setSystemTime(currentDate);

        const result = isEventInProgress(eventDate);

        expect(result).toBe(true);
    });
});
