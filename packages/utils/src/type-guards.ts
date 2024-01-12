export function isNumber(candidate: unknown): candidate is number {
    return !Number.isNaN(candidate) && typeof candidate === "number" && Number.isFinite(candidate);
}

export function isString(candidate: unknown): candidate is string {
    return typeof candidate === "string";
}

export function isDefined<T>(candidate: T | undefined | null): candidate is T {
    return candidate !== undefined && candidate !== null;
}

export function isFunction(candidate: unknown): candidate is Function {
    return typeof candidate === "function";
}
