export function truncateText(input: string, limit: number): string {
    if (input.length <= limit) {
        return input;
    }
    return `${input.substring(0, limit)}...`;
}
