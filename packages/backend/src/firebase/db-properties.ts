import { PropertyDoc } from "@firetable/types";
import { deleteDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { propertyDoc, userPropertyMapCollection } from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";

export type CreatePropertyPayload = Omit<PropertyDoc, "id" | "_doc">;

export function createNewProperty(propertyPayload: CreatePropertyPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable<CreatePropertyPayload, string>(
        functions,
        "createProperty",
    )(propertyPayload);
}

export function deleteProperty(propertyId: string) {
    return deleteDoc(propertyDoc(propertyId));
}

export async function fetchPropertiesForUser(userId: string): Promise<PropertyDoc[]> {
    // First Query: Get all user-property mappings for a specific userId
    const userPropertyMapRef = userPropertyMapCollection();
    const userPropertiesQuery = query(userPropertyMapRef, where("userId", "==", userId));
    const userPropertiesSnapshot = await getDocs(userPropertiesQuery);

    if (userPropertiesSnapshot.empty) {
        console.log("No properties found for the given user");
        return [];
    }

    // Extract propertyIds from the query results
    const propertyIds: string[] = [];
    userPropertiesSnapshot.forEach((doc) => {
        const data = doc.data();
        propertyIds.push(data.propertyId);
    });

    // Second Query: Get all properties where propertyId is in propertyIds
    const properties: PropertyDoc[] = [];

    for (const propertyId of propertyIds) {
        const propertyRef = propertyDoc(propertyId);
        const propertyDocRes = await getDoc(propertyRef);
        if (propertyDocRes.exists()) {
            properties.push(propertyDocRes.data() as PropertyDoc);
        }
    }

    console.log("Properties:", properties);
    return properties;
}
