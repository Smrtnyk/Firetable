import { computed, nextTick, onUnmounted, ref, Ref, watch } from "vue";

import {
    Options,
    OptionsCollGet,
    OptionsCollWatch,
    OptionsDocGet,
    OptionsDocWatch,
} from "./types/Options";
import { ReturnCollGet, ReturnCollWatch, ReturnDocGet, ReturnDocWatch } from "./types/Return";

// Type gates
import {
    firestoreRefIsDoc,
    optsAreColl,
    optsAreGet,
    optsAreGetColl,
    optsAreGetDoc,
    optsAreWatchColl,
} from "./types/type-guards";
import { firestore, getFirebaseApp } from "src/services/firebase/base";
import { CollectionRef } from "src/types/firebase";
import {
    DocumentReference,
    DocumentData,
    onSnapshot,
    collection,
    doc,
    setDoc,
    deleteDoc as FirestoreDeleteDoc,
    getDoc,
    getDocs,
} from "@firebase/firestore";
import { NOOP } from "src/helpers/utils";
import { showErrorMessage } from "src/helpers/ui-helpers";

// Overload Watch Collection
export function useFirestore<T, M = T>(
    options: { queryType: "collection"; type: "watch" } & Options<T, M>
): ReturnCollWatch<T, M>;

// Overload Get Collection
export function useFirestore<T, M = T>(
    options: { queryType: "collection"; type: "get" } & Options<T, M>
): ReturnCollGet<T, M>;

// Overload Watch Doc
export function useFirestore<T, M = T>(
    options: { queryType: "doc"; type: "watch" } & Options<T, M>
): ReturnDocWatch<T, M>;

// Overload Get Doc
export function useFirestore<T, M = T>(
    options: { queryType: "doc"; type: "get" } & Options<T, M>
): ReturnDocGet<T, M>;

// The function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFirestore<T, M = T>(options: Options<T, M>): any {
    if (!getFirebaseApp()) {
        throw new Error(
            "[Firestore-Composable] Error: No default firebase app found. Please initialize firebase before calling useFirestore"
        );
    }

    const data: Ref<T | undefined> = ref();
    const collectionData: Ref<T[]> = ref([]);
    const mutatedData: Ref<undefined | M> = ref();
    const initialLoading = options.initialLoading ?? true;
    const loading = ref<boolean>(initialLoading);
    const received = ref(false);
    const onFinished = options.onFinished ?? NOOP;
    const inComponent = options.inComponent ?? true;

    // Path replaced computation
    const pathReplaced = computed(() => {
        const { path, variables } = options;
        const stringVars = path.replace(/\s/g, "").match(/\$[^\W]*/g);
        if (!stringVars?.length || !variables) return path;
        let newPath = path;
        for (const x of stringVars) {
            const instanceVal = variables[x.split("$").join("")].value;
            if (!["number", "string"].includes(typeof instanceVal) || instanceVal === "") {
                newPath = "";
                break;
            } else {
                newPath = newPath.replace(x, `${instanceVal}`);
            }
        }
        if (newPath.startsWith("/")) {
            if (newPath.endsWith("/")) {
                return newPath.substr(1).substr(0, newPath.length - 2);
            }
            return newPath.substr(1);
        }
        return newPath;
    });

    // firestore Ref computation
    function createComputedFirestoreRef() {
        if (optsAreColl(options)) {
            return computed(() => collection(firestore(), pathReplaced.value));
        } else {
            return computed(() => doc(firestore(), pathReplaced.value));
        }
    }

    const firestoreRef = createComputedFirestoreRef();

    const firestoreQuery = computed(() => {
        if (
            optsAreColl(options) &&
            !firestoreRefIsDoc(firestoreRef.value) &&
            options.query !== undefined
        ) {
            return options.query(firestoreRef.value);
        }
        return null;
    });

    function updateDoc(updates: Partial<T>) {
        if (firestoreRefIsDoc(firestoreRef.value)) {
            return setDoc<DocumentData>(firestoreRef.value, updates, {
                merge: true,
            });
        }
        return Promise.resolve();
    }

    function deleteDoc() {
        if (firestoreRefIsDoc(firestoreRef.value)) {
            return FirestoreDeleteDoc(firestoreRef.value);
        }
        return Promise.resolve();
    }

    function receiveCollData(receivedData: T[]) {
        const opts = options as OptionsCollWatch<T, M> | OptionsCollGet<T, M>;
        if (opts.mutate) {
            mutatedData.value = opts.mutate(receivedData);
        }

        if (opts.onReceive) {
            opts.onReceive(receivedData, mutatedData.value);
        }

        collectionData.value = receivedData;
        received.value = true;
        loading.value = false;
        onFinished(receivedData);
        return {
            data: receivedData,
            mutatedData: mutatedData.value,
        };
    }

    function receiveDocData(receivedData: T | undefined) {
        const opts = options as OptionsDocGet<T, M> | OptionsDocWatch<T, M>;
        if (opts.mutate) {
            mutatedData.value = opts.mutate(receivedData);
        }

        if (opts.onReceive) {
            opts.onReceive(receivedData, mutatedData.value);
        }

        data.value = receivedData;
        received.value = true;
        loading.value = false;
        onFinished(receivedData);
        return {
            data: receivedData,
            mutatedData: mutatedData.value,
        };
    }

    async function getDocData() {
        try {
            const firestoreRefVal =
                firestoreRef.value as unknown as DocumentReference<DocumentData>;

            const fetchedDoc = await getDoc(firestoreRefVal);

            if (!fetchedDoc.exists) {
                return;
            }

            return receiveDocData(firestoreDocSerializer(fetchedDoc));
        } catch (e) {
            if (options.onError) {
                options.onError(e);
            }
        }
    }

    async function getCollData() {
        try {
            const firestoreRefVal = firestoreQuery.value
                ? firestoreQuery.value
                : (firestoreRef.value as unknown as CollectionRef);

            const fetchedCollection = await getDocs(firestoreRefVal);
            let colData: T[] = [];
            if (fetchedCollection.size) {
                colData = fetchedCollection.docs.map(firestoreDocSerializer);
            }
            return receiveCollData(colData);
        } catch (e) {
            if (options.onError) {
                options.onError(e);
            }
        }
    }

    let watcher: null | (() => void) = null;
    function watchData() {
        try {
            if (firestoreRefIsDoc(firestoreRef.value)) {
                watcher = onSnapshot(firestoreRef.value, (receivedDoc) => {
                    receiveDocData(
                        receivedDoc.exists() ? firestoreDocSerializer(receivedDoc) : undefined
                    );
                });
            } else {
                const firestoreRefVal =
                    firestoreQuery.value !== null
                        ? firestoreQuery.value
                        : (firestoreRef.value as unknown as CollectionRef);

                watcher = onSnapshot(firestoreRefVal, (receivedCollection) => {
                    receiveCollData(
                        receivedCollection.size
                            ? receivedCollection.docs.map(firestoreDocSerializer)
                            : []
                    );
                });
            }
        } catch (e) {
            if (options.onError) {
                options.onError(e);
            }
        }
    }

    function stopWatchingData() {
        if (watcher !== null) {
            watcher();
        }
    }

    if (options.type === "watch" && inComponent) {
        onUnmounted(stopWatchingData);
    }

    function debounceDataGetter() {
        nextTick(() => {
            if (!firestoreRef.value) {
                return;
            }

            loading.value = true;
            if (optsAreGet(options)) {
                if (optsAreColl(options)) {
                    getCollData().catch(showErrorMessage);
                } else {
                    getDocData().catch(showErrorMessage);
                }
            } else {
                stopWatchingData();
                watchData();
            }
        }).catch(NOOP);
    }

    watch(
        pathReplaced,
        (v) => {
            if (options.manual) {
                return;
            }
            if (v) {
                debounceDataGetter();
            } else {
                stop();
            }
        },
        { immediate: true }
    );

    function firestoreDocSerializer(docToSerialize: DocumentData): T {
        return {
            id: docToSerialize.id,
            ...docToSerialize.data(),
        };
    }

    const returnVal = {
        mutatedData,
        loading,
        received,
        pathReplaced,
        firestoreRef,
        updateDoc,
        deleteDoc,
    };

    if (optsAreGetColl(options)) {
        return {
            ...returnVal,
            data: collectionData,
            getData: getCollData,
            firestoreQuery,
        };
    }

    if (optsAreWatchColl(options)) {
        return {
            ...returnVal,
            data: collectionData,
            watchData,
            stopWatchingData,
            firestoreQuery,
        };
    }

    if (optsAreGetDoc(options)) {
        return {
            ...returnVal,
            data,
            getData: getDocData,
        };
    }

    return {
        ...returnVal,
        data,
        watchData,
        stopWatchingData,
    };
}
