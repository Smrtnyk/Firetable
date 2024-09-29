import {
    hasNumbers,
    hasSymbols,
    hasUpperCase,
    minLength,
    noEmptyString,
    noWhiteSpaces,
} from "./form-rules";
import { describe, it, expect } from "vitest";

describe("form-rules.ts", () => {
    describe("noEmptyString", () => {
        it("returns true for non-empty strings", () => {
            const validator = noEmptyString();
            expect(validator("Hello")).toBe(true);
        });

        it("returns error message for empty strings", () => {
            const message = "This field cannot be empty.";
            const validator = noEmptyString(message);
            expect(validator("")).toBe(message);
        });
    });

    describe("minLength", () => {
        it("returns true if string meets minimum length", () => {
            const validator = minLength("Too short.", 5);
            expect(validator("Hello")).toBe(true);
        });

        it("returns error message if string is too short", () => {
            const message = "Minimum 5 characters required.";
            const validator = minLength(message, 5);
            expect(validator("Hey")).toBe(message);
        });
    });

    describe("noWhiteSpaces", () => {
        it("returns true if no whitespaces are present", () => {
            expect(noWhiteSpaces("NoSpaces")).toBe(true);
        });

        it("returns error message if whitespaces are present", () => {
            const message = "No whitespaces are allowed!";
            expect(noWhiteSpaces("With Spaces")).toBe(message);
        });
    });

    describe("hasUpperCase", () => {
        it("returns true if string has uppercase letters", () => {
            const validator = hasUpperCase("");
            expect(validator("Password")).toBe(true);
        });

        it("returns error message if no uppercase letters", () => {
            const message = "At least one uppercase letter required.";
            const validator = hasUpperCase(message);
            expect(validator("password")).toBe(message);
        });
    });

    describe("hasNumbers", () => {
        it("returns true if string has numbers", () => {
            const validator = hasNumbers("");
            expect(validator("Password1")).toBe(true);
        });

        it("returns error message if no numbers", () => {
            const message = "At least one number required.";
            const validator = hasNumbers(message);
            expect(validator("Password")).toBe(message);
        });
    });

    describe("hasSymbols", () => {
        it("returns true if string has symbols", () => {
            const validator = hasSymbols("");
            expect(validator("Password!")).toBe(true);
        });

        it("returns error message if no symbols", () => {
            const message = "At least one special character required.";
            const validator = hasSymbols(message);
            expect(validator("Password")).toBe(message);
        });
    });
});
