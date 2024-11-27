import type {
    CreatePropertyPayload,
    OrganisationDoc,
    PropertyDoc,
    PropertySettings,
    UpdatePropertyPayload,
} from "@firetable/types";
import type { HttpsCallableResult } from "firebase/functions";
import { propertiesCollection, propertyDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { deleteDoc, getDocs, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export function createNewProperty(
    propertyPayload: CreatePropertyPayload,
): Promise<HttpsCallableResult<string>> {
    const { functions } = initializeFirebase();
    return httpsCallable<CreatePropertyPayload, string>(
        functions,
        "createProperty",
    )(propertyPayload);
}

export function updateProperty(
    propertyPayload: UpdatePropertyPayload,
): Promise<HttpsCallableResult> {
    const { functions } = initializeFirebase();
    return httpsCallable<UpdatePropertyPayload, unknown>(
        functions,
        "updateProperty",
    )(propertyPayload);
}

export async function updatePropertySettings(
    organisationId: string,
    propertyId: string,
    settings: PropertySettings,
): Promise<void> {
    await updateDoc(propertyDoc(propertyId, organisationId), { settings });
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
