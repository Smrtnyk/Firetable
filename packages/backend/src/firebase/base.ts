import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";
import fbConfig from "./fb-config.json";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { memoize } from "es-toolkit";

const ipAddressPattern =
    /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export const initializeFirebase = memoize(() => {
    const firebaseApp = initializeApp(fbConfig);
    const firestore = getFirestore(firebaseApp);
    const functions = getFunctions(firebaseApp, "europe-west3");
    const auth = getAuth(firebaseApp);
    if (location.hostname === "localhost" || ipAddressPattern.test(location.hostname)) {
        initEmulators(firestore, auth, functions);
    }
    return { firestore, auth, functions, firebaseApp };
});

function initEmulators(firestore: Firestore, auth: Auth, functions: Functions): void {
    connectAuthEmulator(auth, `http://${location.hostname}:9099/`, { disableWarnings: true });
    connectFirestoreEmulator(firestore, location.hostname, 4000);
    connectFunctionsEmulator(functions, location.hostname, 5001);
}
