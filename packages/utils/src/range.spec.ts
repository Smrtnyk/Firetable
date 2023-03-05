import { describe, expect, it } from "@jest/globals";
import { range } from "./range";

describe("range", () => {
    it("should generate a range of numbers from start to end with step 1", () => {
        const result = Array.from(range(0, 5));
        expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it("should generate a range of numbers from start to end with custom step", () => {
        const result = Array.from(range(0, 10, 2));
        expect(result).toEqual([0, 2, 4, 6, 8]);
    });

    it("should generate an empty range if start equals end", () => {
        const result = Array.from(range(5, 5));
        expect(result).toEqual([]);
    });

    it("should generate a range of numbers with negative step", () => {
        const result = Array.from(range(5, 0, -1));
        expect(result).toEqual([5, 4, 3, 2, 1]);
    });
});
