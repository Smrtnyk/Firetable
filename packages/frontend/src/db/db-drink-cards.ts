import type { CreateDrinkCardPayload, CustomDrinkCardDoc, PDFDrinkCardDoc } from "@firetable/types";

import { isPDFDrinkCard } from "@firetable/types";
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { initializeFirebase } from "./base.js";
import { drinkCardsCollection } from "./db.js";
import { getDrinkCardPath } from "./paths.js";

/**
 * Creates a drink card with an optional PDF attachment.
 * Handles both document creation and PDF upload in a single operation.
 */
export async function createDrinkCard(
    organisationId: string,
    propertyId: string,
    card: CreateDrinkCardPayload,
    pdfFile?: File,
): Promise<void> {
    const cardId = await addDrinkCard(organisationId, propertyId, card);

    if (isPDFDrinkCard(card) && pdfFile) {
        const pdfUrl = await uploadPDF(organisationId, propertyId, cardId, pdfFile);
        await updateDrinkCard(organisationId, propertyId, cardId, { pdfUrl });
    }
}

/**
 * Deletes a drink card and its associated PDF if it exists.
 */
export async function deleteDrinkCard(
    organisationId: string,
    propertyId: string,
    cardId: string,
    type?: "custom" | "pdf",
): Promise<void> {
    const { firestore } = initializeFirebase();
    const cardRef = doc(firestore, getDrinkCardPath(organisationId, propertyId, cardId));

    // If it's a PDF card, delete the PDF file first
    if (type === "pdf") {
        await deletePDF(organisationId, propertyId, cardId);
    }

    await deleteDoc(cardRef);
}

/**
 * Updates an existing drink card in the Firestore database.
 */
export async function updateDrinkCard(
    organisationId: string,
    propertyId: string,
    cardId: string,
    card: Partial<CustomDrinkCardDoc | PDFDrinkCardDoc>,
): Promise<void> {
    const { firestore } = initializeFirebase();
    const cardRef = doc(firestore, getDrinkCardPath(organisationId, propertyId, cardId));

    await updateDoc(cardRef, {
        ...card,
        updatedAt: serverTimestamp(),
    });
}

export async function uploadPDF(
    organisationId: string,
    propertyId: string,
    cardId: string,
    file: File,
): Promise<string> {
    const { storage } = initializeFirebase();
    const pdfRef = ref(storage, `drink-cards/${organisationId}/${propertyId}/${cardId}.pdf`);

    await uploadBytes(pdfRef, file);
    return getDownloadURL(pdfRef);
}

/**
 * Adds a new drink card to the Firestore database.
 * Returns the ID of the created document.
 */
async function addDrinkCard(
    organisationId: string,
    propertyId: string,
    card: CreateDrinkCardPayload,
): Promise<string> {
    const docRef = await addDoc(drinkCardsCollection(organisationId, propertyId), {
        ...card,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
}

async function deletePDF(
    organisationId: string,
    propertyId: string,
    cardId: string,
): Promise<void> {
    const { storage } = initializeFirebase();
    const pdfRef = ref(storage, `drink-cards/${organisationId}/${propertyId}/${cardId}.pdf`);
    await deleteObject(pdfRef);
}
