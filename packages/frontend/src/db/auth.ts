import type { CreateUserPayload, EditUserPayload, User } from "@firetable/types";
import type { UserCredential } from "firebase/auth";
import type { HttpsCallableResult } from "firebase/functions";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

import { initializeFirebase } from "./base.js";

type FetchUsersByRoleRequestData = {
    organisationId: string;
};

export function createUserWithEmail(
    payload: CreateUserPayload,
): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "createUser")(payload);
}

export function deleteUser(user: User): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    const deleteFunction = httpsCallable(functions, "deleteUser");
    return deleteFunction(user);
}

export async function fetchUsersByRole(organisationId: string): Promise<User[]> {
    const { functions } = initializeFirebase();
    const result = await httpsCallable<FetchUsersByRoleRequestData, User[]>(
        functions,
        "fetchUsersByRole",
    )({ organisationId });

    return result.data;
}

export function loginWithEmail(email: string, password: string): Promise<UserCredential> {
    const { auth } = initializeFirebase();
    return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser(): Promise<void> {
    const { auth } = initializeFirebase();
    return signOut(auth);
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

export function updateUser(payload: EditUserPayload): Promise<HttpsCallableResult<unknown>> {
    const { functions } = initializeFirebase();
    return httpsCallable(functions, "updateUser")(payload);
}
