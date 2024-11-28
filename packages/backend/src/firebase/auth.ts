import type { HttpsCallableResult } from "firebase/functions";
import type { UserCredential } from "firebase/auth";
import type { CreateUserPayload, EditUserPayload, User } from "@firetable/types";
import { initializeFirebase } from "./base.js";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

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
    organisationId: string;
};
export async function fetchUsersByRole(organisationId: string): Promise<User[]> {
    const { functions } = initializeFirebase();
    const result = await httpsCallable<FetchUsersByRoleRequestData, User[]>(
        functions,
        "fetchUsersByRole",
    )({ organisationId });

    return result.data;
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
