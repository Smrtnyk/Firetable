import { not } from "./not.js";
import { describe, expect, it } from "vitest";

describe("not", () => {
    it("returns a function that negates the result of the input function", () => {
        const isEven = (n: number): boolean => n % 2 === 0;
        const isOdd = not(isEven);

        expect(isOdd(3)).toBe(true);
        expect(isOdd(4)).toBe(false);
    });

    it("works with functions that take multiple arguments", () => {
        const isGreaterThan = (a: number, b: number): boolean => a > b;
        const isNotGreaterThan = not(isGreaterThan);

        expect(isNotGreaterThan(3, 2)).toBe(false);
        expect(isNotGreaterThan(2, 3)).toBe(true);
    });

    it("does not modify the input function", () => {
        const fn = (x: string): boolean => x === "foo";
        const negatedFn = not(fn);

        expect(fn("foo")).toBe(true);
        expect(negatedFn("foo")).toBe(false);
        expect(fn("bar")).toBe(false);
        expect(negatedFn("bar")).toBe(true);
    });
});
