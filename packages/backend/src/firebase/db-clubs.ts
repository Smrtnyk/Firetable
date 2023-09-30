import { ClubDoc } from "@firetable/types";
import { deleteDoc } from "firebase/firestore";
import { clubDoc } from "./db.js";
import { initializeFirebase } from "./base.js";
import { httpsCallable } from "firebase/functions";

export type CreateClubPayload = Omit<ClubDoc, "id" | "_doc">;

export function createNewClub(clubPayload: CreateClubPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable<CreateClubPayload, string>(functions, "createProperty")(clubPayload);
}

export function deleteClub(clubId: string) {
    return deleteDoc(clubDoc(clubId));
}
