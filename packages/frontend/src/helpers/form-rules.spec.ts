import {
    hasNumbers,
    hasSymbols,
    hasUpperCase,
    minLength,
    noEmptyString,
    noNegativeNumber,
    noWhiteSpaces,
    optionalNumberInRange,
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

    describe("noNegativeNumber", () => {
        it("returns true for numbers greater than or equal to 0", () => {
            const validator = noNegativeNumber("Number must be greater than or equal to 0!");
            expect(validator(0)).toBe(true);
            expect(validator(10)).toBe(true);
            expect(validator(0.5)).toBe(true);
        });

        it("returns true for numeric strings greater than or equal to 0", () => {
            const validator = noNegativeNumber("Number must be greater than or equal to 0!");
            expect(validator("5")).toBe(true);
            expect(validator("0")).toBe(true);
            expect(validator("123.45")).toBe(true);
            expect(validator("  7  ")).toBe(true);
        });

        it("returns default error message for negative numbers", () => {
            const validator = noNegativeNumber("Number must be greater than or equal to 0!");
            const defaultMessage = "Number must be greater than or equal to 0!";
            expect(validator(-1)).toBe(defaultMessage);
            expect(validator(-0.01)).toBe(defaultMessage);
            expect(validator("-5")).toBe(defaultMessage);
        });

        it("returns custom error message for negative numbers", () => {
            const customMessage = "Please enter a positive number.";
            const validator = noNegativeNumber(customMessage);
            expect(validator(-3)).toBe(customMessage);
            expect(validator("-10")).toBe(customMessage);
        });

        it("returns default error message for non-numeric values", () => {
            const validator = noNegativeNumber("Number must be greater than or equal to 0!");
            const defaultMessage = "Number must be greater than or equal to 0!";
            expect(validator("abc")).toBe(defaultMessage);
            expect(validator(undefined)).toBe(defaultMessage);
            expect(validator({})).toBe(defaultMessage);
            expect(validator([])).toBe(defaultMessage);
            expect(validator(null)).toBe(defaultMessage);
            expect(validator("")).toBe(defaultMessage);
            expect(validator("   ")).toBe(defaultMessage);
        });

        it("returns custom error message for non-numeric invalid values", () => {
            const customMessage = "Invalid number provided.";
            const validator = noNegativeNumber(customMessage);
            expect(validator("abc")).toBe(customMessage);
            expect(validator(undefined)).toBe(customMessage);
            expect(validator({})).toBe(customMessage);
            expect(validator([])).toBe(customMessage);
            expect(validator(null)).toBe(customMessage);
            expect(validator("   ")).toBe(customMessage);
        });
    });

    describe("optionalNumberInRange", () => {
        const errorMessage = "If provided, number must be between 1 and 10";
        const validator = optionalNumberInRange(1, 10, errorMessage);

        describe("valid inputs", () => {
            it("returns true for numbers within range", () => {
                expect(validator(5)).toBe(true);
                expect(validator(1)).toBe(true);
                expect(validator(10)).toBe(true);
            });

            it("returns true for string numbers within range", () => {
                expect(validator("3")).toBe(true);
                expect(validator("7")).toBe(true);
            });

            it("returns true for optional empty values", () => {
                expect(validator(undefined)).toBe(true);
                expect(validator(null)).toBe(true);
                expect(validator("")).toBe(true);
            });
        });

        describe("invalid inputs", () => {
            it("returns error message for numbers below range", () => {
                expect(validator(0)).toBe(errorMessage);
                expect(validator(-1)).toBe(errorMessage);
            });

            it("returns error message for numbers above range", () => {
                expect(validator(11)).toBe(errorMessage);
                expect(validator(100)).toBe(errorMessage);
            });

            it("returns error message for non-numeric strings", () => {
                expect(validator("abc")).toBe(errorMessage);
                expect(validator("   ")).toBe(errorMessage);
            });

            it("returns error message for invalid types", () => {
                expect(validator({})).toBe(errorMessage);
                expect(validator([])).toBe(errorMessage);
            });
        });
    });
});
