import type { OrganisationDoc, OrganisationStatus } from "@firetable/types";

import { addDoc, deleteDoc, getDoc, getDocs } from "firebase/firestore";

import { organisationDoc, organisationsCollection } from "./db.js";

export interface CreateOrganisationPayload {
    maxAllowedProperties: number;
    name: string;
    status: OrganisationStatus;
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

export async function fetchOrganisationById(
    organisationId: string,
): Promise<null | OrganisationDoc> {
    const organisationDocSnapshot = await getDoc(organisationDoc(organisationId));

    if (!organisationDocSnapshot.exists()) {
        return null;
    }

    return {
        id: organisationDocSnapshot.id,
        ...organisationDocSnapshot.data(),
    } as OrganisationDoc;
}

export async function fetchOrganisationsForAdmin(): Promise<OrganisationDoc[]> {
    const propertiesSnapshot = await getDocs(organisationsCollection());
    return propertiesSnapshot.docs.map(function (document) {
        return { ...document.data(), id: document.id } as OrganisationDoc;
    });
}
