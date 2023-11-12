import { default as admin } from "firebase-admin";
import * as functions from "firebase-functions";

const app =
    admin.apps.length === 0 ? admin.initializeApp(functions.config().firebase) : admin.app();

export const db = app.firestore();
export const auth = app.auth();
