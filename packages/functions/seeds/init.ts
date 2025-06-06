import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { EMULATOR_HOST } from "./config.js";

initializeApp({
    projectId: "test-project",
});

const firestore = getFirestore();
firestore.settings({
    host: `${EMULATOR_HOST}:4000`,
    ssl: false,
});

process.env.FIREBASE_AUTH_EMULATOR_HOST = `${EMULATOR_HOST}:9099`;

export const auth = getAuth();
export const db = firestore;
