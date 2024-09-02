export function truncateText(input: string, limit: number): string {
    if (input.length <= limit) {
        return input;
    }
    return `${input.slice(0, Math.max(0, limit))}...`;
}
