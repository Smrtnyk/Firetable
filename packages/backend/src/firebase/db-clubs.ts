import { ClubDoc } from "@firetable/types";
import { addDoc } from "firebase/firestore";
import { clubsCollection } from "./db.js";

export type CreateClubPayload = Omit<ClubDoc, "id" | "_doc">;

export function createNewClub(clubPayload: CreateClubPayload) {
    return addDoc(clubsCollection(), clubPayload);
}
