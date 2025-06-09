import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";
import type { FirebaseStorage } from "firebase/storage";

import { memoize } from "es-toolkit";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { getAI, GoogleAIBackend } from "firebase/vertexai";

import fbConfig from "./fb-config.json" with { type: "json" };

const ipAddressPattern =
    /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export const initializeFirebase = memoize(() => {
    const firebaseApp = initializeApp(fbConfig);
    const firestore = getFirestore(firebaseApp);
    const functions = getFunctions(firebaseApp, "europe-west3");
    const auth = getAuth(firebaseApp);
    const storage = getStorage(firebaseApp);
    const ai = getAI(firebaseApp, {
        backend: new GoogleAIBackend(),
    });
    if (location.hostname === "localhost" || ipAddressPattern.test(location.hostname)) {
        initEmulators(firestore, auth, functions, storage);
    }
    return { ai, auth, firebaseApp, firestore, functions, storage };
});

function initEmulators(
    firestore: Firestore,
    auth: Auth,
    functions: Functions,
    storage: FirebaseStorage,
): void {
    connectAuthEmulator(auth, `http://${location.hostname}:9099/`, { disableWarnings: true });
    connectFirestoreEmulator(firestore, location.hostname, 4000);
    connectFunctionsEmulator(functions, location.hostname, 5001);
    connectStorageEmulator(storage, location.hostname, 9199);
}
