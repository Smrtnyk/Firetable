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
    organisationId: string,
    uid: string,
    field: T,
    value: CreateUserPayload[T],
) {
    return updateDoc(doc(usersCollection(organisationId), uid), {
        [field]: value,
    });
}

export function deleteUser(user: User) {
    const { functions } = initializeFirebase();
    const deleteFunction = httpsCallable(functions, "deleteUser");
    return deleteFunction(user);
}

export function logoutUser() {
    const { auth } = initializeFirebase();
    return signOut(auth);
}

export function loginWithEmail(email: string, password: string): Promise<UserCredential> {
    const { auth } = initializeFirebase();
    return signInWithEmailAndPassword(auth, email, password);
}

export function fetchUsersByRole(
    userIdsToFetch: string[],
    organisationId: string,
): Promise<HttpsCallableResult<User[]>> {
    const { functions } = initializeFirebase();
    return httpsCallable<{ userIdsToFetch: string[]; organisationId: string }, User[]>(
        functions,
        "fetchUsersByRole",
    )({ userIdsToFetch, organisationId });
}

export function submitNewPassword(newPassword: string) {
    if (!newPassword) return; // Add more validations if needed
    const { functions } = initializeFirebase();
    const changePassword = httpsCallable(functions, "changePassword");
    return changePassword({ newPassword });
}
