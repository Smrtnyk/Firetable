import { db } from "./init.js";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { createHash } from "node:crypto";

const gzipAsync = promisify(gzip);

export async function compressJson(jsonString: string): Promise<string> {
    const compressed = await gzipAsync(Buffer.from(jsonString));
    return compressed.toString("base64");
}

export function generateFirestoreId(): string {
    return db.collection("temp").doc().id;
}

export function hashPhoneNumber(phoneNumber: string): string {
    return createHash("sha256").update(phoneNumber).digest("hex");
}
