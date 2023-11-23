import { OrganisationDoc, PropertyDoc } from "@firetable/types";
import { deleteDoc, getDocs } from "firebase/firestore";
import { propertiesCollection, propertyDoc } from "./db.js";
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

export async function fetchPropertiesForAdmin(
    organisations: OrganisationDoc[],
): Promise<PropertyDoc[]> {
    let allProperties: PropertyDoc[] = [];

    for (const organisationDoc of organisations) {
        const propertiesSnapshot = await getDocs(propertiesCollection(organisationDoc.id));
        const properties = propertiesSnapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as PropertyDoc,
        );
        allProperties = [...allProperties, ...properties];
    }

    return allProperties;
}
