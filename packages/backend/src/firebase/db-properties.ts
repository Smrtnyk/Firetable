import { ADMIN, PropertyDoc } from "@firetable/types";
import { deleteDoc, getDocs, query, where } from "firebase/firestore";
import { propertiesCollection, propertyDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";

export type CreatePropertyPayload = Omit<PropertyDoc, "id" | "_doc" | "relatedUsers">;

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

export async function fetchPropertiesForUser(
    userId: string,
    role?: string,
): Promise<PropertyDoc[]> {
    // If the user is an ADMIN, fetch all properties directly
    if (role === ADMIN) {
        const propertiesSnapshot = await getDocs(propertiesCollection());
        return propertiesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as PropertyDoc);
    }

    // New logic for non-ADMIN users
    const propertiesRef = propertiesCollection();
    const userPropertiesQuery = query(
        propertiesRef,
        where("relatedUsers", "array-contains", userId),
    );
    const userPropertiesSnapshot = await getDocs(userPropertiesQuery);

    if (userPropertiesSnapshot.empty) {
        console.log("No properties found for the given user");
        return [];
    }

    return userPropertiesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as PropertyDoc);
}
