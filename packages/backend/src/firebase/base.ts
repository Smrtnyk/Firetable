import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, Functions } from "firebase/functions";
import fbConfig from "./fb-config.json";

let initialized = false;

export function initializeFirebase() {
    const firebaseApp = initializeApp(fbConfig);
    const firestore = getFirestore(firebaseApp);
    const functions = getFunctions(firebaseApp, "europe-west3");
    const auth = getAuth(firebaseApp);
    initEmulators(firestore, auth, functions);
    initialized = true;
    return { firestore, auth, functions, firebaseApp };
}

function initEmulators(firestore: Firestore, auth: Auth, functions: Functions): void {
    if (location.hostname !== "localhost" || initialized) {
        return;
    }
    connectAuthEmulator(auth, "http://localhost:9099/", { disableWarnings: true });
    connectFirestoreEmulator(firestore, "localhost", 4000);
    connectFunctionsEmulator(functions, "localhost", 5001);
}
