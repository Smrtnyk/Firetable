import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const app = admin.initializeApp(functions.config().firebase);

export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage().bucket();
