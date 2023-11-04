import { floorDoc, floorsCollection } from "./db.js";
import { deleteDoc, addDoc, DocumentReference } from "firebase/firestore";
import { FloorDoc, PropertyDoc } from "@firetable/types";

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
