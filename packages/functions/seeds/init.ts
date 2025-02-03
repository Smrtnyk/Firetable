import { default as admin } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cert: any = {};
try {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error,@typescript-eslint/ban-ts-comment -- special one
    // @ts-ignore -- optional, seed might not be used at all
    cert = await import("./cert.json");
} catch (e) {
    console.error("❌ Error loading cert.json. Check README.md for more info.", e);
}

initializeApp({
    credential: admin.credential.cert(cert),
});

const firestore = getFirestore();
firestore.settings({
    host: "localhost:4000",
    ssl: false,
});

process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

export const auth = getAuth();
export const db = firestore;
