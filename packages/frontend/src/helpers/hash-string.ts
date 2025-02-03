/**
 * Generates a deterministic SHA-256 hash for a given input string using the Web Crypto API.
 * @param str - The input string to hash.
 * @returns A Promise that resolves to a hexadecimal SHA-256 hash string.
 */
export async function hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return bufferToHex(hashBuffer);
}

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 * @param buffer - The ArrayBuffer to convert.
 * @returns A hexadecimal representation of the buffer.
 */
function bufferToHex(buffer: ArrayBuffer): string {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i++) {
        const value = view.getUint8(i).toString(16);
        const paddedValue = value.padStart(2, "0");
        hexCodes.push(paddedValue);
    }
    return hexCodes.join("");
}
