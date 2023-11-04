export function* range(start: number, end: number, step = 1): Iterable<number> {
    if (step === 0) {
        throw new Error("Step cannot be zero.");
    }

    const direction = Math.sign(end - start);
    // Returns true if the loop should continue, based on the current value of i and the desired end value.
    const shouldLoopContinue = (i: number, endVal: number, dir: number): boolean => {
        if (dir === 1) {
            // Positive direction (i.e., end is greater than start).
            return i < endVal;
        } else {
            // Negative direction (i.e., end is less than start).
            return i > endVal;
        }
    };

    let i = start;
    while (shouldLoopContinue(i, end, direction)) {
        yield i;
        i += step;
    }
}
