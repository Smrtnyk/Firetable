import {
    DocumentReference,
    DocumentData,
    CollectionReference,
    Query as FirestoreQuery,
} from "@firebase/firestore";

/** Firestore DocumentReference */
export type Docref = DocumentReference<DocumentData>;
/** Firestore CollectionReference */
export type CollectionRef = CollectionReference<DocumentData>;
/** Firestore Query */
export type Query = FirestoreQuery<DocumentData>;
