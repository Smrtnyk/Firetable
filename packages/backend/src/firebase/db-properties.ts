import { ADMIN, PropertyDoc, User } from "@firetable/types";
import { deleteDoc, getDocs, query, where } from "firebase/firestore";
import { organisationsCollection, propertiesCollection, propertyDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";

export type CreatePropertyPayload = {
    name: string;
    organisationId: string;
    img?: string;
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

// Fetches all properties for Admin users across all organizations
async function fetchPropertiesForAdmin(): Promise<PropertyDoc[]> {
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

async function fetchPropertiesForNonAdmin(user: User): Promise<PropertyDoc[]> {
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

export async function fetchPropertiesForUser(user: User): Promise<PropertyDoc[]> {
    if (user.role === ADMIN) {
        return fetchPropertiesForAdmin();
    } else {
        return fetchPropertiesForNonAdmin(user);
    }
}
