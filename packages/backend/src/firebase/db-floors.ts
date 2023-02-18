import { floorDoc, floorsCollection } from "./db.js";
import { deleteDoc, addDoc } from "firebase/firestore";
import { FloorDoc } from "@firetable/types";

export function deleteFloor(floorID: string) {
    return deleteDoc(floorDoc(floorID));
}

export function addFloor(floor: Omit<FloorDoc, "id" | "json">) {
    return addDoc(floorsCollection(), floor);
}
