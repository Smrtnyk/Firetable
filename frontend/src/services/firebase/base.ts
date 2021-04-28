import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/firebase-functions";

const { initializeApp } = firebase;

let app: firebase.app.App;

function setFirebaseApp(appObj: firebase.app.App) {
    app = appObj;
    if (location.hostname === "localhost") {
        app.firestore().useEmulator("localhost", 4000);
        app.auth().useEmulator("http://localhost:9099/");
        app.functions("europe-west3").useEmulator("localhost", 5001);
    }
}

export function getFirebaseApp() {
    return app;
}

export function functions() {
    return app.functions("europe-west3");
}

export function auth() {
    return app.auth();
}

export function firestore() {
    return app.firestore();
}

export function fBInit(config: Record<string, string>) {
    setFirebaseApp(initializeApp(config));
}
