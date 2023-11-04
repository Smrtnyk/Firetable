export function propIsTruthy<T extends Record<any, any>, K extends keyof T>(
    key: K,
    ...args: unknown[]
) {
    return function (obj: T): boolean {
        return !!obj[key];
    };
}
