import type { DeepPartial } from "@firetable/types";
import { isDefined } from "./type-guards";

function isObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof value !== "function"
    );
}

export function deepMerge<T>(defaultObject: T, partialObject: DeepPartial<T>): T {
    const result: any = {};

    // Merge properties from the default object
    for (const key in defaultObject) {
        if (!Object.prototype.hasOwnProperty.call(defaultObject, key)) {
            continue;
        }

        result[key] =
            isObject(defaultObject[key]) &&
            partialObject[key] !== undefined &&
            isObject(partialObject[key])
                ? deepMerge(defaultObject[key], partialObject[key] ?? {})
                : partialObject[key] ?? defaultObject[key];
    }

    // Add new properties from the partial object that are not in the default object
    for (const key in partialObject) {
        if (!isDefined(defaultObject[key])) {
            result[key] = partialObject[key];
        }
    }

    return result;
}
