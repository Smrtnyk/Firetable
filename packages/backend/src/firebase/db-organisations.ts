import type { OrganisationDoc, OrganisationSettings } from "@firetable/types";
import { organisationDoc, organisationsCollection } from "./db.js";
import { deleteDoc, getDocs, getDoc, addDoc, updateDoc } from "firebase/firestore";

export interface CreateOrganisationPayload {
    name: string;
    maxAllowedProperties: number;
}

export async function createNewOrganisation(
    organisationPayload: CreateOrganisationPayload,
): Promise<string> {
    const docRef = await addDoc(organisationsCollection(), organisationPayload);
    return docRef.id;
}

export function deleteOrganisation(organisationId: string): Promise<void> {
    return deleteDoc(organisationDoc(organisationId));
}

export async function fetchOrganisationsForAdmin(): Promise<OrganisationDoc[]> {
    const propertiesSnapshot = await getDocs(organisationsCollection());
    return propertiesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as OrganisationDoc);
}

export async function fetchOrganisationById(
    organisationId: string,
): Promise<OrganisationDoc | null> {
    const organisationDocSnapshot = await getDoc(organisationDoc(organisationId));

    if (!organisationDocSnapshot.exists()) {
        return null;
    }

    return {
        id: organisationDocSnapshot.id,
        ...organisationDocSnapshot.data(),
    } as OrganisationDoc;
}

export function updateOrganisationSettings(
    organisationId: string,
    newSettings: OrganisationSettings,
): Promise<void> {
    const updatePayload: Partial<OrganisationDoc> = { settings: newSettings };
    return updateDoc(organisationDoc(organisationId), updatePayload);
}
