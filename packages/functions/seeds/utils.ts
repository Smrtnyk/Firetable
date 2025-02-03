import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";

import { db } from "./init.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export async function compressJson(jsonString: string): Promise<string> {
    const compressed = await gzipAsync(Buffer.from(jsonString));
    return compressed.toString("base64");
}

export async function decompressJson(compressedString: string): Promise<string> {
    const compressed = Buffer.from(compressedString, "base64");
    const decompressed = await gunzipAsync(compressed);
    return decompressed.toString();
}

export function extractTableLabels(floorPlan: string): string[] {
    const floorData = JSON.parse(floorPlan);

    return floorData.objects
        .filter(function (obj: any) {
            return obj.label && (obj.type === "RectTable" || obj.type === "RoundTable");
        })
        .map(function (obj: any) {
            return obj.label;
        });
}

export function generateFirestoreId(): string {
    return db.collection("temp").doc().id;
}

export function hashPhoneNumber(phoneNumber: string): string {
    return createHash("sha256").update(phoneNumber).digest("hex");
}
