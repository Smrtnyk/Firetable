import { default as admin } from "firebase-admin";

const app = admin.apps.length === 0 ? admin.initializeApp() : admin.app();

export const db = app.firestore();
export const auth = app.auth();
