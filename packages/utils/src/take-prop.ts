export function takeProp<T extends Record<any, any>, K extends keyof T>(
    key: K,
    ...args: unknown[]
) {
    return function (obj: T): T[K] {
        return obj[key];
    };
}
