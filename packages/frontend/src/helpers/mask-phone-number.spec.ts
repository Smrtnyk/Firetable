import { maskPhoneNumber } from "./mask-phone-number";
import { describe, it, expect } from "vitest";

describe("maskPhoneNumber (European Numbers)", () => {
    it("masks a UK phone number correctly", () => {
        const input = "+44 20 7946 0958";
        const expected = "+44XXXXXX0958";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a German phone number correctly", () => {
        const input = "+49 30 901820";
        const expected = "+49XXXX1820";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a French phone number correctly", () => {
        const input = "+33 1 42 68 53 00";
        const expected = "+33XXXXX5300";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Spanish phone number correctly", () => {
        const input = "+34 91 123 4567";
        const expected = "+34XXXXX4567";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks an Italian phone number correctly", () => {
        const input = "+39 06 6982";
        const expected = "+39XX6982";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Dutch phone number correctly", () => {
        const input = "+31 20 794 0958";
        const expected = "+31XXXXX0958";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Swedish phone number correctly", () => {
        const input = "+46 8 123 456 78";
        const expected = "+46XXXXX5678";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Norwegian phone number correctly", () => {
        const input = "+47 21 22 33 44";
        const expected = "+47XXXX3344";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Danish phone number correctly", () => {
        const input = "+45 32 22 33 44";
        const expected = "+45XXXX3344";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Swiss phone number correctly", () => {
        const input = "+41 44 668 1800";
        const expected = "+41XXXXX1800";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a UK phone number with dots correctly", () => {
        const input = "+44.20.7946.0958";
        const expected = "+44XXXXXX0958";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a German phone number with parentheses correctly", () => {
        const input = "+49 (30) 901820";
        const expected = "+49XXXX1820";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("masks a Spanish phone number without spaces correctly", () => {
        const input = "+34911234567";
        const expected = "+34XXXXX4567";
        expect(maskPhoneNumber(input)).toBe(expected);
    });

    it("throws an error for a European number without country code", () => {
        // UK number without +44
        const input = "020 7946 0958";
        expect(() => maskPhoneNumber(input)).toThrow("Invalid phone number");
    });
});
