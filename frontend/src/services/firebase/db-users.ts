import { updateDoc } from "@firebase/firestore";
import { CreateUserPayload } from "src/types/auth";
import { userDoc } from "src/services/firebase/db";

export function updateUser(id: string, payload: Partial<CreateUserPayload>) {
    return updateDoc(userDoc(id), payload);
}
