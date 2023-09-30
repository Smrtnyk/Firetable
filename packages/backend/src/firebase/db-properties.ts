import { PropertyDoc } from "@firetable/types";
import { deleteDoc } from "firebase/firestore";
import { propertyDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";

export type CreatePropertyPayload = Omit<PropertyDoc, "id" | "_doc">;

export function createNewProperty(propertyPayload: CreatePropertyPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable<CreatePropertyPayload, string>(
        functions,
        "createProperty",
    )(propertyPayload);
}

export function deleteProperty(propertyId: string) {
    return deleteDoc(propertyDoc(propertyId));
}
