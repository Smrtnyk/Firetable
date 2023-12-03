import { initializeFirebase } from "./base.js";
import type { HttpsCallableResult } from "firebase/functions";
import { httpsCallable } from "firebase/functions";
import type { UserCredential } from "firebase/auth";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import type { CreateUserPayload, EditUserPayload, User } from "@firetable/types";

export function createUserWithEmail(
    payload: CreateUserPayload,
): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "createUser")(payload);
}

export function updateUser(payload: EditUserPayload): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "updateUser")(payload);
}

export function deleteUser(user: User): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    const deleteFunction = httpsCallable(functions, "deleteUser");
    return deleteFunction(user);
}

export function logoutUser(): Promise<void> {
    const { auth } = initializeFirebase();
    return signOut(auth);
}

export function loginWithEmail(email: string, password: string): Promise<UserCredential> {
    const { auth } = initializeFirebase();
    return signInWithEmailAndPassword(auth, email, password);
}

type FetchUsersByRoleRequestData = {
    userIdsToFetch: string[];
    organisationId: string;
};
export function fetchUsersByRole(
    userIdsToFetch: string[],
    organisationId: string,
): Promise<HttpsCallableResult<User[]>> {
    const { functions } = initializeFirebase();
    return httpsCallable<FetchUsersByRoleRequestData, User[]>(
        functions,
        "fetchUsersByRole",
    )({ userIdsToFetch, organisationId });
}

export function submitNewPassword(
    newPassword: string,
): Promise<HttpsCallableResult<unknown>> | undefined {
    if (!newPassword) {
        return;
    }
    const { functions } = initializeFirebase();
    const changePassword = httpsCallable(functions, "changePassword");
    return changePassword({ newPassword });
}
