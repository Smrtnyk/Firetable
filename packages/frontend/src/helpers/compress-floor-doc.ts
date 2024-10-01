import type { FloorDoc } from "@firetable/types";
import { gzip, ungzip } from "pako";
import { DevLogger } from "src/logger/DevFTLogger.js";

export function decompressFloorDoc(floorDoc: FloorDoc): FloorDoc {
    const start = performance.now();
    const byteCharacters = atob(floorDoc.json);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    floorDoc.json = new TextDecoder().decode(ungzip(byteNumbers));

    DevLogger.logPerformance("floor decompression", performance.now() - start);
    return floorDoc;
}

export function compressFloorDoc(json: string): string {
    const start = performance.now();
    const res = btoa(String.fromCharCode(...gzip(json)));
    DevLogger.logPerformance("floor compression", performance.now() - start);

    return res;
}
