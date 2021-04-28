import { floorDoc, floorsCollection } from "src/services/firebase/db";
import { FloorDoc } from "src/types";
import type { Floor } from "src/floor-manager/Floor";

export async function getFloor(floorID: string): Promise<FloorDoc | void> {
    const doc = await floorDoc(floorID).get();
    if (doc.exists) {
        return doc.data() as FloorDoc;
    }
}

export async function getFloors() {
    const floorsDocs = await floorsCollection().get();
    if (floorsDocs.empty) return [];
    return floorsDocs.docs.map((floor) => floor.data());
}

export function deleteFloor(floorID: string) {
    return floorDoc(floorID).delete();
}

export function saveFloor({ id, name, data, width, height }: Floor | FloorDoc) {
    return floorDoc(id).set({ id, name, data, width, height });
}
