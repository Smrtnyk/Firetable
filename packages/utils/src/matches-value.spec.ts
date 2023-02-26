import { describe, expect, it } from "@jest/globals";
import { matchesValue } from "./matches-value";

describe("matchesValue", () => {
    it("returns a function that returns true when given the same value", () => {
        const value = 42;
        const matcher = matchesValue(value);

        expect(matcher(value)).toBe(true);
    });

    it("returns a function that returns false when given a different value", () => {
        const value = "foo";
        const matcher = matchesValue(value);

        expect(matcher("bar")).toBe(false);
    });

    it("returns a function that returns false when given a value of a different type", () => {
        const value = true;
        const matcher = matchesValue(value);

        expect(matcher(1)).toBe(false);
        expect(matcher("true")).toBe(false);
    });
});
