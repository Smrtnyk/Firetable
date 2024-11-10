import { isNil } from "es-toolkit/predicate";
import { isString } from "es-toolkit";

export function noEmptyString(msg = "Please type something"): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return (val && val.length > 0) || msg;
    };
}

export function minLength(msg: string, minLen = 5): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return (val && val.length >= minLen) || msg;
    };
}

export function optionalMinLength(msg: string, minLen = 5): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        if (isNil(val) || val === "") {
            return true;
        }
        return minLength(msg, minLen)(val);
    };
}

export function noWhiteSpaces(val: string): boolean | string {
    return !/\s/g.test(val) || "No whitespaces are allowed!";
}

export function hasUpperCase(msg: string): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return /[A-Z]/.test(val) || msg;
    };
}

export function hasNumbers(msg: string): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return /\d/.test(val) || msg;
    };
}

export function hasSymbols(msg: string): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return /[!"#$%&()*,.:<>?@^{|}]/.test(val) || msg;
    };
}

export function requireNumber(
    msg = "You must type in a number!",
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        return !Number.isNaN(Number(val)) || msg;
    };
}

export function greaterThanZero(
    msg = "Number must be greater than 0!",
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        return (!Number.isNaN(Number(val)) && Number(val) > 0) || msg;
    };
}

export function noNegativeNumber(msg: string): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        // Check if val is a number or a string that can be converted to a number
        const isNumberType = typeof val === "number";
        const isStringWithNumber = isString(val) && val.trim() !== "" && !Number.isNaN(Number(val));

        if (isNumberType || isStringWithNumber) {
            const num = Number(val);
            if (num >= 0) {
                return true;
            }
        }

        return msg;
    };
}

function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export function validOptionalURL(msg = "Not a valid url"): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        if (val === "") {
            return true;
        }
        return (val && isValidUrl(val)) || msg;
    };
}

export function validEmail(msg = "Invalid email format"): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return /.+@.+\..+/.test(val) || msg;
    };
}
