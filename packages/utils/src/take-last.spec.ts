import { takeLast } from "./take-last";
import { describe, expect, it } from "@jest/globals";

describe("takeLast", () => {
    it("returns the last element of the array", () => {
        const array = [1, 2, 3, 4];

        expect(takeLast(array)).toBe(4);
    });

    it("returns undefined when the array is empty", () => {
        const array: number[] = [];

        expect(takeLast(array)).toBeUndefined();
    });
});
