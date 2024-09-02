import { isValidEuropeanPhoneNumber, parseAspectRatio } from "./utils";
import { describe, expect, it } from "vitest";

describe("helpers/utils", () => {
    describe("isValidEuropeanPhoneNumber()", () => {
        it("returns true if the number is valid", () => {
            expect(isValidEuropeanPhoneNumber("004367761281686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("+4367761281686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("+43/677-612-81-686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("067761281686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("0677-612-81-686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("0677/612/81/686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("0677 612 81 686")).toBe(true);
            expect(isValidEuropeanPhoneNumber("+387 65 712 889")).toBe(true);
            expect(isValidEuropeanPhoneNumber("0038765712889")).toBe(true);
        });

        it("returns false if the number is invalid", () => {
            expect(isValidEuropeanPhoneNumber("")).toBe(false);
            expect(isValidEuropeanPhoneNumber("+")).toBe(false);
            expect(isValidEuropeanPhoneNumber(String(void 0))).toBe(false);
            expect(isValidEuropeanPhoneNumber("mail@test.com")).toBe(false);
            expect(isValidEuropeanPhoneNumber("abv")).toBe(false);
            expect(isValidEuropeanPhoneNumber("123")).toBe(false);
            expect(isValidEuropeanPhoneNumber(void 0)).toBe(false);
            expect(isValidEuropeanPhoneNumber(null)).toBe(false);
        });

        it("returns false for empty input", () => {
            expect(isValidEuropeanPhoneNumber("")).toBe(false);
            expect(isValidEuropeanPhoneNumber(null)).toBe(false);
            expect(isValidEuropeanPhoneNumber(undefined)).toBe(false);
        });

        it("returns true for valid European phone numbers with country code", () => {
            expect(isValidEuropeanPhoneNumber("+441234567890")).toBe(true); // UK number
            expect(isValidEuropeanPhoneNumber("+33123456789")).toBe(true); // France number
            expect(isValidEuropeanPhoneNumber("00341234567890")).toBe(true); // Spain number with 00 prefix
        });

        it("returns true for valid European phone numbers without country code", () => {
            expect(isValidEuropeanPhoneNumber("0123456789")).toBe(true); // Local number
            expect(isValidEuropeanPhoneNumber("123 456 7890")).toBe(true); // Local number with spaces
            expect(isValidEuropeanPhoneNumber("123-456-7890")).toBe(true); // Local number with dashes
            expect(isValidEuropeanPhoneNumber("123.456.7890")).toBe(true); // Local number with dots
        });

        it("returns false for phone numbers with less than 6 digits", () => {
            expect(isValidEuropeanPhoneNumber("12345")).toBe(false);
            expect(isValidEuropeanPhoneNumber("+1234")).toBe(false);
            expect(isValidEuropeanPhoneNumber("0044 2")).toBe(false);
        });

        it("returns false for completely invalid numbers", () => {
            expect(isValidEuropeanPhoneNumber("abcdefg")).toBe(false);
            expect(isValidEuropeanPhoneNumber("12-34-abc")).toBe(false);
            expect(isValidEuropeanPhoneNumber("++44 1234 56789")).toBe(false);
        });

        it("handles numbers with various formats and separators", () => {
            expect(isValidEuropeanPhoneNumber("+44 1234 567890")).toBe(true); // With spaces
            expect(isValidEuropeanPhoneNumber("0044-1234-567890")).toBe(true); // With dashes
            expect(isValidEuropeanPhoneNumber("+44.1234.567890")).toBe(true); // With dots
        });
    });

    describe("parseAspectRatio()", () => {
        it('parses a valid aspect ratio string with colon (":")', () => {
            expect(parseAspectRatio("16:9")).toBeCloseTo(16 / 9);
            expect(parseAspectRatio("4:3")).toBeCloseTo(4 / 3);
            expect(parseAspectRatio("1:1")).toBeCloseTo(1);
        });

        it("returns a number if a single number is provided", () => {
            expect(parseAspectRatio("1.78")).toBeCloseTo(1.78);
            expect(parseAspectRatio("0.75")).toBeCloseTo(0.75);
        });

        it("handles cases with extra spaces around the colon", () => {
            expect(parseAspectRatio(" 16 : 9 ")).toBeCloseTo(16 / 9);
            expect(parseAspectRatio(" 4 : 3")).toBeCloseTo(4 / 3);
        });

        it("returns NaN if the input is not a valid number", () => {
            expect(parseAspectRatio("foo")).toBeNaN();
            expect(parseAspectRatio("16:bar")).toBeNaN();
            expect(parseAspectRatio("foo:9")).toBeNaN();
        });

        it("handles edge cases with empty strings", () => {
            expect(parseAspectRatio("")).toBeNaN();
            expect(parseAspectRatio(":")).toBeNaN();
            expect(parseAspectRatio("::")).toBeNaN();
        });
    });
});
