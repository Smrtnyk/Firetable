import type { CallableRequest } from "firebase-functions/v2/https";
import type { UpdatePropertyPayload } from "@shared-types";
import { uploadPropertyImage } from "../../utils/property/upload-property-image.js";
import { deletePropertyImage } from "../../utils/property/delete-property-image.js";
import { db } from "../../init.js";
import { getPropertiesPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export async function updatePropertyFn(req: CallableRequest<UpdatePropertyPayload>): Promise<void> {
    if (!req.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { id, organisationId, img, ...propertyData } = req.data;

    try {
        const docRef = db.collection(getPropertiesPath(organisationId)).doc(id);
        const propertyDoc = await docRef.get();

        if (!propertyDoc.exists) {
            throw new HttpsError("not-found", "Property not found");
        }

        const oldData = propertyDoc.data();
        const oldImgUrl = oldData?.img;

        // Check if we need to delete the old image
        // This happens when:
        // 1. We had an old storage image
        // 2. AND we're either clearing the image or changing it to something else
        if (oldImgUrl !== img && oldImgUrl) {
            await deletePropertyImage(organisationId, id, oldImgUrl);
        }

        if (typeof img === "object") {
            const imgUrl = await uploadPropertyImage(organisationId, id, img);
            await docRef.update({
                ...propertyData,
                img: imgUrl,
            });
        } else {
            await docRef.update({
                ...propertyData,
                img,
            });
        }
    } catch (error) {
        logger.error("Error updating property:", error);
        throw new HttpsError("internal", "Failed to update property");
    }
}
