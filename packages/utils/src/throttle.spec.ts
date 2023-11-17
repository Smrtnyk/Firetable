import { afterAll, describe, expect, jest, test } from "@jest/globals";
import { throttle } from "./throttle";

describe("throttle", () => {
    jest.useFakeTimers();

    test("calls the function immediately on first invocation", () => {
        const mockFn = jest.fn();
        const throttledFunc = throttle(mockFn, 1000);

        throttledFunc();
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test("ignores calls during the throttle period", () => {
        const mockFn = jest.fn();
        const throttledFunc = throttle(mockFn, 1000);

        throttledFunc();
        jest.advanceTimersByTime(500); // half-way through the throttle period
        throttledFunc();
        jest.advanceTimersByTime(499); // just before the throttle period ends
        throttledFunc();

        expect(mockFn).toHaveBeenCalledTimes(1); // Still should only have been called once
    });

    test("calls the function again after the throttle period", () => {
        const mockFn = jest.fn();
        const throttledFunc = throttle(mockFn, 1000);

        throttledFunc();
        jest.advanceTimersByTime(1000); // Move past the throttle period
        throttledFunc(); // Should be able to call it again

        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    // Clean up
    afterAll(() => {
        jest.useRealTimers();
    });
});
