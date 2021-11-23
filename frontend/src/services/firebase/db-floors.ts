import { floorDoc, floorsCollection } from "src/services/firebase/db";
import { deleteDoc, addDoc } from "@firebase/firestore";
import { FloorDoc } from "src/types/floor";

export function deleteFloor(floorID: string) {
    return deleteDoc(floorDoc(floorID));
}

export function addFloor(floor: Omit<FloorDoc, "id">) {
    return addDoc(floorsCollection(), floor);
}
