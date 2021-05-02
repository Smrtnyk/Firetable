import { computed, nextTick, onUnmounted, ref, Ref, watch } from "vue";

import {
    Options,
    OptionsCollGet,
    OptionsCollWatch,
    OptionsDocGet,
    OptionsDocWatch,
} from "./types/Options";
import {
    ReturnCollGet,
    ReturnCollWatch,
    ReturnDocGet,
    ReturnDocWatch,
} from "./types/Return";

// Type gates
import {
    firestoreRefIsDoc,
    optsAreColl,
    optsAreGet,
} from "./types/type-guards";
import { getFirebaseApp } from "src/services/firebase/base";
import { CollectionRef, Docref, DocumentData } from "src/types/firebase";

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
    // get firebase and make sure it's setup
    const firebase = getFirebaseApp();
    if (!firebase) {
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

    // Path replaced computation
    const pathReplaced = computed(() => {
        const { path, variables } = options;
        const stringVars = path.replace(/\s/g, "").match(/\$[^\W]*/g);
        if (!stringVars?.length || !variables) return path;
        let newPath = path;
        for (const x of stringVars) {
            const instanceVal = variables[x.split("$").join("")].value;
            if (
                !["number", "string"].includes(typeof instanceVal) ||
                instanceVal === ""
            ) {
                newPath = "";
                break;
            } else {
                newPath = newPath.replace(x, `${instanceVal}`);
            }
        }
        return newPath.startsWith("/")
            ? newPath.endsWith("/")
                ? newPath.substr(1).substr(0, newPath.length - 2)
                : newPath.substr(1)
            : newPath;
    });

    // firestore Ref computation
    function createComputedFirestoreRef() {
        if (optsAreColl(options)) {
            return computed(() =>
                firebase.firestore().collection(pathReplaced.value)
            );
        } else {
            return computed(() => firebase.firestore().doc(pathReplaced.value));
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
        } else {
            return null;
        }
    });

    function updateDoc(updates: Partial<T>) {
        if (firestoreRefIsDoc(firestoreRef.value)) {
            return firestoreRef.value.set(updates, { merge: true });
        }
        return Promise.resolve();
    }

    function deleteDoc() {
        if (firestoreRefIsDoc(firestoreRef.value)) {
            return firestoreRef.value.delete();
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
        return {
            data: receivedData,
            mutatedData: mutatedData.value,
        };
    }

    async function getDocData() {
        try {
            const firestoreRefVal = firestoreRef.value as Docref;
            const doc = await firestoreRefVal.get();

            if (!doc.exists) {
                return;
            }

            return receiveDocData(firestoreDocSerializer(doc));
        } catch (e) {
            if (options.onError) {
                options.onError(e);
            }
        }

        return void 0;
    }

    async function getCollData() {
        try {
            const firestoreRefVal = firestoreQuery.value
                ? firestoreQuery.value
                : (firestoreRef.value as CollectionRef);
            const collection = await firestoreRefVal.get();
            let colData: T[] = [];
            if (collection.size) {
                colData = collection.docs.map(firestoreDocSerializer);
            }
            return receiveCollData(colData);
        } catch (e) {
            if (options.onError) {
                options.onError(e);
            }
        }
    }

    let watcher: null | (() => void) = null;
    const watchData = () => {
        try {
            if (firestoreRefIsDoc(firestoreRef.value)) {
                watcher = firestoreRef.value.onSnapshot((doc) => {
                    receiveDocData(
                        doc.exists ? firestoreDocSerializer(doc) : undefined
                    );
                });
            } else {
                const firestoreRefVal =
                    firestoreQuery.value !== null
                        ? firestoreQuery.value
                        : (firestoreRef.value as CollectionRef);
                watcher = firestoreRefVal.onSnapshot((collection) => {
                    receiveCollData(
                        collection.size
                            ? collection.docs.map(firestoreDocSerializer)
                            : []
                    );
                });
            }
        } catch (e) {
            if (options.onError) {
                options.onError(e);
            }
        }
    };

    const stopWatchingData = () => {
        if (watcher !== null) {
            watcher();
        }
    };

    if (options.type === "watch") {
        onUnmounted(stopWatchingData);
    }

    const debounceDataGetter = () => {
        void nextTick(() => {
            if (!firestoreRef.value) {
                return;
            }

            loading.value = true;
            if (optsAreGet(options)) {
                if (optsAreColl(options)) {
                    void getCollData();
                } else {
                    void getDocData();
                }
            } else {
                stopWatchingData();
                watchData();
            }
        });
    };

    watch(
        pathReplaced,
        (v) => {
            if (options.manual) return;
            if (v) {
                debounceDataGetter();
            } else {
                stop();
            }
        },
        { immediate: true }
    );

    function firestoreDocSerializer(doc: DocumentData): T {
        return {
            id: doc.id,
            ...doc.data(),
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

    if (optsAreColl(options)) {
        if (optsAreGet(options)) {
            return {
                ...returnVal,
                data: collectionData,
                getData: getCollData,
                firestoreQuery,
            };
        } else {
            return {
                ...returnVal,
                data: collectionData,
                watchData,
                stopWatchingData,
                firestoreQuery,
            };
        }
    } else if (optsAreGet(options)) {
        return {
            ...returnVal,
            data,
            getData: getDocData,
        };
    } else {
        return {
            ...returnVal,
            data,
            watchData,
            stopWatchingData,
        };
    }
}
