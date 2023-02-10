export function isNumber(candidate: unknown): candidate is number {
    return typeof candidate === "number";
}

export function isString(candidate: unknown): candidate is string {
    return typeof candidate === "string";
}

export function isDefined<T>(candidate: T | undefined | null): candidate is T {
    return candidate !== undefined && candidate !== null;
}
