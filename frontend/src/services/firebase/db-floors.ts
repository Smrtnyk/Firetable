import { floorDoc, floorsCollection } from "src/services/firebase/db";
import type { Floor } from "src/floor-manager/Floor";
import { getDoc, deleteDoc, updateDoc, addDoc } from "@firebase/firestore";
import { FloorDoc } from "src/types/floor";

export async function getFloor(floorID: string): Promise<FloorDoc | void> {
    const doc = await getDoc(floorDoc(floorID));
    if (doc.exists()) {
        return {
            id: doc.id,
            ...doc.data(),
        } as FloorDoc;
    }
}

export function deleteFloor(floorID: string) {
    return deleteDoc(floorDoc(floorID));
}

export function addFloor(floor: Omit<FloorDoc, "id">) {
    return addDoc(floorsCollection(), floor);
}
