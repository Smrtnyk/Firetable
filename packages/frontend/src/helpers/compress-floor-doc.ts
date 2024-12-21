import type { FloorDoc } from "@firetable/types";
import { gzipSync, gunzipSync } from "fflate";
import { DevLogger } from "src/logger/DevFTLogger.js";

export function decompressFloorDoc(floorDoc: FloorDoc): FloorDoc {
    if (!floorDoc.json) {
        return floorDoc;
    }

    const start = performance.now();
    const byteCharacters = atob(floorDoc.json);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    floorDoc.json = new TextDecoder().decode(gunzipSync(byteNumbers));

    DevLogger.logPerformance("floor decompression", performance.now() - start);
    return floorDoc;
}

export function compressFloorDoc(json: string): string {
    const start: number = performance.now();

    const textEncoder = new TextEncoder();
    const uint8Array: Uint8Array = textEncoder.encode(json);
    const compressed: Uint8Array = gzipSync(uint8Array);
    const numbersArray: number[] = Array.from(compressed);
    const res: string = btoa(String.fromCharCode.apply(null, numbersArray));

    DevLogger.logPerformance("floor compression", performance.now() - start);
    return res;
}
