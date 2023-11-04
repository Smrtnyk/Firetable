import { OrganisationDoc } from "@firetable/types";
import { deleteDoc, getDocs, getDoc, addDoc } from "firebase/firestore";
import { organisationDoc, organisationsCollection } from "./db.js";

export interface CreateOrganisationPayload {
    name: string;
    maxAllowedProperties: number;
}

export async function createNewOrganisation(
    organisationPayload: CreateOrganisationPayload,
): Promise<string> {
    try {
        const docRef = await addDoc(organisationsCollection(), organisationPayload);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

export function deleteOrganisation(organisationId: string): Promise<void> {
    return deleteDoc(organisationDoc(organisationId));
}

export async function fetchOrganisationsForAdmin(): Promise<OrganisationDoc[]> {
    // If the user is an ADMIN, fetch all properties directly
    const propertiesSnapshot = await getDocs(organisationsCollection());
    return propertiesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as OrganisationDoc);
}

export async function fetchOrganisationById(
    organisationId: string,
): Promise<OrganisationDoc | null> {
    // New logic for non-ADMIN users
    const organisationDocSnapshot = await getDoc(organisationDoc(organisationId));

    if (!organisationDocSnapshot.exists()) {
        console.log("No organisation found for the given user");
        return null;
    }

    return {
        id: organisationDocSnapshot.id,
        ...organisationDocSnapshot.data(),
    } as OrganisationDoc;
}
