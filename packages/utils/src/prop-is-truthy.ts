export function propIsTruthy<T extends Record<any, any>, K extends keyof T>(key: K) {
    return function (obj: T): boolean {
        return !!obj[key];
    };
}
