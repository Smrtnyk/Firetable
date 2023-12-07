export function takeProp<T extends Record<any, any>, K extends keyof T>(key: K) {
    return function (obj: T): T[K] {
        return obj[key];
    };
}
