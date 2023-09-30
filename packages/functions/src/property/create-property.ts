import * as functions from "firebase-functions";
import { db } from "../init.js";
import { Collection } from "../../types/types.js";

interface Data {
    name: string;
}

export async function createPropertyFn(data: Data, context: functions.https.CallableContext): Promise<string> {
    // Check for authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    // Create a club with data received from the client
    const clubData = {
        ...data,
        creatorId: context.auth.uid, // Adding the UID from the authenticated request
    };

    try {
        // Adding the club data to Firestore
        const propertyDocRef = await db.collection(Collection.PROPERTIES).add(clubData);
        const propertyId = propertyDocRef.id;

        // Add entry to userClubMap collection
        await db.collection(Collection.USER_PROPERTY_MAP).add({
            userId: context.auth.uid,
            propertyId: propertyId
        });

        return propertyId;
    } catch (error) {
        console.error("Error adding property to user:", error);
        throw new functions.https.HttpsError("internal", "Internal error occurred");
    }
}
