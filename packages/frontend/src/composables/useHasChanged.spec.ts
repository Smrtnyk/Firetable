import { describe, expect, it } from "vitest";
import { computed, reactive, ref } from "vue";

import { useHasChanged } from "./useHasChanged";

describe("useHasChanged", () => {
    it("returns false initially when values are equal", () => {
        const source = ref({ name: "test" });
        const { hasChanged } = useHasChanged(source);
        expect(hasChanged.value).toBe(false);
    });

    it("detects changes in primitive values", () => {
        const source = ref({ count: 1 });
        const { hasChanged } = useHasChanged(source);

        source.value.count = 2;
        expect(hasChanged.value).toBe(true);
    });

    it("detects changes in nested objects", () => {
        const source = reactive({ user: { age: 30, name: "John" } });
        const { hasChanged } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);
        source.user.age = 31;
        expect(hasChanged.value).toBe(true);
    });

    it("detects changes in deeply nested objects", () => {
        const source = reactive({
            level1: {
                level2: {
                    level3: {
                        value: "initial",
                    },
                },
            },
        });
        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        // Modify a deeply nested value
        source.level1.level2.level3.value = "changed";
        expect(hasChanged.value).toBe(true);

        reset();
        expect(hasChanged.value).toBe(false);
    });

    it("handles objects with circular references", () => {
        const source = reactive<Record<PropertyKey, unknown>>({ name: "Circular" });
        source.self = source;

        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        source.name = "Changed";
        expect(hasChanged.value).toBe(true);

        reset();
        expect(hasChanged.value).toBe(false);
    });

    it("handles arrays correctly", () => {
        const source = ref({ items: [1, 2, 3] });
        const { hasChanged } = useHasChanged(source);

        source.value.items.push(4);
        expect(hasChanged.value).toBe(true);
    });

    it("resets state correctly", () => {
        const source = ref({ count: 1 });
        const { hasChanged, reset } = useHasChanged(source);

        source.value.count = 2;
        expect(hasChanged.value).toBe(true);

        reset();
        expect(hasChanged.value).toBe(false);

        source.value.count = 3;
        expect(hasChanged.value).toBe(true);
    });

    it("handles null and undefined values", () => {
        const source = ref<Record<PropertyKey, unknown>>({ value: null });
        const { hasChanged } = useHasChanged(source);

        source.value.value = undefined;
        expect(hasChanged.value).toBe(true);

        source.value.value = null;
        expect(hasChanged.value).toBe(false);
    });

    it("compares values not references", () => {
        const source = reactive({ user: { name: "John" } });
        const { hasChanged } = useHasChanged(source);

        source.user = { name: "John" };
        expect(hasChanged.value).toBe(false);
    });

    it("works with computed values", () => {
        const baseValue = ref({ count: 1 });
        const source = computed(() => ({
            doubled: baseValue.value.count * 2,
        }));
        const { hasChanged } = useHasChanged(source);

        baseValue.value.count = 2;
        expect(hasChanged.value).toBe(true);
    });

    it("handles objects with Date and RegExp types correctly", () => {
        const source = ref({
            date: new Date("2023-01-01"),
            regex: /test/i,
        });
        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        source.value.date = new Date("2024-01-01");
        expect(hasChanged.value).toBe(true);

        reset();
        expect(hasChanged.value).toBe(false);

        source.value.regex = /changed/i;
        expect(hasChanged.value).toBe(true);
    });

    it("handles objects with Symbol properties correctly", () => {
        const sym = Symbol("unique");
        const source = ref<Record<PropertyKey, unknown>>({
            regularProp: "value",
            [sym]: "symbolValue",
        });
        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        source.value[sym] = "newSymbolValue";
        expect(hasChanged.value).toBe(true);

        reset();
        expect(hasChanged.value).toBe(false);

        const newSym = Symbol("another");
        source.value[newSym] = "anotherValue";
        expect(hasChanged.value).toBe(true);
    });

    it("handles Map and Set objects correctly", () => {
        const source = ref({
            map: new Map([["key1", "value1"]]),
            set: new Set([1, 2, 3]),
        });
        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        // Modify Map
        source.value.map.set("key2", "value2");
        expect(hasChanged.value).toBe(true);

        // Reset and modify Set
        reset();
        expect(hasChanged.value).toBe(false);

        source.value.set.add(4);
        expect(hasChanged.value).toBe(true);
    });

    it("handles proxied objects correctly", () => {
        const base = { details: { age: 25 }, name: "ProxyTest" };
        const source = reactive(base);
        const proxiedSource = new Proxy(source, {
            get(target, prop, receiver) {
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                return Reflect.set(target, prop, value, receiver);
            },
        });

        const { hasChanged } = useHasChanged(proxiedSource);

        expect(hasChanged.value).toBe(false);

        proxiedSource.details.age = 26;
        expect(hasChanged.value).toBe(true);
    });

    it("handles large objects efficiently", () => {
        const largeObject: Record<PropertyKey, unknown> = {};
        for (let i = 0; i < 1000; i++) {
            largeObject[`key${i}`] = `value${i}`;
        }
        const source = ref(largeObject);
        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        source.value.key999 = "newValue999";
        expect(hasChanged.value).toBe(true);

        reset();
        expect(hasChanged.value).toBe(false);
    });

    it("handles immutable data structures correctly", () => {
        const source = ref({ count: 1 });
        const { hasChanged } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        // Replace the entire object
        source.value = { count: 1 };
        // No actual change
        expect(hasChanged.value).toBe(false);

        // Change the value
        source.value = { count: 2 };
        expect(hasChanged.value).toBe(true);
    });

    it("detects changes in computed properties with dependencies", () => {
        const base = ref({ count: 1, multiplier: 2 });
        const source = computed(() => ({
            result: base.value.count * base.value.multiplier,
        }));
        const { hasChanged, reset } = useHasChanged(source);

        expect(hasChanged.value).toBe(false);

        // Change a dependency
        base.value.count = 3;
        expect(hasChanged.value).toBe(true);

        // Reset and change another dependency
        reset();
        expect(hasChanged.value).toBe(false);

        base.value.multiplier = 4;
        expect(hasChanged.value).toBe(true);
    });
});
