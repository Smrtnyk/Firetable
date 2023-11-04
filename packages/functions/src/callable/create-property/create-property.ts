import * as functions from "firebase-functions";
import { db } from "../../init.js";
import { ADMIN, Collection } from "../../../types/types.js";
import { FieldValue } from "firebase-admin/firestore";

interface Data {
    name: string;
    organisationId: string;
}

export async function createPropertyFn(
    data: Data,
    context: functions.https.CallableContext,
): Promise<string> {
    // Check for authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    if (!data.organisationId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "organisationId is missing in property payload",
        );
    }

    // Create a property with data received from the client
    const propertyData = {
        ...data,
        creatorId: context.auth.uid, // Adding the UID from the authenticated request
    };

    try {
        const { organisationId } = data;
        // Adding the property data to Firestore
        const propertyDocRef = await db
            .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}`)
            .add(propertyData);
        const propertyId = propertyDocRef.id;

        const userClaims = context.auth.token;

        // If user is not an admin, associate the property with the user
        if (userClaims.role !== ADMIN) {
            const userRef = db
                .collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`)
                .doc(context.auth.uid);
            await userRef.update({
                relatedProperties: FieldValue.arrayUnion(propertyId),
            });

            // Add the user to relatedUsers of the property
            await propertyDocRef.update({
                relatedUsers: FieldValue.arrayUnion(context.auth.uid),
            });
        }

        return propertyId;
    } catch (error) {
        console.error("Error adding property:", error);
        throw new functions.https.HttpsError("internal", "Internal error occurred");
    }
}
