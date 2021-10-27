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

export function requireNumber(
    msg = "You must type in a number!"
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        return !isNaN(Number(val)) || msg;
    };
}

export function greaterThanZero(
    msg = "Number must be greater than 0!"
): (val: unknown) => boolean | string {
    return function (val: unknown): boolean | string {
        return (!isNaN(Number(val)) && Number(val) > 0) || msg;
    };
}
