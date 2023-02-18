export function matchesValue(value: unknown) {
    return function (anotherValue: unknown) {
        return value === anotherValue;
    };
}
