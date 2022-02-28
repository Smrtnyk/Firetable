import { floorDoc, floorsCollection } from "./db";
import { deleteDoc, addDoc } from "@firebase/firestore";
import { FloorDoc } from "@firetable/types";

export function deleteFloor(floorID: string) {
    return deleteDoc(floorDoc(floorID));
}

export function addFloor(floor: Omit<FloorDoc, "id">) {
    return addDoc(floorsCollection(), floor);
}
