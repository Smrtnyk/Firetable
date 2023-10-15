import { initializeFirebase } from "./base.js";
import { usersCollection } from "./db.js";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { doc, updateDoc } from "firebase/firestore";
import { signOut, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { CreateUserPayload, EditUserPayload, User } from "@firetable/types";

export function createUserWithEmail(payload: CreateUserPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "createUser")(payload);
}

export function updateUser(payload: EditUserPayload) {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "updateUser")(payload);
}

export function updateUserField<T extends keyof CreateUserPayload>(
    uid: string,
    field: T,
    value: CreateUserPayload[T],
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

export function fetchUsersByRole(userIdsToFetch: string[]): Promise<HttpsCallableResult<User[]>> {
    const { functions } = initializeFirebase();
    return httpsCallable<string[], User[]>(functions, "fetchUsersByRole")(userIdsToFetch);
}
