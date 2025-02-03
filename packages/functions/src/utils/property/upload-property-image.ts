import type { ImageUploadData } from "@shared-types/property.js";

import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/https";

import { storage } from "../../init.js";

export async function uploadPropertyImage(
    organisationId: string,
    propertyId: string,
    img: ImageUploadData,
): Promise<string> {
    const supportedTypes = ["image/png", "image/svg+xml"];
    if (!supportedTypes.includes(img.type)) {
        throw new HttpsError(
            "invalid-argument",
            `Unsupported image format (${img.type}). Please upload a PNG or SVG image.`,
        );
    }

    try {
        const bucket = storage.bucket();
        const extension = img.type === "image/svg+xml" ? "svg" : "png";
        const filePath = `organisations/${organisationId}/properties/${propertyId}/logo.${extension}`;

        const matches = /^data:image\/(png|svg\+xml);base64,(.+)$/.exec(img.dataUrl);

        if (!matches?.[2]) {
            throw new HttpsError(
                "invalid-argument",
                "Invalid image data format. Make sure you're providing a valid base64-encoded PNG or SVG image.",
            );
        }

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        const file = bucket.file(filePath);
        await file.save(buffer, {
            metadata: {
                contentType: img.type,
            },
            public: true,
            validation: "md5",
        });

        await file.makePublic();
        return file.publicUrl();
    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        logger.error("Unexpected error uploading property image:", error);
        throw new HttpsError("internal", "An unexpected error occurred while uploading the image.");
    }
}
