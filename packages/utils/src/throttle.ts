export function throttle<T extends any[]>(
    func: (...args: T) => void,
    limit: number,
): (...args: T) => void {
    let inThrottle: boolean;
    let lastFunc: number;
    let lastRan: number;
    return function (...args: T) {
        if (inThrottle) {
            clearTimeout(lastFunc);
            lastFunc = window.setTimeout(
                function () {
                    if (Date.now() - lastRan >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                },
                limit - (Date.now() - lastRan),
            );
        } else {
            func(...args);
            lastRan = Date.now();
            inThrottle = true;
        }
    };
}
