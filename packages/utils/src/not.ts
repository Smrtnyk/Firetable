export function not<A extends any[]>(fn: (...args: A) => boolean): (...args: A) => boolean {
    return function (...args: A): boolean {
        return !fn(...args);
    };
}
