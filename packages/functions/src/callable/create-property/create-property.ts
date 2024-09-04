import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../init.js";
import { ADMIN } from "../../../types/types.js";
import { getPropertiesPath, getUsersPath } from "../../paths.js";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

interface Data {
    name: string;
    organisationId: string;
}

export async function createPropertyFn(req: CallableRequest<Data>): Promise<string> {
    if (!req.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { organisationId } = req.data;

    if (!organisationId) {
        throw new HttpsError("invalid-argument", "organisationId is missing in property payload");
    }

    // Create a property with data received from the client
    const propertyData = {
        ...req.data,
        // Adding the UID from the authenticated request
        creatorId: req.auth.uid,
    };

    try {
        // Adding the property data to Firestore
        const propertyDocRef = await db
            .collection(getPropertiesPath(organisationId))
            .add(propertyData);
        const propertyId = propertyDocRef.id;

        const userClaims = req.auth.token;

        // If user is not an admin, associate the property with the user
        if (userClaims.role !== ADMIN) {
            const userRef = db.collection(getUsersPath(organisationId)).doc(req.auth.uid);
            await userRef.update({
                relatedProperties: FieldValue.arrayUnion(propertyId),
            });

            // Add the user to relatedUsers of the property
            await propertyDocRef.update({
                relatedUsers: FieldValue.arrayUnion(req.auth.uid),
            });
        }

        return propertyId;
    } catch (error) {
        logger.error("Error adding property:", error);
        throw new HttpsError("internal", "Internal error occurred");
    }
}
