import type { DeepPartial } from "@firetable/types";
import { isDefined } from "./type-guards.js";

function isObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof value !== "function"
    );
}

export function deepMerge<T extends Record<string, unknown>>(
    defaultObject: T,
    partialObject: DeepPartial<T>,
): T {
    const result: any = {};

    // Merge properties from the default object
    for (const key of Object.keys(defaultObject)) {
        const value = defaultObject[key];
        const partialValue = partialObject[key];
        result[key] =
            isObject(value) && isObject(partialValue)
                ? deepMerge(value, partialValue)
                : partialValue ?? value;
    }

    // Add new properties from the partial object that are not in the default object
    for (const key of Object.keys(partialObject)) {
        if (!isDefined(defaultObject[key])) {
            result[key] = partialObject[key];
        }
    }

    return result;
}
