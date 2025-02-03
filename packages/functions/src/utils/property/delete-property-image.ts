import { logger } from "firebase-functions";

import { storage } from "../../init.js";

export async function deletePropertyImage(
    organisationId: string,
    propertyId: string,
    oldImgUrl: string | undefined,
): Promise<void> {
    if (!oldImgUrl) {
        return;
    }

    if (
        storage.app.options.storageBucket &&
        !oldImgUrl.includes(storage.app.options.storageBucket)
    ) {
        logger.warn("Image to delete is external and not part of storage bucket:", oldImgUrl);
        return;
    }
    const oldImgExtension = oldImgUrl.split(".").pop();
    const filePath = `organisations/${organisationId}/properties/${propertyId}/logo.${oldImgExtension}`;

    try {
        const file = storage.bucket().file(filePath);
        await file.delete();
    } catch (error) {
        logger.warn("Failed to delete property image:", error);
    }
}
