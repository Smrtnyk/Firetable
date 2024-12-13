import type { CreateDrinkCardPayload, PDFDrinkCardDoc } from "@firetable/types";
import { initializeFirebase } from "./base.js";
import { getDrinkCardPath } from "./paths.js";
import { drinkCardsCollection } from "./db.js";
import { isPDFDrinkCard } from "@firetable/types";
import { addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

/**
 * Adds a new drink card to the Firestore database.
 * Returns the ID of the created document.
 */
export async function addDrinkCard(
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
 * Updates an existing drink card in the Firestore database.
 */
export async function updateDrinkCard(
    organisationId: string,
    propertyId: string,
    cardId: string,
    card: Partial<PDFDrinkCardDoc>,
): Promise<void> {
    const { firestore } = initializeFirebase();
    const cardRef = doc(firestore, getDrinkCardPath(organisationId, propertyId, cardId));

    await updateDoc(cardRef, {
        ...card,
        updatedAt: serverTimestamp(),
    });
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

async function deletePDF(
    organisationId: string,
    propertyId: string,
    cardId: string,
): Promise<void> {
    const { storage } = initializeFirebase();
    const pdfRef = ref(storage, `drink-cards/${organisationId}/${propertyId}/${cardId}.pdf`);
    await deleteObject(pdfRef);
}
