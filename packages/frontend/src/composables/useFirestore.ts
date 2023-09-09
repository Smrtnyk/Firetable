import {
    collection,
    doc,
    query as firestoreQuery,
    Query,
    DocumentData,
    setDoc,
    DocumentReference,
} from "firebase/firestore";
import { initializeFirebase } from "@firetable/backend";
import { useCollection, useDocument } from "vuefire";
import { isString } from "@firetable/utils";

export function useFirestoreCollection<T extends DocumentData>(
    path: string | Query<T>,
    options = {},
) {
    const mergedOpts = { ...options, maxRefDepth: 20 };
    const { firestore } = initializeFirebase();
    if (isString(path)) {
        return useCollection<T>(collection(firestore, path), mergedOpts);
    }
    return useCollection<T>(path, mergedOpts);
}

export function useFirestoreDocument<T>(path: string, options = {}) {
    const { firestore } = initializeFirebase();
    return useDocument<T>(doc(firestore, path), options);
}

export function updateFirestoreDocument<T>(documentRef: DocumentReference<T>, updates: Partial<T>) {
    return setDoc<T, DocumentData>(documentRef, updates, {
        merge: true,
    });
}

export function getFirestoreCollection(path: string) {
    const { firestore } = initializeFirebase();
    return collection(firestore, path);
}

export function getFirestoreDocument(path: string) {
    const { firestore } = initializeFirebase();
    return doc(firestore, path);
}

export function createQuery<T>(collectionRef: any, ...queries: any[]) {
    return firestoreQuery<T, DocumentData>(collectionRef, ...queries);
}
