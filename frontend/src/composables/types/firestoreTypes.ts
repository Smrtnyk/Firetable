import type firebase from "firebase/app";

/** Firestore DocumentReference */
export type Docref =
    firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
/** Firestore CollectionReference */
export type CollectionRef =
    firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
/** Firestore Query */
export type Query = firebase.firestore.Query<firebase.firestore.DocumentData>;
