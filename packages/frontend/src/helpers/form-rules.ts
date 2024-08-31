import { isNil } from "es-toolkit/predicate";

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
