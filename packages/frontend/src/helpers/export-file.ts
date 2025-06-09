export function exportFile(
    data: BlobPart,
    fileName: string,
    mimeType = "application/octet-stream",
): void {
    const blob = new Blob([data], { type: mimeType });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    globalThis.URL.revokeObjectURL(url);
}
