export function parseAspectRatio(aspectRatio: string): number {
    const parts = aspectRatio.split(":");
    if (parts.length === 2) {
        return Number.parseFloat(parts[0]) / Number.parseFloat(parts[1]);
    }
    return Number.parseFloat(aspectRatio);
}

export function refreshApp(): void {
    globalThis.location.reload();
}
