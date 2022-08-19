import { initializeFirebase } from "./base";
import { usersCollection } from "./db";
import { httpsCallable } from "firebase/functions";
import { doc, updateDoc } from "firebase/firestore";
import { signOut, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { CreateUserPayload } from "@firetable/types";

export function createUserWithEmail(payload: CreateUserPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "createUser")(payload);
}

export function updateUserField<T extends keyof CreateUserPayload>(
    uid: string,
    field: T,
    value: CreateUserPayload[T]
) {
    return updateDoc(doc(usersCollection(), uid), {
        [field]: value,
    });
}

export function deleteUser(id: string) {
    const { functions } = initializeFirebase();
    const deleteFunction = httpsCallable(functions, "deleteUser");
    return deleteFunction(id);
}

export function logoutUser() {
    const { auth } = initializeFirebase();
    return signOut(auth);
}

export function loginWithEmail(email: string, password: string): Promise<UserCredential> {
    const { auth } = initializeFirebase();
    return signInWithEmailAndPassword(auth, email, password);
}
