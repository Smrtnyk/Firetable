import { https } from "firebase-functions";
import { db } from "../../init.js";
import { ADMIN, Collection } from "../../../types/types.js";
import { FieldValue } from "firebase-admin/firestore";
import { CallableRequest } from "firebase-functions/v2/https";

interface Data {
    name: string;
    organisationId: string;
}

export async function createPropertyFn(req: CallableRequest<Data>): Promise<string> {
    // Check for authenticated user
    if (!req.auth) {
        throw new https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { organisationId } = req.data;

    if (!organisationId) {
        throw new https.HttpsError(
            "invalid-argument",
            "organisationId is missing in property payload",
        );
    }

    // Create a property with data received from the client
    const propertyData = {
        ...req.data,
        creatorId: req.auth.uid, // Adding the UID from the authenticated request
    };

    try {
        // Adding the property data to Firestore
        const propertyDocRef = await db
            .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`)
            .add(propertyData);
        const propertyId = propertyDocRef.id;

        const userClaims = req.auth.token;

        // If user is not an admin, associate the property with the user
        if (userClaims.role !== ADMIN) {
            const userRef = db
                .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`)
                .doc(req.auth.uid);
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
        console.error("Error adding property:", error);
        throw new https.HttpsError("internal", "Internal error occurred");
    }
}
