import { parseAspectRatio } from "./utils";
import { describe, expect, it } from "vitest";

describe("helpers/utils", () => {
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
