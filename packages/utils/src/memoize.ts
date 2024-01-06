export function memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map<string, ReturnType<T>>();
    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know it's there
            return cache.get(key)!;
        }
        const result = func(...args);
        cache.set(key, result);
        return result;
    }) as T;
}
