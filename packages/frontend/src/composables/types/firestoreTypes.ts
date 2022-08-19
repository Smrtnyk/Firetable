import {
    DocumentReference,
    DocumentData,
    CollectionReference,
    Query as FirestoreQuery,
} from "firebase/firestore";

/** Firestore DocumentReference */
export type Docref = DocumentReference;
/** Firestore CollectionReference */
export type CollectionRef = CollectionReference;
/** Firestore Query */
export type Query = FirestoreQuery<DocumentData>;
