import type { OrganisationDoc, PropertyDoc } from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";
import { propertiesCollection, propertyDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { deleteDoc, getDocs, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export type CreatePropertyPayload = {
    name: string;
    organisationId: string;
    img?: string;
};

export type UpdatePropertyPayload = {
    id: string;
    organisationId: string;
    name: string;
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

export function updateProperty(updatedProperty: UpdatePropertyPayload): Promise<void> {
    return updateDoc(
        propertyDoc(updatedProperty.id, updatedProperty.organisationId),
        updatedProperty,
    );
}

export function deleteProperty(property: PropertyDoc): Promise<void> {
    return deleteDoc(propertyDoc(property.id, property.organisationId));
}

export async function fetchPropertiesForAdmin(
    organisations: OrganisationDoc[],
): Promise<PropertyDoc[]> {
    const propertiesSnapshots = await Promise.all(
        organisations.map(function (org) {
            return getDocs(propertiesCollection(org.id));
        }),
    );

    return propertiesSnapshots.flatMap(function (snapshot) {
        return snapshot.docs.map(function (doc) {
            return { ...doc.data(), id: doc.id } as PropertyDoc;
        });
    });
}
