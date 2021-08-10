import firebase from "firebase/compat/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import "firebase/compat/firestore";
import { getFunctions, connectFunctionsEmulator } from "@firebase/functions";

const { initializeApp } = firebase;
let app: firebase.app.App;

function setFirebaseApp(appObj: firebase.app.App) {
    app = appObj;
    if (location.hostname === "localhost") {
        app.firestore().useEmulator("localhost", 4000);
        connectAuthEmulator(auth(), "http://localhost:9099/");
        connectFunctionsEmulator(functions(), "localhost", 5001);
    }
}

export function getFirebaseApp() {
    return app;
}

export function functions() {
    return getFunctions(app, "europe-west3");
}

export function auth() {
    return getAuth(app);
}

export function firestore() {
    return app.firestore();
}

export function fBInit(config: Record<string, string>) {
    setFirebaseApp(initializeApp(config));
}
