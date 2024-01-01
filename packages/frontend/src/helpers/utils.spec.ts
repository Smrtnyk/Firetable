import { isValidEuropeanPhoneNumber } from "./utils";
import { describe, expect, it } from "vitest";

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
});
