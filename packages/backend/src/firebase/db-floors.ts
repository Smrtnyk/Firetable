import type { DocumentReference } from "firebase/firestore";
import type { FloorDoc, PropertyDoc } from "@firetable/types";
import { floorDoc, floorsCollection } from "./db.js";
import { deleteDoc, addDoc } from "firebase/firestore";

export function deleteFloor(
    property: Pick<PropertyDoc, "id" | "organisationId">,
    floorID: string,
): Promise<void> {
    return deleteDoc(floorDoc(property, floorID));
}

export function addFloor(
    owner: Pick<PropertyDoc, "id" | "organisationId">,
    floor: Partial<FloorDoc> & Pick<FloorDoc, "name" | "propertyId">,
): Promise<DocumentReference> {
    return addDoc(floorsCollection(owner.organisationId, owner.id), floor);
}
