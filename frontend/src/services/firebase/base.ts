import { initializeApp, FirebaseApp } from "@firebase/app";
import { getAuth, connectAuthEmulator } from "@firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "@firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "@firebase/functions";

let app: FirebaseApp;

function setFirebaseApp(appObj: FirebaseApp) {
    app = appObj;
    initEmulators();
}

function initEmulators(): void {
    if (location.hostname !== "localhost") {
        return;
    }
    connectFirestoreEmulator(firestore(), "localhost", 4000);
    connectAuthEmulator(auth(), "http://localhost:9099/");
    connectFunctionsEmulator(functions(), "localhost", 5001);
}

export function functions() {
    return getFunctions(app, "europe-west3");
}

export function auth() {
    return getAuth(app);
}

export function firestore() {
    return getFirestore(app);
}

export function fBInit(config: Record<string, string>) {
    setFirebaseApp(initializeApp(config));
}
