import * as functions from "firebase-functions";
import { db } from "../../init.js";
import { Collection } from "../../../types/types.js";

interface Data {
    name: string;
}

/**
 * Creates a new property in the Firestore database, and establishes an association
 * between the property and the user (PROPERTY_OWNER) who created it.
 *
 * @param data - The data for the new property.
 * @param data.name - The name of the new property.
 * @param context - The context of the callable function, provided by Firebase Functions.
 *                  This includes details about the authenticated user making the request.
 *
 * @throws - Throws an "unauthenticated" error if the user is not authenticated.
 * @throws - Throws an "internal" error if there's an issue with database operations.
 *
 * @returns - A promise that resolves to the ID of the newly created property.
 *
 * @description
 * When this function is called:
 * 1. It checks if the user is authenticated. If not, it throws an error.
 * 2. It creates a new property document in the PROPERTIES collection with the provided data.
 * 3. It associates the authenticated user (PROPERTY_OWNER) with the newly created property
 *    by adding a document to the USER_PROPERTY_MAP collection.
 */
export async function createPropertyFn(data: Data, context: functions.https.CallableContext): Promise<string> {
    // Check for authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    // Create a property with data received from the client
    const propertyData = {
        ...data,
        creatorId: context.auth.uid, // Adding the UID from the authenticated request
    };

    try {
        // Adding the property data to Firestore
        const propertyDocRef = await db.collection(Collection.PROPERTIES).add(propertyData);
        const propertyId = propertyDocRef.id;

        // Add entry to userPropertyMap collection for the creator (assumed to be a PROPERTY_OWNER)
        await db.collection(Collection.USER_PROPERTY_MAP).add({
            userId: context.auth.uid,
            propertyId: propertyId
        });

        return propertyId;
    } catch (error) {
        console.error("Error adding property:", error);
        throw new functions.https.HttpsError("internal", "Internal error occurred");
    }
}
