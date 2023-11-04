import { ADMIN, PropertyDoc, User } from "@firetable/types";
import { deleteDoc, getDocs, query, where } from "firebase/firestore";
import { organisationsCollection, propertiesCollection, propertyDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";

export type CreatePropertyPayload = {
    name: string;
    organisationId: string;
};

export function createNewProperty(
    propertyPayload: CreatePropertyPayload,
): Promise<HttpsCallableResult<string>> {
    const { functions } = initializeFirebase();
    return httpsCallable<CreatePropertyPayload, string>(
        functions,
        "createProperty",
    )(propertyPayload);
}

export function deleteProperty(property: PropertyDoc): Promise<void> {
    return deleteDoc(propertyDoc(property.id, property.organisationId));
}

export async function fetchPropertiesForUser(user: User, role?: string): Promise<PropertyDoc[]> {
    // If the user is an ADMIN or organisationId is falsy, fetch all properties across all organisations
    if (role === ADMIN || !user.organisationId) {
        const organisationsSnapshot = await getDocs(organisationsCollection());
        let allProperties: PropertyDoc[] = [];

        for (const organisationDoc of organisationsSnapshot.docs) {
            const propertiesSnapshot = await getDocs(propertiesCollection(organisationDoc.id));
            const properties = propertiesSnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id }) as PropertyDoc,
            );
            allProperties = [...allProperties, ...properties];
        }

        return allProperties;
    }

    // Rest of the logic for non-ADMIN users with a valid organisationId
    const propertiesRef = propertiesCollection(user.organisationId);
    const userPropertiesQuery = query(
        propertiesRef,
        where("relatedUsers", "array-contains", user.id),
    );
    const userPropertiesSnapshot = await getDocs(userPropertiesQuery);

    if (userPropertiesSnapshot.empty) {
        console.log("No properties found for the given user");
        return [];
    }

    return userPropertiesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as PropertyDoc);
}
