import { memoize } from "./memoize.js";
import { it, describe, vi, expect } from "vitest";

describe("memoize", () => {
    it("caches function results based on arguments", () => {
        const mockFn = vi.fn((a: number, b: number) => a + b);
        const memoizedFn = memoize(mockFn);
        expect(memoizedFn(1, 2)).toBe(3);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(memoizedFn(1, 2)).toBe(3);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(memoizedFn(2, 3)).toBe(5);
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(memoizedFn(1, 2)).toBe(3);
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(memoizedFn(2, 3)).toBe(5);
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("does not cache results when arguments are different", () => {
        const mockFn = vi.fn((a: number, b: number) => a + b);
        const memoizedFn = memoize(mockFn);
        expect(memoizedFn(1, 2)).toBe(3);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(memoizedFn(1, 3)).toBe(4);
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(memoizedFn(1, 2)).toBe(3);
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(memoizedFn(1, 3)).toBe(4);
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("returns cached result when called with no arguments", () => {
        const mockFn = vi.fn(() => Math.random());
        const memoizedFn = memoize(mockFn);
        const result1 = memoizedFn();
        const result2 = memoizedFn();
        expect(result2).toBe(result1);
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});
