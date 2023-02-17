export function propIsTruthy<T extends Record<any, any>, K extends keyof T>(
    key: K,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- needed here
    ...args: unknown[]
) {
    return function (obj: T): boolean {
        return !!obj[key];
    };
}
