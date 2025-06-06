import type { DocumentData, DocumentReference, Query, QueryConstraint } from "firebase/firestore";
import type { ComputedRef } from "vue";
import type {
    _RefFirestore,
    UseCollectionOptions,
    UseDocumentOptions,
    VueFirestoreDocumentData,
    VueFirestoreQueryData,
} from "vuefire";

import { isString } from "es-toolkit";
import { collection, doc, query, setDoc } from "firebase/firestore";
import { initializeFirebase } from "src/db";
import { useCollection, useDocument } from "vuefire";

export function createQuery<T>(
    collectionRefOrPath: any,
    ...queryConstraints: QueryConstraint[]
): Query<T> {
    if (isString(collectionRefOrPath)) {
        const { firestore } = initializeFirebase();
        const collectionRef = collection(firestore, collectionRefOrPath);
        // @ts-expect-error -- not sure why it complains, but it works like this
        return query<T, DocumentData>(collectionRef, ...queryConstraints);
    }

    return query<T, DocumentData>(collectionRefOrPath, ...queryConstraints);
}

export function getFirestoreDocument(path: string): DocumentReference {
    const { firestore } = initializeFirebase();
    return doc(firestore, path);
}

export function updateFirestoreDocument<T>(
    documentRef: DocumentReference<T>,
    updates: Partial<T>,
): Promise<void> {
    return setDoc<T, DocumentData>(documentRef, updates, {
        merge: true,
    });
}

export function useFirestoreCollection<T extends DocumentData>(
    path: ComputedRef<null | Query<T>> | Query<T> | string,
    options: UseCollectionOptions<T[]> = {},
): _RefFirestore<VueFirestoreQueryData<T>> {
    const mergedOpts = {
        ...options,
        maxRefDepth: 20,
    };
    const { firestore } = initializeFirebase();
    if (isString(path)) {
        return useCollection<T>(collection(firestore, path), mergedOpts);
    }
    return useCollection<T>(path, mergedOpts);
}

export function useFirestoreDocument<T>(
    path: string,
    options: UseDocumentOptions<T> = {},
): _RefFirestore<undefined | VueFirestoreDocumentData<T>> {
    const { firestore } = initializeFirebase();
    return useDocument<T>(doc(firestore, path), options);
}
