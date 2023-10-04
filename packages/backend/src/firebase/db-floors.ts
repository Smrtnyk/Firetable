import { floorDoc, floorsCollection } from "./db.js";
import { deleteDoc, addDoc } from "firebase/firestore";
import { FloorDoc } from "@firetable/types";

export function deleteFloor(floorID: string) {
    return deleteDoc(floorDoc(floorID));
}

export function addFloor(floor: Partial<FloorDoc> & Pick<FloorDoc, "name">) {
    return addDoc(floorsCollection(), floor);
}
