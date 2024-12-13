import type { ImageUploadData } from "@shared-types/property.js";
import { storage } from "../../init.js";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/https";

export async function uploadPropertyImage(
    organisationId: string,
    propertyId: string,
    img: ImageUploadData,
): Promise<string> {
    try {
        const bucket = storage.bucket();
        const extension = img.type === "image/svg+xml" ? "svg" : "png";
        const filePath = `organisations/${organisationId}/properties/${propertyId}/logo.${extension}`;

        const matches = /^data:image\/(png|svg\+xml);base64,(.+)$/.exec(img.dataUrl);

        if (!matches?.[2]) {
            logger.error("Invalid image data format");
            throw new HttpsError("invalid-argument", "Invalid image data format");
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
        logger.error("Error uploading property image:", error);
        throw new HttpsError("internal", "Failed to upload property image");
    }
}
