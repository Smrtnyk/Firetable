import { throttle } from "./throttle.js";
import { afterAll, describe, expect, vi, it } from "vitest";

describe("throttle", () => {
    vi.useFakeTimers();

    it("calls the function immediately on first invocation", () => {
        const mockFn = vi.fn();
        const throttledFunc = throttle(mockFn, 1000);

        throttledFunc();
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("ignores calls during the throttle period", () => {
        const mockFn = vi.fn();
        const throttledFunc = throttle(mockFn, 1000);

        throttledFunc();
        vi.advanceTimersByTime(500); // half-way through the throttle period
        throttledFunc();
        vi.advanceTimersByTime(499); // just before the throttle period ends
        throttledFunc();

        expect(mockFn).toHaveBeenCalledTimes(1); // Still should only have been called once
    });

    it("calls the function again after the throttle period", () => {
        const mockFn = vi.fn();
        const throttledFunc = throttle(mockFn, 1000);

        throttledFunc();
        vi.advanceTimersByTime(1000); // Move past the throttle period
        throttledFunc(); // Should be able to call it again

        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    // Clean up
    afterAll(() => {
        vi.useRealTimers();
    });
});
