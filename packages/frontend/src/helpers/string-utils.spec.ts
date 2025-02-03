import { describe, expect, it } from "vitest";

import { truncateText } from "./string-utils.js";

describe("string-utils", () => {
    describe("truncateText", () => {
        it("returns the input if its length is less than or equal to the limit", () => {
            const input = "Hello";
            const limit = 10;
            const result = truncateText(input, limit);
            expect(result).toBe(input);
        });

        it("returns the input if its length is exactly equal to the limit", () => {
            const input = "Hello";
            const limit = 5;
            const result = truncateText(input, limit);
            expect(result).toBe(input);
        });

        it('truncates the input and append "..." if its length exceeds the limit', () => {
            const input = "Hello, World!";
            const limit = 5;
            const result = truncateText(input, limit);
            expect(result).toBe("Hello...");
        });

        it("handles an empty input string", () => {
            const input = "";
            const limit = 5;
            const result = truncateText(input, limit);
            expect(result).toBe("");
        });

        it("handles a limit of 0", () => {
            const input = "Hello";
            const limit = 0;
            const result = truncateText(input, limit);
            expect(result).toBe("...");
        });

        it("handles a limit greater than the input length", () => {
            const input = "Hello";
            const limit = 10;
            const result = truncateText(input, limit);
            expect(result).toBe(input);
        });

        it("handles special characters in the input", () => {
            const input = "Hello, 🌍!";
            const limit = 7;
            const result = truncateText(input, limit);
            expect(result).toBe("Hello, ...");
        });

        it("handles a single character limit", () => {
            const input = "Hello";
            const limit = 1;
            const result = truncateText(input, limit);
            expect(result).toBe("H...");
        });
    });
});
