import { Docref, CollectionRef, Query } from "./firestoreTypes";
import { Ref, ComputedRef } from "vue";

interface ReturnBase {
    /** The loading state of the data fetch. Will be true when an async data fetch operation is happening. Works reactively as expected. */
    loading: Ref<boolean>;
    /** A reactive boolean value to indicate if data has been received yet. Will be false as soon as data has been received and will stay false thereafter. */
    received: Ref<boolean>;
    /** A reactive string of the path with $variables replaced with the true variable value from the 'variables' input object */
    pathReplaced: ComputedRef<string>;
}

interface ReturnColl<T, M> extends ReturnBase {
    /** The data returned from the collection as a reactive array or an ampty array if no data has been fetched yet */
    data: Ref<T[]>;
    /** Reactive mutated data returned from the mutate() function. If no mutate function is passed, will be equal to 'data'. Will be undefined until initialised and 'received' === true */
    mutatedData: Ref<M | undefined>;
    /** A reactive computed prop that returns the firestore collection reference query */
    firestoreRef: ComputedRef<CollectionRef>;
    /** A reactive computed prop that returns the firestore Query if the 'query' input function is used, else it will be undefined */
    firestoreQuery: ComputedRef<Query | undefined>;
}

interface ReturnDoc<T, M> extends ReturnBase {
    /** The data returned from the doc as a reactive object or undefined if no data has been fetched yet */
    data: Ref<T | undefined>;
    /** Reactive mutated data returned from the mutate() function. If no mutate function is passed, will be equal to 'data'. Will be undefined until initialised and 'received' === true */
    mutatedData: Ref<M | undefined>;
    /** A reactive computed prop that returns the firestore DocumentReference */
    firestoreRef: ComputedRef<Docref>;
    /** Exposes a method for updating the doc via the current firestore DocumentReference. Uses the firestore().doc(pathReplaced).set() function with the { merge: true } options. This way, it can be used to set a new doc as well as update an existing */
    updateDoc: (updates: Partial<T>) => Promise<void>;
    /** Exposes a method for deleting the doc via the current firestore DocumentReference - firestore().doc(pathReplaced).delete() */
    deleteDoc: () => Promise<void>;
}

interface ReturnWatch extends ReturnBase {
    /** Exposes a function to initiate a firestore document/collection listener via the onSnapshot method. */
    watchData: () => void;
    /** Exposes a function for tearing down a firestore onSnapshot listener. Will be called on the onUnmounted hook of this component regardless of the manual mode setting. */
    stopWatchingData: () => void;
}

type GetDataColl<T, M> = {
    data: T[];
    mutatedData: M | undefined;
};

type GetDataDoc<T, M> = {
    data: T | undefined;
    mutatedData: M | undefined;
};

interface ReturnGetColl<T, M> extends ReturnBase {
    /** Exposes a function for getting data from firestore. firestore().collection(${path}).get */
    getData: () => Promise<GetDataColl<T, M> | undefined>;
}

interface ReturnGetDoc<T, M> extends ReturnBase {
    /** getData provides a function for getting data from firestore. firestore().doc(${path}).get */
    getData: () => Promise<GetDataDoc<T, M> | undefined>;
}

export type ReturnCollWatch<T, M> = ReturnColl<T, M> & ReturnWatch;
export type ReturnCollGet<T, M> = ReturnColl<T, M> & ReturnGetColl<T, M>;
export type ReturnDocWatch<T, M> = ReturnDoc<T, M> & ReturnWatch;
export type ReturnDocGet<T, M> = ReturnDoc<T, M> & ReturnGetDoc<T, M>;
