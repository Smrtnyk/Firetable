export function isNumber(candidate: unknown): candidate is number {
    return !Number.isNaN(candidate) && typeof candidate === "number" && Number.isFinite(candidate);
}
