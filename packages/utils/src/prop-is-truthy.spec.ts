import { propIsTruthy } from "./prop-is-truthy";
import { describe, expect, it } from "@jest/globals";

describe("propIsTruthy", () => {
    const obj = {
        a: true,
        b: false,
        c: 0,
        d: "",
        e: null,
        f: undefined,
    };

    it("returns true when the property value is truthy", () => {
        expect(propIsTruthy("a")(obj)).toBe(true);
    });

    it("returns false when the property value is falsy", () => {
        expect(propIsTruthy("b")(obj)).toBe(false);
        expect(propIsTruthy("c")(obj)).toBe(false);
        expect(propIsTruthy("d")(obj)).toBe(false);
        expect(propIsTruthy("e")(obj)).toBe(false);
        expect(propIsTruthy("f")(obj)).toBe(false);
    });

    it("returns false when the property is undefined", () => {
        expect(propIsTruthy("g")(obj)).toBe(false);
    });
});
