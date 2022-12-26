import { updateDoc } from "firebase/firestore";
import { userDoc } from "./db.js";
import { CreateUserPayload } from "@firetable/types";

export function updateUser(id: string, payload: Partial<CreateUserPayload>) {
    return updateDoc(userDoc(id), payload);
}
