import { isString } from "es-toolkit";
import { isNumber } from "es-toolkit/compat";
import { isNil } from "es-toolkit/predicate";

export function greaterThanZero(
    msg = "Number must be greater than 0!",
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        return (!Number.isNaN(Number(val)) && Number(val) > 0) || msg;
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

export function hasUpperCase(msg: string): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return /[A-Z]/.test(val) || msg;
    };
}

export function minLength(msg: string, minLen = 5): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return (val && val.length >= minLen) || msg;
    };
}

export function noEmptyString(msg = "Please type something"): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        return (val && val.length > 0) || msg;
    };
}

export function noNegativeNumber(msg: string): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        const isNumberType = isNumber(val);
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

export function noWhiteSpaces(val: string): boolean | string {
    return !/\s/g.test(val) || "No whitespaces are allowed!";
}

export function numberInRange(
    min: number,
    max: number,
    msg: string,
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        if (!isNumber(val) && !isString(val)) {
            return msg;
        }
        const num = Number(val);
        if (Number.isNaN(num)) {
            return msg;
        }
        return (num >= min && num <= max) || msg;
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

export function optionalNumberInRange(
    min: number,
    max: number,
    msg: string,
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        if (val === undefined || val === null || val === "") {
            return true;
        }
        return numberInRange(min, max, msg)(val);
    };
}

export function requireNumber(
    msg = "You must type in a number!",
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        return !Number.isNaN(Number(val)) || msg;
    };
}

export function validOptionalURL(msg = "Not a valid url"): (val: string) => boolean | string {
    return function (val: string): boolean | string {
        if (val === "") {
            return true;
        }
        return (val && isValidUrl(val)) || msg;
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
