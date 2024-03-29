import type { FloorDoc } from "@firetable/types";
import { gzip, ungzip } from "pako";

export async function decompressFloorDoc(floorDoc: FloorDoc): Promise<FloorDoc> {
    const start = performance.now();
    if (!floorDoc.compressed || typeof floorDoc.json === "object") {
        return floorDoc;
    }

    const byteCharacters = atob(floorDoc.json);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    floorDoc.json = new TextDecoder().decode(ungzip(byteNumbers));

    console.log(performance.now() - start);
    return floorDoc;
}

export async function compressFloorDoc(json: string): Promise<string> {
    const start = performance.now();
    const res = btoa(String.fromCharCode(...gzip(json)));
    console.log(performance.now() - start);

    return res;
}
