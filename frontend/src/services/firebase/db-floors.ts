import { floorDoc, floorsCollection } from "src/services/firebase/db";
import { FloorDoc } from "src/types";
import type { Floor } from "src/floor-manager/Floor";
import {
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    addDoc,
} from "@firebase/firestore";

export async function getFloor(floorID: string): Promise<FloorDoc | void> {
    const doc = await getDoc(floorDoc(floorID));
    if (doc.exists()) {
        return doc.data() as FloorDoc;
    }
}

export async function getFloors() {
    const floorsDocs = await getDocs(floorsCollection());
    if (floorsDocs.empty) return [];
    return floorsDocs.docs.map((floor) => floor.data());
}

export function deleteFloor(floorID: string) {
    return deleteDoc(floorDoc(floorID));
}

export function saveFloor({ id, name, data, width, height }: Floor | FloorDoc) {
    return updateDoc(floorDoc(id), { id, name, data, width, height });
}

export function addFloor(floor: Omit<FloorDoc, "id">) {
    return addDoc(floorsCollection(), floor);
}
