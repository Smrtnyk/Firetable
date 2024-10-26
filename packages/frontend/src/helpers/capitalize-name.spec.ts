import { expect, describe, it } from "vitest";
import { capitalizeName } from "src/helpers/capitalize-name";

describe("capitalizeName", () => {
    it("returns an empty string when input is empty", () => {
        expect(capitalizeName("")).toBe("");
        expect(capitalizeName("   ")).toBe("");
    });

    it("capitalizes a single lowercase word", () => {
        expect(capitalizeName("milan")).toBe("Milan");
    });

    it("capitalizes a single word with mixed casing", () => {
        expect(capitalizeName("mIlAn")).toBe("Milan");
        expect(capitalizeName("Milan")).toBe("Milan");
    });

    it("capitalizes multiple words", () => {
        expect(capitalizeName("milan keser")).toBe("Milan Keser");
        expect(capitalizeName("milan KEser")).toBe("Milan Keser");
    });

    it("handles multiple spaces between words", () => {
        expect(capitalizeName("milan   keser")).toBe("Milan Keser");
        expect(capitalizeName("  milan keser  ")).toBe("Milan Keser");
    });

    it("capitalizes hyphenated names", () => {
        expect(capitalizeName("anna-maria")).toBe("Anna-Maria");
        expect(capitalizeName("anna-MARIA")).toBe("Anna-Maria");
        expect(capitalizeName("anna-maria smith")).toBe("Anna-Maria Smith");
    });

    it("does not alter already properly capitalized names", () => {
        expect(capitalizeName("Milan Keser")).toBe("Milan Keser");
        expect(capitalizeName("O'Connor")).toBe("O'Connor");
        expect(capitalizeName("Anna-Maria Smith")).toBe("Anna-Maria Smith");
    });

    it("handles names with special characters gracefully", () => {
        // Non-alphabetic characters
        expect(capitalizeName("milan@keser")).toBe("Milan@keser");
        expect(capitalizeName("milan-keser123")).toBe("Milan-Keser123");
    });

    it("handles names with trailing and leading spaces", () => {
        expect(capitalizeName("  milan keser  ")).toBe("Milan Keser");
        expect(capitalizeName("  anna-maria o'connor  ")).toBe("Anna-Maria O'Connor");
    });

    it("returns empty string for undefined or null input", () => {
        expect(capitalizeName(undefined as unknown as string)).toBe("");
        expect(capitalizeName(null as unknown as string)).toBe("");
    });
});
