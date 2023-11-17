export function throttle<T extends any[]>(
    func: (...args: T) => void,
    limit: number,
): (...args: T) => void {
    let lastCall = 0;

    return function (...args: T) {
        const now = Date.now();
        if (now - lastCall < limit) {
            // If the function is called before the limit period has passed,
            // ignore this call
            return;
        }
        // Otherwise, execute the function and update the lastCall time
        lastCall = now;
        func(...args);
    };
}
