import type { CallableRequest } from "firebase-functions/v2/https";
import type { CreatePropertyPayload } from "@shared-types";
import { uploadPropertyImage } from "../../utils/property/upload-property-image.js";
import { db } from "../../init.js";
import { getPropertiesPath, getUsersPath } from "../../paths.js";
import { AdminRole } from "@shared-types";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

export async function createPropertyFn(
    req: CallableRequest<CreatePropertyPayload>,
): Promise<string> {
    if (!req.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { organisationId, img, ...propertyData } = req.data;

    if (!organisationId) {
        throw new HttpsError("invalid-argument", "organisationId is missing in property payload");
    }

    try {
        // Initial property data without img
        const initialData = {
            ...propertyData,
            organisationId,
            creatorId: req.auth.uid,
        };

        // If img is provided as an object, it's upload data
        if (img && typeof img === "object") {
            // Create property first
            const propertyDocRef = await db
                .collection(getPropertiesPath(organisationId))
                .add(initialData);

            const propertyId = propertyDocRef.id;
            const imgUrl = await uploadPropertyImage(organisationId, propertyId, img);
            await propertyDocRef.update({ img: imgUrl });
            return propertyId;
        }

        // If img is a string, it's a URL - just include it directly
        const propertyDocRef = await db.collection(getPropertiesPath(organisationId)).add({
            ...initialData,
            img,
        });

        const userClaims = req.auth.token;

        // If user is not an admin, associate the property with the user
        if (userClaims.role !== AdminRole.ADMIN) {
            const userRef = db.collection(getUsersPath(organisationId)).doc(req.auth.uid);
            await userRef.update({
                relatedProperties: FieldValue.arrayUnion(propertyDocRef.id),
            });
        }

        return propertyDocRef.id;
    } catch (error) {
        logger.error("Error adding property:", error);
        throw new HttpsError("internal", "Internal error occurred");
    }
}
