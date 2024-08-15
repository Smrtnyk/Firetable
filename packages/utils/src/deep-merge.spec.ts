import type { DeepPartial } from "@firetable/types";
import { deepMerge } from "./deep-merge.js";
import { describe, expect, it, vi } from "vitest";

describe("deepMerge", () => {
    const DEFAULT_SETTINGS = {
        event: {
            startTime: "10:00",
            duration: 2,
            details: {
                location: "Office",
                online: false,
            },
        },
        participants: 10,
    };

    it("should return default object when merged with empty object", () => {
        const partial = {};
        const result = deepMerge(DEFAULT_SETTINGS, partial);
        expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it("should override default values with values from partial object", () => {
        const partial: DeepPartial<typeof DEFAULT_SETTINGS> = {
            event: {
                startTime: "11:00",
            },
        };
        const expectedResult = {
            ...DEFAULT_SETTINGS,
            event: { ...DEFAULT_SETTINGS.event, startTime: "11:00" },
        };
        const result = deepMerge(DEFAULT_SETTINGS, partial);
        expect(result).toEqual(expectedResult);
    });

    it("should correctly merge nested objects", () => {
        const partial = {
            event: {
                details: {
                    online: true,
                },
            },
        };
        const expectedResult = {
            ...DEFAULT_SETTINGS,
            event: {
                ...DEFAULT_SETTINGS.event,
                details: { ...DEFAULT_SETTINGS.event.details, online: true },
            },
        };
        const result = deepMerge(DEFAULT_SETTINGS, partial);
        expect(result).toEqual(expectedResult);
    });

    it("should not merge arrays and functions", () => {
        const myFunction = vi.fn();
        const partial = {
            event: {
                details: {
                    newProperty: "New",
                },
            },
            participants: 1,
            newFunction: myFunction,
        };
        const expectedResult = {
            ...DEFAULT_SETTINGS,
            event: {
                ...DEFAULT_SETTINGS.event,
                details: { ...DEFAULT_SETTINGS.event.details, newProperty: "New" },
            },
            participants: 1,
            newFunction: myFunction,
        };
        // @ts-expect-error -- partial is whatever we want in tests
        const result = deepMerge(DEFAULT_SETTINGS, partial);
        expect(result).toEqual(expectedResult);
    });
});
