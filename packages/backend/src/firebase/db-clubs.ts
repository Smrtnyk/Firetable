import { ClubDoc } from "@firetable/types";
import { addDoc, deleteDoc } from "firebase/firestore";
import { clubDoc, clubsCollection } from "./db.js";

export type CreateClubPayload = Omit<ClubDoc, "id" | "_doc">;

export function createNewClub(clubPayload: CreateClubPayload) {
    return addDoc(clubsCollection(), clubPayload);
}

export function deleteClub(clubId: string) {
    return deleteDoc(clubDoc(clubId));
}
