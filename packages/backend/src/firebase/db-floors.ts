import { floorDoc, floorsCollection } from "./db.js";
import { deleteDoc, addDoc } from "firebase/firestore";
import { FloorDoc, PropertyDoc } from "@firetable/types";

export function deleteFloor(property: Pick<PropertyDoc, "organisationId" | "id">, floorID: string) {
    return deleteDoc(floorDoc(property, floorID));
}

export function addFloor(
    property: Pick<PropertyDoc, "organisationId" | "id">,
    floor: Partial<FloorDoc> & Pick<FloorDoc, "name">,
) {
    return addDoc(floorsCollection(property.organisationId, property.id), floor);
}
