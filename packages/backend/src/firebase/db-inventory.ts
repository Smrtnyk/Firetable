import type { CreateInventoryItemPayload } from "@firetable/types";
import { initializeFirebase } from "./base.js";
import { getInventoryPath } from "./paths.js";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";

/**
 * Adds a new inventory item to the Firestore database.
 * @param organisationId - The organisation ID.
 * @param propertyId - The property ID.
 * @param item - The inventory item data to add.
 * @throws Will throw an error if the operation fails.
 */
export async function addInventoryItem(
    organisationId: string,
    propertyId: string,
    item: CreateInventoryItemPayload,
): Promise<void> {
    const { firestore } = initializeFirebase();

    const inventoryCollection = collection(firestore, getInventoryPath(organisationId, propertyId));

    await addDoc(inventoryCollection, item);
}

/**
 * Deletes an inventory item from the Firestore database.
 * @param organisationId - The ID of the organisation.
 * @param propertyId - The ID of the property.
 * @param itemId - The ID of the inventory item to delete.
 * @throws Will throw an error if the operation fails.
 */
export async function deleteInventoryItem(
    organisationId: string,
    propertyId: string,
    itemId: string,
): Promise<void> {
    const { firestore } = initializeFirebase();

    const itemDocRef = doc(firestore, `${getInventoryPath(organisationId, propertyId)}/${itemId}`);

    await deleteDoc(itemDocRef);
}

/**
 * Updates an existing inventory item in the Firestore database.
 * @param organisationId - The ID of the organisation.
 * @param propertyId - The ID of the property.
 * @param itemId - The ID of the inventory item to update.
 * @param itemPayload - The inventory item data to update.
 * @throws Will throw an error if the operation fails.
 */
export async function updateInventoryItem(
    organisationId: string,
    propertyId: string,
    itemId: string,
    itemPayload: CreateInventoryItemPayload,
): Promise<void> {
    const { firestore } = initializeFirebase();

    const itemDocRef = doc(firestore, `${getInventoryPath(organisationId, propertyId)}/${itemId}`);

    await updateDoc(itemDocRef, itemPayload);
}
