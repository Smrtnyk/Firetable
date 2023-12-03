import type { DocumentReference } from "firebase/firestore";
import type { FloorDoc, PropertyDoc } from "@firetable/types";
import { floorDoc, floorsCollection } from "./db.js";
import { deleteDoc, addDoc } from "firebase/firestore";

export function deleteFloor(
    property: Pick<PropertyDoc, "organisationId" | "id">,
    floorID: string,
): Promise<void> {
    return deleteDoc(floorDoc(property, floorID));
}

export function addFloor(
    property: Pick<PropertyDoc, "organisationId" | "id">,
    floor: Partial<FloorDoc> & Pick<FloorDoc, "name">,
): Promise<DocumentReference> {
    return addDoc(floorsCollection(property.organisationId, property.id), floor);
}
